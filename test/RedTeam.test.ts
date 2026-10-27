import { describe, expect, it } from 'vitest';
import {
    RedTeamClient,
    type RedTeamGateway,
    type RedTeamRequestMap,
} from '../src/redteam/RedTeamClient.js';
import { RedTeamCodec } from '../src/redteam/RedTeamCodec.js';
import { RedTeamRequestCodec } from '../src/redteam/RedTeamRequestCodec.js';
import {
    RedTeamMethod,
    type RedTeamEffort,
    type RedTeamStartRequest,
    type RedTeamSnapshot,
} from '../src/redteam/RedTeamTypes.js';
import type { CallOptions } from '../src/interface/ClientOptions.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import { hello, TestGateway, type Request } from './Support.js';
import type { WebSocket } from 'ws';

const start: RedTeamStartRequest = {
    effortId: 'effort-1',
    title: 'Owned project',
    source: { kind: 'github', url: 'https://github.com/example/project' },
    rules: 'Test the supplied project within the agreed scope.',
};
const effort: RedTeamEffort = {
    ...start,
    parallelism: 8,
    status: 'running',
    revision: '1',
    createdAtMs: '1792627200000',
    updatedAtMs: '1792627200000',
    sessionKey: 'session-1',
    taskCount: '1',
    findingCount: '1',
    error: null,
};
const snapshot: RedTeamSnapshot = {
    effort,
    agents: [
        {
            agentId: 'worker-1',
            sessionKey: 'worker-session-1',
            status: 'running',
            taskId: 'task-1',
            activity: 'Checking dependencies',
        },
    ],
    tasks: [
        {
            taskId: 'task-1',
            title: 'Dependencies',
            description: 'Verify installed versions',
            status: 'running',
            agentId: 'worker-1',
            updatedAtMs: effort.updatedAtMs,
        },
    ],
    findings: [
        {
            findingId: 'finding-1',
            title: 'Candidate issue',
            severity: 'high',
            status: 'pending',
            cvssScore: '8.1',
            description: 'A candidate requiring verification.',
            affectedComponent: 'dependency',
            agentId: 'worker-1',
            evidence: [{ fileId: 'evidence-1', description: 'Captured output' }],
            reproduction: ['Inspect the attached evidence'],
            updatedAtMs: effort.updatedAtMs,
        },
    ],
    nextTaskCursor: null,
    nextFindingCursor: null,
};

class Gateway implements RedTeamGateway {
    public calls: number = 0;
    public method: RedTeamMethod | null = null;
    public options: CallOptions | null = null;
    public constructor(public reply: unknown = effort) {}
    public request<M extends RedTeamMethod>(
        method: M,
        _params: RedTeamRequestMap[M],
        options: CallOptions,
    ): Promise<unknown> {
        this.calls += 1;
        this.method = method;
        this.options = options;
        return Promise.resolve(this.reply);
    }
}

describe('red team controls', (): void => {
    it('defaults to eight workers and accepts every slider integer through fifty', (): void => {
        expect(RedTeamRequestCodec.start(start).parallelism).toBe(8);
        for (let parallelism: number = 1; parallelism <= 50; parallelism += 1) {
            expect(RedTeamRequestCodec.start({ ...start, parallelism }).parallelism).toBe(
                parallelism,
            );
        }
    });
    it.each([0, 51, 1.5, NaN, Infinity, '8', null, undefined])(
        'rejects invalid explicit parallelism %s',
        (parallelism: unknown): void => {
            expect((): RedTeamStartRequest =>
                RedTeamRequestCodec.start({ ...start, parallelism }),
            ).toThrow();
        },
    );
    it.each([
        'http://github.com/example/project',
        'https://github.com.evil.test/example/project',
        'https://user:secret@github.com/example/project',
        'https://github.com/example/project?token=secret',
        'https://github.com/example/project/tree/main',
        'https://github.com/example/..',
    ])('rejects nonrepository or credential-bearing source %s', (url: string): void => {
        expect((): RedTeamStartRequest =>
            RedTeamRequestCodec.start({ ...start, source: { kind: 'github', url } }),
        ).toThrow();
    });
    it('accepts uploaded opaque identities and rejects duplicates and empty selections', (): void => {
        expect(
            RedTeamRequestCodec.source({ kind: 'files', fileIds: ['file-1', 'file-2'] }),
        ).toEqual({ kind: 'files', fileIds: ['file-1', 'file-2'] });
        expect((): void => {
            RedTeamRequestCodec.source({ kind: 'files', fileIds: [] });
        }).toThrow();
        expect((): void => {
            RedTeamRequestCodec.source({ kind: 'files', fileIds: ['file-1', 'file-1'] });
        }).toThrow();
    });
    it('rejects extra owner fields, accessors, malformed Unicode and oversized inputs', (): void => {
        expect((): void => {
            RedTeamRequestCodec.start({ ...start, ownerId: 'other' });
        }).toThrow();
        const accessor: Record<string, unknown> = { ...start };
        Object.defineProperty(accessor, 'title', {
            get: (): string => {
                throw new Error('Getter must not execute');
            },
        });
        expect((): void => {
            RedTeamRequestCodec.start(accessor);
        }).toThrow('accessors');
        expect((): void => {
            RedTeamRequestCodec.start({ ...start, title: '\uD800' });
        }).toThrow();
        expect((): void => {
            RedTeamRequestCodec.start({ ...start, rules: 'x'.repeat(64_001) });
        }).toThrow();
        expect((): void => {
            RedTeamRequestCodec.start({
                ...start,
                source: { kind: 'files', fileIds: new Array<string>(101).fill('file') },
            });
        }).toThrow();
    });
    it('requires revision-pinned continuations and nonempty compare-and-set updates', (): void => {
        expect((): void => {
            RedTeamRequestCodec.get({
                effortId: 'effort-1',
                revision: null,
                taskCursor: 'task-1',
                findingCursor: null,
            });
        }).toThrow('pinned');
        expect((): void => {
            RedTeamRequestCodec.update({ effortId: 'effort-1', expectedRevision: '1' });
        }).toThrow('empty');
        expect(
            RedTeamRequestCodec.update({
                effortId: 'effort-1',
                expectedRevision: '9007199254740993',
                parallelism: 50,
            }).expectedRevision,
        ).toBe('9007199254740993');
    });
});

