import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WebSocket as ServerSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { EventStream } from '../src/networking/EventStream.js';
import { BinaryEnvelope } from '../src/media/BinaryEnvelope.js';
import { BinaryMedia } from '../src/media/BinaryMedia.js';
import { Method, type AskParams } from '../src/protocol/Protocol.js';
import { TransportErrorCode } from '../src/networking/TransportError.js';
import { hello, result, TestGateway, type Request } from './Support.js';

const clients: NexaClient[] = [];
let gateway: TestGateway | undefined;
afterEach(async (): Promise<void> => {
    for (const client of clients) {
        client.close();
    }
    clients.length = 0;
    vi.restoreAllMocks();
    await gateway?.close();
    gateway = undefined;
});

async function connect(maxPendingRequests: number = 1): Promise<NexaClient> {
    gateway ??= new TestGateway({
        ...hello,
        features: { ...hello.features, binaryMedia: true },
    });
    const client: NexaClient = await NexaClient.connect({
        url: await gateway.url(),
        maxPendingRequests,
        maxActiveStreams: 2,
        requestTimeoutMs: 5000,
        reconnect: false,
    });
    clients.push(client);
    return client;
}
function media(): AskParams {
    return {
        message: 'Read',
        attachments: [
            { type: 'image', source: { kind: 'base64', mediaType: 'image/png', data: 'AQID' } },
        ],
    };
}
function answer(socket: ServerSocket, request: Request): void {
    socket.send(JSON.stringify({ id: request.id, ok: true, result }));
}

