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
    gateway.handler = (socket: WebSocket): void => {
        const frame: Uint8Array<ArrayBuffer> = BinaryMedia.encode(
            {
                id: 'file',
                filename: 'stalled.bin',
                mimeType: 'application/octet-stream',
                byteLength: 1024,
            },
            new Uint8Array(1024),
            undefined,
            'saved',
        );
        const chunk: IteratorResult<Uint8Array<ArrayBuffer>, void> = BinaryChunks.split(
            frame,
            512,
        ).next();
        if (chunk.done) {
            throw new Error('Missing first file chunk');
        }
        socket.send(chunk.value);
    };
    client = await NexaClient.connect({ url: await gateway.url() });
    const stopProgress: () => void = client.onAttachmentProgress((): void => {
        started.resolve(true);
    });
    vi.useFakeTimers();
    const download: Promise<ReceivedAttachment> = client.downloadSessionFile('saved', 'file');
    const rejected: Promise<void> = expect(download).rejects.toThrow('stalled');
    await started.promise;
    await vi.advanceTimersByTimeAsync(60_001);
    await rejected;
    stopProgress();
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

it('waits for queued downloads without treating admission time as stalled file bytes', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: {
            ...hello.features,
            binaryMedia: true,
            methods: [Method.SessionsDownload, Method.MediaAcknowledge],
        },
    });
    const started: PromiseWithResolvers<undefined> = Promise.withResolvers<undefined>();
    let transfer: (() => void) | undefined;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        if (request.method === downloadMethod) {
            transfer = (): void => {
                socket.send(
                    BinaryMedia.encode(
                        {
                            id: 'file',
                            filename: 'queued.bin',
                            mimeType: 'application/octet-stream',
                            byteLength: 1,
                        },
                        new Uint8Array([42]),
                        undefined,
                        'saved',
                    ),
                );
                socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
            };
            started.resolve(undefined);
        } else {
            socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
        }
    };
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    vi.useFakeTimers();
    const download: Promise<ReceivedAttachment> = client.downloadSessionFile('saved', 'file');
    await started.promise;
    await vi.advanceTimersByTimeAsync(60_001);
    vi.useRealTimers();
    if (transfer === undefined) {
        throw new Error('Missing queued download');
    }
    transfer();
    expect((await download).data).toEqual(new Uint8Array([42]));
});

it('retries tagged overload before file delivery and transfers the accepted file once', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: {
            ...hello.features,
            binaryMedia: true,
            methods: [Method.SessionsDownload, Method.MediaAcknowledge],
        },
    });
    let calls: number = 0;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        if (request.method === downloadMethod && ++calls === 1) {
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: false,
                    error: {
                        code: 'rate-limit',
                        retryable: true,
                        message: 'Queue full',
                        details: { kind: 'conversation-lookup-busy' },
                    },
                }),
            );
            return;
        }
        if (request.method === downloadMethod) {
            socket.send(
                BinaryMedia.encode(
                    {
                        id: 'file',
                        filename: 'retry.bin',
                        mimeType: 'application/octet-stream',
                        byteLength: 1,
                    },
                    new Uint8Array([31]),
                    undefined,
                    'saved',
                ),
            );
        }
        socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
    };
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    const delivered: string[] = [];
    client.onAttachment((file: ReceivedAttachment): void => {
        delivered.push(file.id);
    });
    expect((await client.downloadSessionFile('saved', 'file')).data).toEqual(new Uint8Array([31]));
    expect(calls).toBe(2);
    expect(delivered).toEqual(['file']);
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
