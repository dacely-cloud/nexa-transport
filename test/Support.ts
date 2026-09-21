import { WebSocketServer, WebSocket } from 'ws';
import type { AddressInfo } from 'node:net';
import type { AskResult, HelloOk, JsonValue } from '../src/protocol/Protocol.js';
import { BinaryChunks } from '../src/media/BinaryChunks.js';
import { BinaryEnvelope } from '../src/media/BinaryEnvelope.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
/** Minimal protocol-v1 hello fixture independent of the client implementation. */
export const hello: HelloOk = {
    type: 'hello-ok',
    protocol: 1,
    minProtocol: 1,
    server: { version: 'test', connId: 'test' },
    features: {
        attachments: true,
        methods: Object.keys(methodValidators),
        events: ['turn.event', 'turn.end'],
        methodScopes: {},
    },
    auth: { principalId: 'test', method: 'token', scopes: ['admin'] },
    policy: {
        maxPayloadBytes: 16_777_216,
        maxBufferedBytes: 16_777_216,
        preHandshakeMaxBytes: 65_536,
        heartbeatMs: 0,
    },
    snapshot: { agents: [], uptimeMs: 0 },
};
/** Terminal turn result. */
export const result: AskResult = {
    turnId: 'turn',
    text: 'finished',
    reasoning: '',
    finishReason: 'stop',
    usage: { inputTokens: 1, outputTokens: 2 },
    iterations: 1,
    conversationId: null,
    sessionKey: 'test::main',
};
/** Validated request captured by the protocol peer. */
export interface Request {
    readonly id: string;
    readonly method: string;
    readonly params: Readonly<Record<string, JsonValue>>;
}
/** A real websocket peer with deliberately programmable responses. */
export class TestGateway {
    readonly #server: WebSocketServer;
    /** Captured request order. */
    public readonly requests: Request[] = [];
    /** Handler used after the connect handshake. */
    public handler: (socket: WebSocket, request: Request) => void = (): void => {};
    /** Opens an ephemeral loopback port. */
    public constructor(greeting: HelloOk = hello) {
        this.#server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
        this.#server.on('connection', (socket: WebSocket): void => {
            socket.send(
                JSON.stringify({
                    event: 'connect.challenge',
                    seq: 1,
                    data: { nonce: 'challenge', ts: 1, protocol: 1, minProtocol: 1 },
                }),
            );
            const chunks: BinaryChunks = new BinaryChunks();
            socket.on('close', (): void => chunks.clear());
            socket.on('message', (raw: Buffer, binary: boolean): void => {
                const complete: ArrayBuffer | null = binary
                    ? chunks.accept(Uint8Array.from(raw).buffer)
                    : null;
                if (binary && complete === null) {
                    return;
                }
                const request: unknown =
                    complete === null
                        ? JSON.parse(raw.toString())
                        : BinaryEnvelope.decode(complete, BinaryChunks.MAX_TRANSFER_BYTES);
                if (!isRequest(request)) {
                    throw new Error('Invalid test request');
                }
                this.requests.push(request);
                if (request.method === 'connect') {
                    if (request.params['nonce'] !== 'challenge') {
                        socket.close();
                        return;
                    }
                    socket.send(JSON.stringify({ id: request.id, ok: true, result: greeting }));
                } else {
                    this.handler(socket, request);
                }
            });
        });
    }
    /** Waits for a usable endpoint. */
    public async url(): Promise<string> {
        if (this.#server.address() === null) {
            await new Promise<void>((resolve): void => {
                this.#server.once('listening', resolve);
            });
        }
        const address: AddressInfo | string | null = this.#server.address();
        if (address === null || typeof address === 'string') {
            throw new Error('Missing test address');
        }
        return `ws://127.0.0.1:${address.port}`;
    }
    /** Releases every socket and the listener. */
    public async close(): Promise<void> {
        for (const client of this.#server.clients) {
            client.terminate();
        }
        await new Promise<void>((resolve, reject): void => {
            this.#server.close((error?: Error): void => {
                if (error !== undefined) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}
/** Narrows test peer input at its JSON boundary. */
function isRequest(value: unknown): value is Request {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'string' &&
        'method' in value &&
        typeof value.method === 'string' &&
        'params' in value &&
        typeof value.params === 'object' &&
        value.params !== null
    );
}