describe('red team receipts', (): void => {
    it('round-trips task, finding, evidence and Chat session references', (): void => {
        expect(RedTeamCodec.snapshot(snapshot)).toEqual(snapshot);
    });
    it('rejects duplicate identities, inconsistent counts and empty continuations', (): void => {
        expect((): void => {
            RedTeamCodec.snapshot({
                ...snapshot,
                agents: [...snapshot.agents, ...snapshot.agents],
            });
        }).toThrow('Duplicate');
        expect((): void => {
            RedTeamCodec.snapshot({ ...snapshot, effort: { ...effort, findingCount: '0' } });
        }).toThrow('Inconsistent');
        expect((): void => {
            RedTeamCodec.snapshot({ ...snapshot, tasks: [], nextTaskCursor: 'cursor' });
        }).toThrow('Inconsistent');
        expect((): void => {
            RedTeamCodec.list({ items: [], next: 'cursor' });
        }).toThrow('Empty');
    });
    it('retains exact revision integers while rejecting unsafe, negative and noncanonical forms', (): void => {
        expect(RedTeamCodec.effort({ ...effort, revision: '9007199254740993' }).revision).toBe(
            '9007199254740993',
        );
        for (const revision of ['-1', '01', '9223372036854775808', 9007199254740992]) {
            expect((): void => {
                RedTeamCodec.effort({ ...effort, revision });
            }).toThrow();
        }
    });
    it.each(['10.1', '8.12', '-1', 'NaN', 8.1])(
        'rejects invalid CVSS score %s',
        (cvssScore: unknown): void => {
            const finding: unknown = snapshot.findings[0];
            expect((): void => {
                RedTeamCodec.finding({ ...RedTeamCodec.finding(finding), cvssScore });
            }).toThrow('CVSS');
        },
    );
    it('drops stale progress without changing effort or session identity', (): void => {
        expect(RedTeamCodec.advance(snapshot, snapshot)).toBe(snapshot);
        expect(
            RedTeamCodec.advance(snapshot, { ...snapshot, effort: { ...effort, revision: '2' } })
                .effort.revision,
        ).toBe('2');
        expect((): void => {
            RedTeamCodec.advance(snapshot, {
                ...snapshot,
                effort: { ...effort, sessionKey: 'other' },
            });
        }).toThrow('identity');
    });
});

