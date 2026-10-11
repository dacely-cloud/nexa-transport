import { afterEach, expect, it, vi } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { BinaryChunks } from '../src/media/BinaryChunks.js';
import {
    BinaryMedia,
    type AttachmentProgress,
    type ReceivedAttachment,
} from '../src/media/BinaryMedia.js';
import { Method } from '../src/protocol/Protocol.js';
import { hello, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
const downloadMethod: string = Method.SessionsDownload;

afterEach(async (): Promise<void> => {
    vi.useRealTimers();
    client?.close();
    await gateway?.close();
    client = undefined;
    gateway = undefined;
});

it('reports actual content bytes from split headers through completion, ignoring other file identities', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: {
            ...hello.features,
            binaryMedia: true,
            methods: [Method.SessionsDownload, Method.MediaAcknowledge],
        },
    });
    const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(1024);
    bytes[1023] = 97;
    const frame: Uint8Array<ArrayBuffer> = BinaryMedia.encode(
        { id: 'file', filename: 'file.zip', mimeType: 'application/zip', byteLength: bytes.length },
        bytes,
        undefined,
        'saved',
    );
    gateway.handler = (socket: WebSocket, request: Request): void => {
        if (request.method === downloadMethod) {
            socket.send(
                BinaryMedia.encode(
                    {
                        id: 'other',
                        filename: 'other.zip',
                        mimeType: 'application/zip',
                        byteLength: 0,
                    },
                    new Uint8Array(),
                    undefined,
                    'saved',
                ),
            );
            for (const chunk of BinaryChunks.split(frame, 31)) {
                socket.send(chunk);
            }
        }
        socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
    };
    client = await NexaClient.connect({ url: await gateway.url() });
    const progress: number[] = [];
    const file: ReceivedAttachment = await client.downloadSessionFile(
        'saved',
        'file',
        undefined,
        (received: number, total: number): void => {
            expect(total).toBe(1024);
            progress.push(received);
        },
    );
    expect(file.data).toEqual(bytes);
    expect(progress.length).toBeGreaterThan(10);
    expect(progress[0]).toBeLessThan(31);
    expect(progress.at(-1)).toBe(1024);
    expect(progress).toEqual(
        [...progress].sort((left: number, right: number): number => left - right),
    );
});

it('releases stalled download requests and allows a retry instead of hanging for ten minutes', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: {
            ...hello.features,
            binaryMedia: true,
            methods: [Method.SessionsDownload, Method.MediaAcknowledge],
        },
    });
    const started: PromiseWithResolvers<boolean> = Promise.withResolvers<boolean>();
    gateway.handler = (): void => started.resolve(true);
    client = await NexaClient.connect({ url: await gateway.url() });
    vi.useFakeTimers();
    const download: Promise<ReceivedAttachment> = client.downloadSessionFile('saved', 'file');
    const rejected: Promise<void> = expect(download).rejects.toThrow('stalled');
    await started.promise;
    await vi.advanceTimersByTimeAsync(60_001);
    await rejected;
    vi.useRealTimers();
    gateway.handler = (socket: WebSocket, request: Request): void => {
        if (request.method === downloadMethod) {
            socket.send(
                BinaryMedia.encode(
                    {
                        id: 'file',
                        filename: 'retry.bin',
                        mimeType: 'application/octet-stream',
                        byteLength: 1,
                    },
                    new Uint8Array([44]),
                    undefined,
                    'saved',
                ),
            );
        }
        socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
    };
    expect((await client.downloadSessionFile('saved', 'file')).data).toEqual(new Uint8Array([44]));
});

it('does not expose invalid lengths or non-media binary frames as attachment progress', (): void => {
    expect(BinaryMedia.progress(new Uint8Array([78, 88, 66, 70, 0, 0, 0, 0]), 8)).toBeNull();
    const frame: Uint8Array<ArrayBuffer> = BinaryMedia.encode(
        { id: 'file', filename: 'file.bin', mimeType: 'application/octet-stream', byteLength: 1 },
        new Uint8Array([1]),
        undefined,
        'saved',
    );
    expect((): AttachmentProgress | null =>
        BinaryMedia.progress(frame, frame.byteLength + 1),
    ).toThrow('metadata');
});