describe('memory ownership', (): void => {
    it('does not encode or queue refused uploads behind a stalled upload', async (): Promise<void> => {
        const client: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('Missing peer');
        }
        gateway.handler = answer;
        const buffer = vi
            .spyOn(WebSocket.prototype, 'bufferedAmount', 'get')
            .mockReturnValue(1_000_000);
        const encoder = vi.spyOn(BinaryEnvelope, 'encode');
        const first = client.call(Method.AgentAsk, media());
        for (let index: number = 0; index < 80; index += 1) {
            await expect(client.call(Method.AgentAsk, media())).rejects.toMatchObject({
                code: TransportErrorCode.Limit,
            });
        }
        expect(encoder).toHaveBeenCalledTimes(1);
        buffer.mockRestore();
        expect(await first).toEqual(result);
        expect(await client.call(Method.AgentAsk, media())).toEqual(result);
        expect(client.connected).toBe(true);
        expect(
            gateway.requests.filter((request: Request): boolean => request.method === 'agent.ask'),
        ).toHaveLength(2);
    });

    it('removes cancelled queued uploads without interrupting the active upload', async (): Promise<void> => {
        const client: NexaClient = await connect(2);
        if (gateway === undefined) {
            throw new Error('Missing peer');
        }
        gateway.handler = answer;
        const buffer = vi
            .spyOn(WebSocket.prototype, 'bufferedAmount', 'get')
            .mockReturnValue(1_000_000);
        const first = client.call(Method.AgentAsk, media());
        for (let index: number = 0; index < 80; index += 1) {
            const controller: AbortController = new AbortController();
            const queued = client.call(Method.AgentAsk, media(), { signal: controller.signal });
            controller.abort();
            await expect(queued).rejects.toMatchObject({ code: TransportErrorCode.Aborted });
        }
        buffer.mockRestore();
        expect(await first).toEqual(result);
        expect(await client.call(Method.AgentAsk, media())).toEqual(result);
        expect(client.connected).toBe(true);
        expect(
            gateway.requests.filter((request: Request): boolean => request.method === 'agent.ask'),
        ).toHaveLength(2);
    });

    it('does not encode pre-aborted calls and releases admission after encoding fails', async (): Promise<void> => {
        const client: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('Missing peer');
        }
        gateway.handler = answer;
        const encoder = vi.spyOn(BinaryEnvelope, 'encode');
        await expect(
            client.call(Method.AgentAsk, media(), { signal: AbortSignal.abort() }),
        ).rejects.toMatchObject({ code: TransportErrorCode.Aborted });
        expect(encoder).not.toHaveBeenCalled();
        encoder.mockImplementationOnce((): never => {
            throw new RangeError('Encoding failed');
        });
        await expect(client.call(Method.AgentAsk, media())).rejects.toThrow('Encoding failed');
        expect(await client.call(Method.AgentAsk, media())).toEqual(result);
    });

    it('bounds aggregate upload bytes and releases the budget after cancellation', async (): Promise<void> => {
        const client: NexaClient = await connect(3);
        if (gateway === undefined) {
            throw new Error('Missing peer');
        }
        gateway.handler = answer;
        const buffer = vi
            .spyOn(WebSocket.prototype, 'bufferedAmount', 'get')
            .mockReturnValue(1_000_000);
        const encoder = vi
            .spyOn(BinaryEnvelope, 'encode')
            .mockImplementation((): Uint8Array<ArrayBuffer> => new Uint8Array(60 * 1024 * 1024));
        const controller: AbortController = new AbortController();
        const first = client.call(Method.AgentAsk, media(), { signal: controller.signal });
        await expect(client.call(Method.AgentAsk, media())).rejects.toMatchObject({
            code: TransportErrorCode.Limit,
            message: 'Binary upload memory budget is full',
        });
        controller.abort();
        await expect(first).rejects.toMatchObject({ code: TransportErrorCode.Aborted });
        encoder.mockRestore();
        buffer.mockRestore();
        expect(await client.call(Method.AgentAsk, media())).toEqual(result);
        expect(client.connected).toBe(true);
    });

    it('removes timed-out queued uploads without closing a healthy connection', async (): Promise<void> => {
        const client: NexaClient = await connect(2);
        if (gateway === undefined) {
            throw new Error('Missing peer');
        }
        gateway.handler = answer;
        const buffer = vi
            .spyOn(WebSocket.prototype, 'bufferedAmount', 'get')
            .mockReturnValue(1_000_000);
        const first = client.call(Method.AgentAsk, media());
        await expect(
            client.call(Method.AgentAsk, media(), { timeoutMs: 10 }),
        ).rejects.toMatchObject({ code: TransportErrorCode.Timeout });
        buffer.mockRestore();
        expect(await first).toEqual(result);
        expect(await client.call(Method.AgentAsk, media())).toEqual(result);
        expect(client.connected).toBe(true);
    });

    it('drops unread events when an already completed iterator is closed', async (): Promise<void> => {
        const events: EventStream<string> = new EventStream();
        events.push('first', 5);
        events.push('retained', 8);
        events.end();
        for await (const event of events) {
            expect(event).toBe('first');
            break;
        }
        expect(await events.next()).toEqual({ done: true, value: undefined });
    });

    it('cleans stream listeners after repeated chats on two connections', async (): Promise<void> => {
        const first: NexaClient = await connect();
        const second: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('Missing peer');
        }
        const sequences: Map<ServerSocket, number> = new Map();
        gateway.handler = (socket: ServerSocket, request: Request): void => {
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result: { streamId: request.params['streamId'], runId: 'run' },
                }),
            );
            const seq: number = sequences.get(socket) ?? 2;
            socket.send(
                JSON.stringify({
                    event: 'turn.event',
                    seq,
                    data: {
                        streamId: request.params['streamId'],
                        event: { type: 'text', text: 'hello' },
                    },
                }),
            );
            socket.send(
                JSON.stringify({
                    event: 'turn.end',
                    seq: seq + 1,
                    data: { streamId: request.params['streamId'], ok: true, result },
                }),
            );
            sequences.set(socket, seq + 2);
        };
        await Promise.all(
            [first, second].map(async (client): Promise<void> => {
                const unlisten = vi.fn<() => void>();
                const onEvent = client.onEvent.bind(client);
                vi.spyOn(client, 'onEvent').mockImplementation((listener): (() => void) => {
                    const remove = onEvent(listener);
                    return (): void => {
                        remove();
                        unlisten();
                    };
                });
                const unclose = vi.fn<() => void>();
                const onClose = client.onClose.bind(client);
                vi.spyOn(client, 'onClose').mockImplementation((listener): (() => void) => {
                    const remove = onClose(listener);
                    return (): void => {
                        remove();
                        unclose();
                    };
                });
                for (let index: number = 0; index < 50; index += 1) {
                    const turn = client.stream({ message: 'hello', streamId: 'reusable' });
                    for await (const event of turn) {
                        expect(event.type).toBe('text');
                    }
                    expect(await turn.result).toEqual(result);
                }
                expect(unlisten).toHaveBeenCalledTimes(50);
                expect(unclose).toHaveBeenCalledTimes(50);
            }),
        );
    });

    it('bounds active turns after their RPCs have been acknowledged', async (): Promise<void> => {
        const client: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('Missing peer');
        }
        gateway.handler = (socket: ServerSocket, request: Request): void => {
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result:
                        request.method === 'tasks.cancel'
                            ? { ok: true }
                            : { streamId: request.params['streamId'], runId: 'run' },
                }),
            );
        };
        const first = client.stream({ message: 'one' });
        await vi.waitFor(() => expect(gateway?.requests).toHaveLength(2));
        // A response must have settled before the next stream can use the one RPC slot.
        await new Promise<void>((resolve): void => {
            setTimeout(resolve, 20);
        });
        const second = client.stream({ message: 'two' });
        await vi.waitFor(() => expect(gateway?.requests).toHaveLength(3));
        await new Promise<void>((resolve): void => {
            setTimeout(resolve, 20);
        });
        expect(() => client.stream({ message: 'three' })).toThrow('Too many active streams');
        await first.cancel();
        await second.cancel();
        const third = client.stream({ message: 'replacement' });
        await third.cancel();
    });

    it('bounds outstanding asynchronous attachment deliveries', async (): Promise<void> => {
        const client: NexaClient = await connect();
        if (gateway === undefined) {
            throw new Error('Missing peer');
        }
        const gate: PromiseWithResolvers<undefined> = Promise.withResolvers<undefined>();
        const listener = vi.fn((): Promise<void> => gate.promise);
        client.onAttachment(listener);
        const closed: Promise<Error> = new Promise((resolve): void => {
            client.onClose(resolve);
        });
        gateway.handler = (socket: ServerSocket): void => {
            for (let index: number = 0; index < 65; index += 1) {
                socket.send(
                    BinaryMedia.encode(
                        {
                            id: String(index),
                            filename: 'file',
                            mimeType: 'application/octet-stream',
                            byteLength: 1,
                        },
                        new Uint8Array(1),
                    ),
                );
            }
        };
        const request = client.call(Method.AgentAsk, { message: 'files' });
        const rejection = expect(request).rejects.toMatchObject({ code: TransportErrorCode.Limit });
        try {
            expect(await closed).toMatchObject({ code: TransportErrorCode.Limit });
            await rejection;
            expect(listener).toHaveBeenCalledTimes(64);
        } finally {
            gate.resolve(undefined);
        }
    });
    it('keeps delivery accounting until every handler settles, even after a failure', async (): Promise<void> => {
        const client: NexaClient = await connect(8);
        if (gateway === undefined) {
            throw new Error('Missing peer');
        }
        const gate: PromiseWithResolvers<undefined> = Promise.withResolvers<undefined>();
        client.onAttachment((): never => {
            throw new Error('Broken handler');
        });
        const slow = vi.fn((): Promise<void> => gate.promise);
        client.onAttachment(slow);
        gateway.handler = (socket: ServerSocket, request: Request): void => {
            if (request.method === 'media.acknowledge') {
                socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
                return;
            }
            socket.send(
                BinaryMedia.encode(
                    {
                        id: request.id,
                        filename: 'file',
                        mimeType: 'application/octet-stream',
                        byteLength: 1,
                    },
                    new Uint8Array(1),
                ),
            );
            answer(socket, request);
        };
        try {
            for (let index: number = 0; index < 64; index += 1) {
                await client.call(Method.AgentAsk, { message: 'file' });
            }
            await expect(
                client.call(Method.AgentAsk, { message: 'overflow' }),
            ).rejects.toMatchObject({ code: TransportErrorCode.Limit });
            expect(slow).toHaveBeenCalledTimes(64);
        } finally {
            gate.resolve(undefined);
        }
    });
});