describe('red team client', (): void => {
    it('decodes replies and forwards cancellation to the authenticated adapter', async (): Promise<void> => {
        const gateway: Gateway = new Gateway();
        const signal: AbortSignal = new AbortController().signal;
        expect(await new RedTeamClient(gateway).start(start, { signal })).toEqual(effort);
        expect(gateway.method).toBe(RedTeamMethod.Start);
        expect(gateway.options?.signal).toBe(signal);
    });
    it('does not send already aborted or invalid requests', async (): Promise<void> => {
        const gateway: Gateway = new Gateway();
        const client: RedTeamClient = new RedTeamClient(gateway);
        await expect(
            client.start(start, { signal: AbortSignal.abort(new Error('cancelled')) }),
        ).rejects.toThrow('cancelled');
        await expect(client.start({ ...start, parallelism: 51 })).rejects.toThrow();
        expect(gateway.calls).toBe(0);
    });
    it('rejects cross-effort replies and does not retry rejected mutations', async (): Promise<void> => {
        const gateway: Gateway = new Gateway({ ...effort, effortId: 'other' });
        await expect(new RedTeamClient(gateway).start(start)).rejects.toThrow('another effort');
        expect(gateway.calls).toBe(1);
    });
    it('checks pinned revision and advancing cursors on ledger reads', async (): Promise<void> => {
        const gateway: Gateway = new Gateway(snapshot);
        const client: RedTeamClient = new RedTeamClient(gateway);
        await expect(
            client.get({
                effortId: 'effort-1',
                revision: '2',
                taskCursor: null,
                findingCursor: null,
            }),
        ).rejects.toThrow('revision');
        gateway.reply = { ...snapshot, nextTaskCursor: 'task-1' };
        await expect(
            client.get({
                effortId: 'effort-1',
                revision: '1',
                taskCursor: 'task-1',
                findingCursor: null,
            }),
        ).rejects.toThrow('cursor');
    });
    it('requires stop acknowledgement and an advancing update revision', async (): Promise<void> => {
        const gateway: Gateway = new Gateway();
        const client: RedTeamClient = new RedTeamClient(gateway);
        await expect(client.stop({ effortId: 'effort-1' })).rejects.toThrow('acknowledged');
        gateway.reply = { ...effort, status: 'stopping' };
        expect((await client.stop({ effortId: 'effort-1' })).status).toBe('stopping');
        await expect(
            client.update({ effortId: 'effort-1', expectedRevision: '1', parallelism: 12 }),
        ).rejects.toThrow('revision');
        gateway.reply = { ...effort, revision: '2', parallelism: 12 };
        expect(
            (await client.update({ effortId: 'effort-1', expectedRevision: '1', parallelism: 12 }))
                .parallelism,
        ).toBe(12);
    });
    it('enforces requested list limits and rejects stuck pagination', async (): Promise<void> => {
        const gateway: Gateway = new Gateway({
            items: [effort, { ...effort, effortId: 'effort-2' }],
            next: null,
        });
        const client: RedTeamClient = new RedTeamClient(gateway);
        await expect(client.list({ afterEffortId: null, limit: 1 })).rejects.toThrow(
            'continuation',
        );
        gateway.reply = { items: [effort], next: 'cursor' };
        await expect(client.list({ afterEffortId: 'cursor', limit: 1 })).rejects.toThrow(
            'continuation',
        );
    });
});

describe('red team authenticated connection', (): void => {
    it('negotiates capabilities and sends validated operations on the existing socket', async (): Promise<void> => {
        const gateway: TestGateway = new TestGateway({
            ...hello,
            features: {
                ...hello.features,
                methods: [...hello.features.methods, ...Object.values(RedTeamMethod)],
            },
        });
        const client: NexaClient = await NexaClient.connect({
            url: await gateway.url(),
            reconnect: false,
        });
        try {
            gateway.handler = (socket: WebSocket, request: Request): void => {
                socket.send(JSON.stringify({ id: request.id, ok: true, result: effort }));
            };
            expect(client.supportsRedTeam).toBe(true);
            expect(await client.redTeam.start(start)).toEqual(effort);
            const sent: Request | undefined = gateway.requests.at(-1);
            expect(sent?.method).toBe('redteam.start');
            expect(sent?.params['parallelism']).toBe(8);
            expect(sent?.params['source']).toEqual(start.source);
        } finally {
            client.close();
            await gateway.close();
        }
        expect(client.supportsRedTeam).toBe(false);
    });
    it('gates unsupported gateways before writing any effort request', async (): Promise<void> => {
        const gateway: TestGateway = new TestGateway({
            ...hello,
            features: {
                ...hello.features,
                methods: hello.features.methods.filter(
                    (method: string): boolean => !method.startsWith('redteam.'),
                ),
            },
        });
        const client: NexaClient = await NexaClient.connect({
            url: await gateway.url(),
            reconnect: false,
        });
        try {
            expect(client.supportsRedTeam).toBe(false);
            await expect(client.redTeam.start(start)).rejects.toThrow('updated');
            expect(gateway.requests).toHaveLength(1);
        } finally {
            client.close();
            await gateway.close();
        }
    });
    it('reuses timeout, cancellation and reply validation without replaying mutations', async (): Promise<void> => {
        const gateway: TestGateway = new TestGateway({
            ...hello,
            features: {
                ...hello.features,
                methods: [...hello.features.methods, ...Object.values(RedTeamMethod)],
            },
        });
        const client: NexaClient = await NexaClient.connect({
            url: await gateway.url(),
            reconnect: false,
        });
        try {
            await expect(client.redTeam.start(start, { timeoutMs: 5 })).rejects.toThrow(
                'timed out',
            );
            const controller: AbortController = new AbortController();
            const pending: Promise<RedTeamEffort> = client.redTeam.start(start, {
                signal: controller.signal,
            });
            controller.abort();
            await expect(pending).rejects.toThrow('aborted');
            gateway.handler = (socket: WebSocket, request: Request): void => {
                socket.send(
                    JSON.stringify({
                        id: request.id,
                        ok: true,
                        result: { ...effort, effortId: 'other' },
                    }),
                );
            };
            await expect(client.redTeam.start(start)).rejects.toThrow('another effort');
        } finally {
            client.close();
            await gateway.close();
        }
    });
});
