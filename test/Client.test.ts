import {
    Method,
    WorkerState,
    type WorkerStatus,
    type AskResult,
} from '../src/protocol/Protocol.js';
import { afterEach, describe, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { TransportErrorCode } from '../src/networking/TransportError.js';
import type { TurnStream } from '../src/networking/TurnStream.js';
import { result, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    gateway = undefined;
    client = undefined;
});
/** Creates a peer for each lifecycle test. */
async function connect(): Promise<NexaClient> {
    gateway = new TestGateway();
    client = await NexaClient.connect({ url: await gateway.url(), requestTimeoutMs: 100 });
    return client;
}
describe('Nexa websocket lifetimes', (): void => {
    it('calls the enum method with typed conversation and media parameters', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('No peer');
        }
        gateway.handler = (socket: WebSocket, request: Request): void => {
            socket.send(JSON.stringify({ id: request.id, ok: true, result }));
        };
        const answer: AskResult = await connected.call(Method.AgentAsk, {
            message: 'Continue',
            conversationId: 'test::main',
            attachments: [{ type: 'text', text: 'Context' }],
        });
        expect(answer.sessionKey).toBe('test::main');
        expect(gateway.requests.at(-1)).toMatchObject({
            method: Method.AgentAsk,
            params: {
                message: 'Continue',
                conversationId: 'test::main',
                attachments: [{ type: 'text', text: 'Context' }],
            },
        });
        expect(gateway.requests.at(-1)?.params).not.toHaveProperty('timeoutMs');
        expect(await connected.call(Method.AgentAsk, { message: 'New chat' })).toEqual(result);
    });
    it('preserves individually identified worker status events through websocket validation', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('No peer');
        }
        const worker: WorkerStatus = {
            id: 'worker-1',
            parentId: 'root',
            rootId: 'root',
            agentId: 'default',
            goal: 'review',
            depth: 1,
            state: WorkerState.Working,
            activity: 'reading files',
            startedAt: '1000',
            lastActivityAt: '1200',
        };
        gateway.handler = (socket: WebSocket, request: Request): void => {
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result: { streamId: request.params['streamId'], runId: 'run' },
                }),
            );
            for (const [index, state] of [WorkerState.Working, WorkerState.Done].entries()) {
                socket.send(
                    JSON.stringify({
                        event: 'turn.event',
                        seq: index + 2,
                        data: {
                            streamId: request.params['streamId'],
                            event: { type: 'agents-status', workers: [{ ...worker, state }] },
                        },
                    }),
                );
            }
            socket.send(
                JSON.stringify({
                    event: 'turn.end',
                    seq: 4,
                    data: { streamId: request.params['streamId'], ok: true, result },
                }),
            );
        };
        const updates: WorkerStatus[] = [];
        const turn: TurnStream = connected.stream({ message: 'review' });
        for await (const event of turn) {
            if (event.type === 'agents-status') {
                updates.push(...event.workers);
            }
        }
        expect(updates.map((entry: WorkerStatus): string => entry.state)).toEqual([
            WorkerState.Working,
            WorkerState.Done,
        ]);
        expect(
            updates.every(
                (entry: WorkerStatus): boolean =>
                    entry.id === worker.id && entry.parentId === worker.parentId,
            ),
        ).toBe(true);
        expect(await turn.result).toEqual(result);
    });
    it('captures events arriving immediately after acceptance and returns a result', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('No peer');
        }
        gateway.handler = (socket: WebSocket, request: Request): void => {
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result: { streamId: request.params['streamId'], runId: 'server-run' },
                }),
            );
            socket.send(
                JSON.stringify({
                    event: 'turn.event',
                    seq: 2,
                    data: {
                        streamId: request.params['streamId'],
                        event: { type: 'text', text: 'immediate' },
                    },
                }),
            );
            socket.send(
                JSON.stringify({
                    event: 'turn.end',
                    seq: 3,
                    data: { streamId: request.params['streamId'], ok: true, result },
                }),
            );
        };
        const turn: TurnStream = connected.stream({ message: 'hello' });
        const text: string[] = [];
        for await (const event of turn) {
            if (event.type === 'text') {
                text.push(event.text);
            }
        }
        expect(text).toEqual(['immediate']);
        expect(await turn.result).toEqual(result);
    });
    it('rejects malformed typed results', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('No peer');
        }
        gateway.handler = (socket: WebSocket, request: Request): void => {
            socket.send(JSON.stringify({ id: request.id, ok: true, result: { text: 123 } }));
        };
        await expect(connected.call(Method.AgentAsk, { message: 'hello' })).rejects.toMatchObject({
            code: TransportErrorCode.Protocol,
        });
    });
    it('settles in-flight calls with the server close diagnostics', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('No peer');
        }
        gateway.handler = (socket: WebSocket): void => {
            socket.close(1001, 'no pong');
        };
        await expect(connected.call(Method.Health, {})).rejects.toMatchObject({
            code: TransportErrorCode.Closed,
            message: 'Gateway connection closed (1001): no pong',
            closeDetails: { code: 1001, reason: 'no pong', wasClean: true },
        });
    });
    it('enforces deadlines and observes cancellation before sending', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        await expect(connected.call(Method.Health, {}, { timeoutMs: 10 })).rejects.toMatchObject({
            code: TransportErrorCode.Timeout,
        });
        await expect(
            connected.call(Method.Health, {}, { signal: AbortSignal.abort() }),
        ).rejects.toMatchObject({ code: TransportErrorCode.Aborted });
        expect(
            gateway?.requests.filter((request: Request): boolean => request.method === 'health'),
        ).toHaveLength(1);
    });
    it('cancels using the server run id after a consumer breaks', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('No peer');
        }
        gateway.handler = (socket: WebSocket, request: Request): void => {
            if (request.method === 'tasks.cancel') {
                socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
                return;
            }
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result: { streamId: request.params['streamId'], runId: 'server-owned-id' },
                }),
            );
            socket.send(
                JSON.stringify({
                    event: 'turn.event',
                    seq: 2,
                    data: {
                        streamId: request.params['streamId'],
                        event: { type: 'text', text: 'first' },
                    },
                }),
            );
        };
        const turn: TurnStream = connected.stream({ message: 'hello' });
        for await (const event of turn) {
            expect(event.type).toBe('text');
            break;
        }
        await expect(turn.result).rejects.toMatchObject({ code: TransportErrorCode.Aborted });
        expect(gateway.requests.at(-1)?.params['id']).toBe('server-owned-id');
    });
    it('bounds buffered events and cancels a producer that outruns its consumer', async (): Promise<void> => {
        const connected: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('No peer');
        }
        gateway.handler = (socket: WebSocket, request: Request): void => {
            if (request.method === 'tasks.cancel') {
                socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
                return;
            }
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result: { streamId: request.params['streamId'], runId: 'run' },
                }),
            );
            for (let seq: number = 2; seq < 5; seq += 1) {
                socket.send(
                    JSON.stringify({
                        event: 'turn.event',
                        seq,
                        data: {
                            streamId: request.params['streamId'],
                            event: { type: 'text', text: 'chunk' },
                        },
                    }),
                );
            }
        };
        const turn: TurnStream = connected.stream({ message: 'hello' }, { maxBufferedEvents: 1 });
        await expect(turn.result).rejects.toMatchObject({ code: TransportErrorCode.Limit });
    });
    it('rejects an invalid credential without exposing it in the error', async (): Promise<void> => {
        await expect(
            NexaClient.connect({
                url: 'ws://127.0.0.1:1',
                apiKey: 'SECRET',
                connectTimeoutMs: 100,
            }),
        ).rejects.not.toThrow('SECRET');
    });
});

