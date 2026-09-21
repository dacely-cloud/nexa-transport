import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { WebSocketServer } from 'ws';
import { Method } from '../dist/protocol.js';

export const answer = {
    turnId: 'turn',
    text: 'finished',
    reasoning: '',
    finishReason: 'stop',
    usage: { inputTokens: 1, outputTokens: 2 },
    iterations: 1,
    conversationId: null,
    sessionKey: 'test::main',
};
export async function createPeer() {
    const http = createServer(async (request, response) => {
        const path = new URL(request.url, 'http://localhost').pathname;
        if (path === '/') {
            response.end('<!doctype html><title>SDK memory test</title>');
            return;
        }
        if (!/^\/dist\/[\w.-]+\.js$/.test(path) && path !== '/script/memory-scenario.mjs') {
            response.writeHead(404).end();
            return;
        }
        try {
            response.setHeader('Content-Type', 'text/javascript');
            response.end(await readFile(new URL(`..${path}`, import.meta.url)));
        } catch {
            response.writeHead(404).end();
        }
    });
    const wss = new WebSocketServer({ server: http });
    wss.on('connection', (socket) => {
        let seq = 1;
        const send = (value) => socket.send(JSON.stringify(value));
        const event = (name, data) => send({ event: name, seq: seq++, data });
        event('connect.challenge', { nonce: 'test', ts: 1, protocol: 1, minProtocol: 1 });
        socket.on('message', (raw) => {
            const request = JSON.parse(raw.toString());
            const reply = (result) => send({ id: request.id, ok: true, result });
            switch (request.method) {
                case 'connect':
                    reply({
                        type: 'hello-ok',
                        protocol: 1,
                        minProtocol: 1,
                        server: { version: 'test', connId: 'test' },
                        features: {
                            attachments: true,
                            methods: Object.values(Method),
                            events: [],
                            methodScopes: {},
                        },
                        auth: { principalId: 'test', method: 'token', scopes: ['admin'] },
                        policy: {
                            maxPayloadBytes: 16777216,
                            maxBufferedBytes: 16777216,
                            preHandshakeMaxBytes: 65536,
                            heartbeatMs: 0,
                        },
                        snapshot: { agents: [], uptimeMs: 0 },
                    });
                    break;
                case 'agent.stream': {
                    const streamId = request.params.streamId;
                    reply({ streamId, runId: 'run' });
                    for (let i = 0; i < 12; i++) {
                        event('turn.event', {
                            streamId,
                            event: { type: 'text', text: `${i}:` + 'x'.repeat(8192) },
                        });
                    }
                    if (request.params.message !== 'cancel') {
                        event(
                            'turn.end',
                            request.params.message === 'fail'
                                ? {
                                      streamId,
                                      ok: false,
                                      error: {
                                          code: 'internal',
                                          message: 'Expected failure',
                                          retryable: false,
                                      },
                                  }
                                : { streamId, ok: true, result: answer },
                        );
                    }
                    break;
                }
                case 'agent.ask':
                    if (request.params.message === 'disconnect')
                        socket.close(1001, 'test reconnect');
                    else if (request.params.message !== 'timeout') {
                        if (request.params.message === 'attachment') {
                            const header = Buffer.from(
                                JSON.stringify({
                                    attachment: {
                                        id: 'file',
                                        filename: 'file',
                                        mimeType: 'application/octet-stream',
                                        byteLength: 1024 * 1024,
                                    },
                                }),
                            );
                            const frame = Buffer.alloc(8 + header.length + 1024 * 1024);
                            frame.write('NXMD');
                            frame.writeUInt32BE(header.length, 4);
                            header.copy(frame, 8);
                            socket.send(frame);
                        }
                        reply(answer);
                    }
                    break;
                default:
                    reply({ ok: true });
            }
        });
    });
    await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve));
    const port = http.address().port;
    return {
        url: `ws://127.0.0.1:${port}`,
        httpUrl: `http://127.0.0.1:${port}`,
        async close() {
            for (const socket of wss.clients) socket.terminate();
            await new Promise((resolve) => wss.close(resolve));
            await new Promise((resolve) => http.close(resolve));
        },
    };
}
