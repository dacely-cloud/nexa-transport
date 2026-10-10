import { afterEach, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { BinaryChunks } from '../src/media/BinaryChunks.js';
import { BinaryMedia, type ReceivedAttachment } from '../src/media/BinaryMedia.js';
import { NexaMedia } from '../src/media/NexaMedia.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type InboundAttachment, type HelloOk } from '../src/protocol/Protocol.js';
import { hello, result, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;

afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    client = undefined;
    gateway = undefined;
});

it.each([false, true])(
    'receives a complete 100 MiB video independently of JSON limits (chunked=%s)',
    async (chunked: boolean): Promise<void> => {
        const greeting: HelloOk = {
            ...hello,
            features: {
                ...hello.features,
                binaryMedia: true,
                methods: [Method.SessionsFiles, Method.MediaAcknowledge],
            },
        };
        expect(JSON.stringify(greeting).length).toBeLessThan(4096);
        gateway = new TestGateway(greeting);
        client = await NexaClient.connect({
            url: await gateway.url(),
            maxMessageBytes: 4096,
            requestTimeoutMs: 10_000,
        });
        const delivered: PromiseWithResolvers<ReceivedAttachment> =
            Promise.withResolvers<ReceivedAttachment>();
        client.onAttachment((file: ReceivedAttachment): void => {
            delivered.resolve(file);
        });
        const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(BinaryChunks.MAX_FILE_BYTES);
        bytes[0] = 17;
        bytes[bytes.length - 1] = 241;
        const frame: Uint8Array<ArrayBuffer> = BinaryMedia.encode(
            {
                id: 'large-video',
                filename: 'large-video.mp4',
                mimeType: 'video/mp4',
                byteLength: bytes.length,
            },
            bytes,
        );
        const acknowledgmentMethod: string = Method.MediaAcknowledge;
        gateway.handler = (socket: WebSocket, request: Request): void => {
            if (request.method === acknowledgmentMethod) {
                socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
                return;
            }
            if (chunked) {
                for (const chunk of BinaryChunks.split(frame)) {
                    socket.send(chunk);
                }
            } else {
                socket.send(frame);
            }
            socket.send(JSON.stringify({ id: request.id, ok: true, result: [] }));
        };
        await client.call(Method.SessionsFiles, { id: 'session' });
        const file: ReceivedAttachment = await delivered.promise;
        expect(file.byteLength).toBe(BinaryChunks.MAX_FILE_BYTES);
        expect(file.mimeType).toBe('video/mp4');
        expect(file.data.length).toBe(bytes.length);
        expect(Buffer.compare(file.data, bytes)).toBe(0);
    },
    20_000,
);

it('uploads an exact-limit 100 MiB video through bounded binary chunks', async (): Promise<void> => {
    gateway = new TestGateway({ ...hello, features: { ...hello.features, binaryMedia: true } });
    client = await NexaClient.connect({ url: await gateway.url(), requestTimeoutMs: 20_000 });
    const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(BinaryChunks.MAX_FILE_BYTES);
    bytes[0] = 19;
    bytes[bytes.length - 1] = 249;
    const attachment: InboundAttachment = await NexaMedia.video(
        new Blob([bytes], { type: 'video/mp4' }),
        'large.mp4',
    );
    gateway.handler = (socket: WebSocket, request: Request): void => {
        const attachments = request.params['attachments'];
        if (!Array.isArray(attachments)) {
            throw new Error('Missing uploaded files');
        }
        expect(attachments[0]).toEqual(attachment);
        socket.send(JSON.stringify({ id: request.id, ok: true, result }));
    };
    await client.call(Method.AgentAsk, { message: 'Inspect this clip', attachments: [attachment] });
}, 30_000);

it('rejects an oversized binary file before encoding or retaining a frame', (): void => {
    expect(() =>
        BinaryMedia.encode(
            {
                id: 'too-large',
                filename: 'large.mp4',
                mimeType: 'video/mp4',
                byteLength: BinaryChunks.MAX_FILE_BYTES + 1,
            },
            new Uint8Array(0),
        ),
    ).toThrow('metadata');
});
