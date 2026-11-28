import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type {
    AttachedEnvironment,
    AttachedEnvironmentExecResult,
    AttachedEnvironmentRequestData,
    AttachedEnvironmentResult,
} from 'nexa-protocol/environments/AttachedEnvironmentTypes.js';
import type { JsonValue } from 'nexa-protocol/json/JsonValue.js';
import { afterEach, describe, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import {
    AttachedEnvironmentFailure,
    AttachedEnvironmentHost,
    type AttachedEnvironmentHandlers,
    type AttachedEnvironmentRequestContext,
} from '../src/environments/AttachedEnvironmentHost.js';
import { AttachedEnvironmentResults } from '../src/environments/AttachedEnvironmentResults.js';
import { NodeDirectoryEnvironment } from '../src/environments/NodeDirectoryEnvironment.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import { isEventData } from '../src/protocol/Events.js';
import { hello, TestGateway, type Request } from './Support.js';

/** A gateway peer that attaches environments and records every answer it receives. */
class EnvironmentGateway {
    public readonly gateway: TestGateway = new TestGateway({
        ...hello,
        features: { ...hello.features, attachedEnvironments: true },
    });
    public readonly answers: Request[] = [];
    public readonly detached: string[] = [];
    #socket: WebSocket | undefined;
    #next: number = 0;
    readonly #waiters: Map<string, (result: JsonValue) => void> = new Map();

    public constructor() {
        this.gateway.handler = (socket: WebSocket, request: Request): void => {
            this.#socket = socket;
            if (request.method === 'environments.attach') {
                this.#next += 1;
                const environment: AttachedEnvironment = {
                    id: `attached:test-${String(this.#next)}`,
                    name: String(request.params['name']),
                    platform: 'linux',
                    root: String(request.params['root']),
                };
                socket.send(JSON.stringify({ id: request.id, ok: true, result: environment }));
                return;
            }
            if (request.method === 'environments.respond') {
                this.answers.push(request);
                socket.send(
                    JSON.stringify({ id: request.id, ok: true, result: { accepted: true } }),
                );
                const requestId: string = String(request.params['requestId']);
                const result: JsonValue | undefined = request.params['result'];
                if (result !== undefined) {
                    this.#waiters.get(requestId)?.(result);
                }
                this.#waiters.delete(requestId);
                return;
            }
            if (request.method === 'environments.detach') {
                this.detached.push(String(request.params['id']));
                socket.send(
                    JSON.stringify({ id: request.id, ok: true, result: { accepted: true } }),
                );
            }
        };
    }

    /** Sends one request event and resolves with the client's answer. */
    public ask(data: AttachedEnvironmentRequestData): Promise<JsonValue> {
        const socket: WebSocket | undefined = this.#socket;
        if (socket === undefined) {
            throw new Error('No client attached yet');
        }
        const answered: Promise<JsonValue> = new Promise((resolve): void => {
            this.#waiters.set(data.requestId, resolve);
        });
        this.#next += 1;
        socket.send(JSON.stringify({ event: 'environment.request', seq: 100 + this.#next, data }));
        return answered;
    }
}

/** Handlers that answer from fixed values and record what they were asked. */
function handlers(log: string[] = []): AttachedEnvironmentHandlers {
    return {
        exec: (operation): Promise<AttachedEnvironmentExecResult> => {
            log.push(`exec ${operation.command}`);
            return Promise.resolve({
                kind: 'exec',
                exitCode: 3,
                signal: null,
                timedOut: false,
                stdout: `ran ${operation.command}`,
                stderr: '',
            });
        },
        read: (operation) =>
            operation.path.endsWith('missing')
                ? Promise.reject(new AttachedEnvironmentFailure('not-found', 'no such file'))
                : Promise.resolve({ kind: 'read', data: Buffer.from('hello').toString('base64') }),
        write: () => Promise.reject(new Error('disk full')),
        list: () => Promise.resolve({ kind: 'list', entries: [{ name: 'a', type: 'file' }] }),
        stat: () =>
            Promise.resolve({ kind: 'stat', type: 'file', size: 5, modifiedAt: 1, mode: 0o644 }),
        remove: () => Promise.resolve({ kind: 'done' }),
    };
}

let peer: EnvironmentGateway | undefined;
let client: NexaClient | undefined;
const directories: string[] = [];
afterEach(async (): Promise<void> => {
    client?.close();
    await peer?.gateway.close();
    peer = undefined;
    client = undefined;
    for (const directory of directories.splice(0)) {
        await rm(directory, { recursive: true, force: true });
    }
});

/** Connects a client to a fresh environment-serving peer. */
async function connect(): Promise<NexaClient> {
    peer = new EnvironmentGateway();
    client = await NexaClient.connect({ url: await peer.gateway.url(), reconnect: false });
    return client;
}

describe('environment.request events', (): void => {
    it('validates the event payload against the wire schema', (): void => {
        const valid: AttachedEnvironmentRequestData = {
            environmentId: 'attached:one',
            requestId: 'request-1',
            operation: { kind: 'stat', path: '/work' },
        };
        expect(isEventData('environment.request', valid)).toBe(true);
        expect(
            isEventData('environment.request', { ...valid, operation: { kind: 'format' } }),
        ).toBe(false);
        expect(isEventData('environment.request', { ...valid, requestId: '' })).toBe(false);
    });
});

describe('AttachedEnvironmentHost', (): void => {
    it('refuses gateways that do not serve attached environments', async (): Promise<void> => {
        const gateway: TestGateway = new TestGateway();
        const plain: NexaClient = await NexaClient.connect({
            url: await gateway.url(),
            reconnect: false,
        });
        try {
            await expect(
                AttachedEnvironmentHost.attach(
                    plain,
                    { name: 'x', platform: 'linux', root: '/x' },
                    handlers(),
                ),
            ).rejects.toThrow('Attached environments require an updated Nexa gateway');
        } finally {
            plain.close();
            await gateway.close();
        }
    });

    it('answers each operation through environments.respond', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        const host: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(
            connected,
            { name: 'CI', platform: 'linux', root: '/work' },
            handlers(),
        );
        expect(host.id).toBe('attached:test-1');
        const exec: JsonValue = await (peer as EnvironmentGateway).ask({
            environmentId: host.id,
            requestId: 'r-exec',
            operation: { kind: 'exec', command: 'make test', cwd: '/work' },
        });
        expect(exec).toEqual({
            kind: 'exec',
            exitCode: 3,
            signal: null,
            timedOut: false,
            stdout: 'ran make test',
            stderr: '',
        });
        const read: JsonValue = await (peer as EnvironmentGateway).ask({
            environmentId: host.id,
            requestId: 'r-read',
            operation: { kind: 'read', path: '/work/file' },
        });
        expect(read).toEqual({ kind: 'read', data: 'aGVsbG8=' });
        await host.detach();
        expect(peer?.detached).toEqual(['attached:test-1']);
    });

    it('turns thrown failures into error answers', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        const host: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(
            connected,
            { name: 'CI', platform: 'linux', root: '/work' },
            handlers(),
        );
        await expect(
            (peer as EnvironmentGateway).ask({
                environmentId: host.id,
                requestId: 'r-missing',
                operation: { kind: 'read', path: '/work/missing' },
            }),
        ).resolves.toEqual({ kind: 'error', code: 'not-found', message: 'no such file' });
        await expect(
            (peer as EnvironmentGateway).ask({
                environmentId: host.id,
                requestId: 'r-write',
                operation: { kind: 'write', path: '/work/f', data: '' },
            }),
        ).resolves.toEqual({ kind: 'error', code: 'failed', message: 'disk full' });
        await host.detach();
    });

    it('routes requests of several environments on one connection to their own handlers', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        const first: string[] = [];
        const second: string[] = [];
        const one: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(
            connected,
            { name: 'one', platform: 'linux', root: '/one' },
            handlers(first),
        );
        const two: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(
            connected,
            { name: 'two', platform: 'linux', root: '/two' },
            handlers(second),
        );
        await Promise.all(
            [one, two, one, two].map(
                (host: AttachedEnvironmentHost, index: number): Promise<JsonValue> =>
                    (peer as EnvironmentGateway).ask({
                        environmentId: host.id,
                        requestId: `r-${String(index)}`,
                        operation: { kind: 'exec', command: `job-${String(index)}`, cwd: '/' },
                    }),
            ),
        );
        expect(first.sort()).toEqual(['exec job-0', 'exec job-2']);
        expect(second.sort()).toEqual(['exec job-1', 'exec job-3']);
        await one.detach();
        await two.detach();
    });

    it('aborts handlers still running when it detaches', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        let observed: AbortSignal | undefined;
        const slow: AttachedEnvironmentHandlers = {
            ...handlers(),
            exec: (
                _operation,
                context: AttachedEnvironmentRequestContext,
            ): Promise<AttachedEnvironmentExecResult> => {
                observed = context.signal;
                return new Promise((_resolve, reject): void => {
                    context.signal.addEventListener('abort', (): void => {
                        reject(new Error('stopped'));
                    });
                });
            },
        };
        const host: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(
            connected,
            { name: 'slow', platform: 'linux', root: '/' },
            slow,
        );
        void (peer as EnvironmentGateway).ask({
            environmentId: host.id,
            requestId: 'r-slow',
            operation: { kind: 'exec', command: 'sleep', cwd: '/' },
        });
        await expect.poll((): number => host.active).toBe(1);
        await host.detach();
        expect(observed?.aborted).toBe(true);
        expect(host.active).toBe(0);
        expect(peer?.answers).toHaveLength(0);
    });
});

