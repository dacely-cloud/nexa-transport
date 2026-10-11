import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { BinaryChunks } from '../src/media/BinaryChunks.js';
import { BinaryMedia, type ReceivedAttachment } from '../src/media/BinaryMedia.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method } from '../src/protocol/Protocol.js';
import { hello, TestGateway, type Request } from './Support.js';

it('accepts the next large file before the previous receipt RPC replies', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway({
        ...hello,
        features: {
            ...hello.features,
            binaryMedia: true,
            methods: [Method.MediaAcknowledge, Method.SessionsFiles],
        },
    });
    const client: NexaClient = await NexaClient.connect({
        url: await gateway.url(),
        reconnect: false,
        requestTimeoutMs: 10_000,
    });
    const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(
        Math.floor(BinaryChunks.MAX_FILE_BYTES * 0.8),
    );
    bytes[0] = 17;
    bytes[bytes.length - 1] = 241;
    const delivered: string[] = [];
    client.onAttachment((file: ReceivedAttachment): void => {
        expect(file.data.byteLength).toBe(bytes.byteLength);
        expect(file.data[0]).toBe(17);
        expect(file.data[file.data.length - 1]).toBe(241);
        delivered.push(file.id);
    });
    let original: Request | undefined;
    let firstReceipt: Request | undefined;
    const acknowledgmentMethod: string = Method.MediaAcknowledge;
    const sendFile: (socket: WebSocket, id: string) => void = (
        socket: WebSocket,
        id: string,
    ): void => {
        const frame: Uint8Array<ArrayBuffer> = BinaryMedia.encode(
            {
                id,
                filename: `${id}.bin`,
                mimeType: 'application/octet-stream',
                byteLength: bytes.length,
            },
            bytes,
        );
        for (const chunk of BinaryChunks.split(frame)) {
            socket.send(chunk);
        }
    };
    gateway.handler = (socket: WebSocket, request: Request): void => {
        if (request.method !== acknowledgmentMethod) {
            original = request;
            sendFile(socket, 'first');
        } else if (request.params['id'] === 'first') {
            firstReceipt = request;
            sendFile(socket, 'second');
        } else {
            if (original === undefined || firstReceipt === undefined) {
                throw new Error('Missing receipt');
            }
            expect(request.params['received']).toBe(true);
            for (const pending of [firstReceipt, request, original]) {
                socket.send(
                    JSON.stringify({
                        id: pending.id,
                        ok: true,
                        result: pending === original ? [] : { ok: true },
                    }),
                );
            }
        }
    };
    try {
        await client.call(Method.SessionsFiles, { id: 'session' });
        expect(delivered).toEqual(['first', 'second']);
    } finally {
        client.close();
        await gateway.close();
    }
}, 30_000);