it('reconnects, restores subscriptions and never repeats an interrupted mutation', async (): Promise<void> => {
    const connected: NexaClient = await connect();
    if (gateway === undefined) {
        throw new Error('Missing peer');
    }
    let failNext: boolean = true;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        if (request.method === 'agent.ask' && failNext) {
            failNext = false;
            socket.close(1001, 'temporary disconnect');
            return;
        }
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: request.method === 'sessions.subscribe' ? { ok: true } : result,
            }),
        );
    };
    await connected.call(Method.SessionsSubscribe, { sessionId: 'test::main' });
    const restored: Promise<void> = new Promise((resolve): void => {
        connected.onReconnect(resolve);
    });
    await expect(connected.call(Method.AgentAsk, { message: 'Run once' })).rejects.toThrow(
        'temporary disconnect',
    );
    await restored;
    expect(connected.connected).toBe(true);
    expect(
        gateway.requests.filter(
            (request: Request): boolean => request.method === 'sessions.subscribe',
        ),
    ).toHaveLength(2);
    expect(
        gateway.requests.filter((request: Request): boolean => request.method === 'agent.ask'),
    ).toHaveLength(1);
    expect(await connected.call(Method.AgentAsk, { message: 'New request' })).toEqual(result);
});

it('manual close cancels a scheduled reconnect', async (): Promise<void> => {
    const connected: NexaClient = await connect();
    if (gateway === undefined) {
        throw new Error('Missing peer');
    }
    gateway.handler = (socket: WebSocket): void => {
        socket.close(1001, 'temporary disconnect');
    };
    await expect(connected.call(Method.AgentAsk, { message: 'Run once' })).rejects.toThrow();
    connected.close();
    await new Promise<void>((resolve): void => {
        setTimeout(resolve, 600);
    });
    expect(
        gateway.requests.filter((request: Request): boolean => request.method === 'connect'),
    ).toHaveLength(1);
    expect(connected.reconnecting).toBe(false);
});