describe('AttachedEnvironmentResults.fit', (): void => {
    it('keeps the end of command output that would not fit one frame', (): void => {
        const result: AttachedEnvironmentResult = AttachedEnvironmentResults.fit(
            {
                kind: 'exec',
                exitCode: 1,
                signal: null,
                timedOut: false,
                stdout: `${'x'.repeat(50_000)}END`,
                stderr: 'tail of errors',
            },
            20_000,
        );
        expect(result.kind).toBe('exec');
        if (result.kind !== 'exec') {
            return;
        }
        expect(result.stdout.endsWith('END')).toBe(true);
        expect(result.stdout).toMatch(/^\[\d+ earlier characters omitted\]\n/u);
        expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThanOrEqual(20_000);
        expect(result.stderr).toBe('tail of errors');
    });

    it('answers a file too large for one frame with failed', (): void => {
        expect(
            AttachedEnvironmentResults.fit({ kind: 'read', data: 'A'.repeat(40_000) }, 20_000),
        ).toMatchObject({ kind: 'error', code: 'failed' });
    });
});

describe('NodeDirectoryEnvironment', (): void => {
    /** A served temporary directory, removed after the test. */
    async function served(): Promise<NodeDirectoryEnvironment> {
        const root: string = await mkdtemp(join(tmpdir(), 'nexa-transport-environment-'));
        directories.push(root);
        return new NodeDirectoryEnvironment({ root, killGraceMs: 100 });
    }
    const context: AttachedEnvironmentRequestContext = {
        signal: new AbortController().signal,
        environment: { id: 'attached:local', name: 'local', platform: 'linux', root: '/' },
        requestId: 'local',
    };

    it('reports exit codes and output of shell commands and argv programs', async (): Promise<void> => {
        const local: NodeDirectoryEnvironment = await served();
        await expect(
            local.exec(
                { kind: 'exec', command: 'echo out; echo err >&2; exit 7', cwd: local.root },
                context,
            ),
        ).resolves.toEqual({
            kind: 'exec',
            exitCode: 7,
            signal: null,
            timedOut: false,
            stdout: 'out\n',
            stderr: 'err\n',
        });
        await expect(
            local.exec(
                {
                    kind: 'exec',
                    command: process.execPath,
                    argv: ['-e', 'process.stdout.write(process.cwd())'],
                    cwd: local.root,
                },
                context,
            ),
        ).resolves.toMatchObject({ exitCode: 0, stdout: local.root });
    });

    it('stops a command at its timeout and reports it', async (): Promise<void> => {
        const local: NodeDirectoryEnvironment = await served();
        const started: number = performance.now();
        await expect(
            local.exec(
                { kind: 'exec', command: 'sleep 30', cwd: local.root, timeoutMs: 100 },
                context,
            ),
        ).resolves.toMatchObject({ kind: 'exec', exitCode: null, timedOut: true });
        expect(performance.now() - started).toBeLessThan(10_000);
    });

    it('reads, writes, lists, describes and removes files inside its root', async (): Promise<void> => {
        const local: NodeDirectoryEnvironment = await served();
        const path: string = join(local.root, 'nested', 'file.txt');
        await local.write({
            kind: 'write',
            path,
            data: Buffer.from('content').toString('base64'),
            parents: true,
        });
        expect(await readFile(path, 'utf8')).toBe('content');
        await expect(local.read({ kind: 'read', path })).resolves.toEqual({
            kind: 'read',
            data: Buffer.from('content').toString('base64'),
        });
        await expect(
            local.list({ kind: 'list', path: join(local.root, 'nested') }),
        ).resolves.toEqual({ kind: 'list', entries: [{ name: 'file.txt', type: 'file' }] });
        await expect(local.stat({ kind: 'stat', path })).resolves.toMatchObject({
            kind: 'stat',
            type: 'file',
            size: 7,
        });
        await local.remove({ kind: 'remove', path: join(local.root, 'nested'), recursive: true });
        await expect(local.stat({ kind: 'stat', path })).rejects.toMatchObject({
            code: 'not-found',
        });
    });

    it('refuses paths outside its root and reports missing programs', async (): Promise<void> => {
        const local: NodeDirectoryEnvironment = await served();
        await writeFile(join(local.root, 'inside'), 'x');
        await expect(local.read({ kind: 'read', path: '/etc/hostname' })).rejects.toMatchObject({
            code: 'denied',
        });
        await expect(
            local.exec({ kind: 'exec', command: 'ls', cwd: '/' }, context),
        ).rejects.toMatchObject({ code: 'denied' });
        await expect(
            local.exec(
                { kind: 'exec', command: 'nexa-no-such-program', argv: [], cwd: local.root },
                context,
            ),
        ).rejects.toMatchObject({ code: 'not-found' });
    });
});
