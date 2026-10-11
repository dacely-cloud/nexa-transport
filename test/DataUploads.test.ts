import { afterEach, expect, it, vi, type MockInstance } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type DataFile, type DataUploadPosition } from '../src/protocol/Protocol.js';
import { TestGateway, hello, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;

afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    vi.restoreAllMocks();
});

it('uploads bounded raw slices with exact offsets and acknowledged progress', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, binaryDataUploads: true },
    });
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(400_000).fill(237);
    bytes[0] = 0;
    bytes[bytes.length - 1] = 255;
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    const progress: bigint[] = [];
    let position: bigint = 0n;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        let result: DataFile | DataUploadPosition;
        if (request.method === 'data.upload.chunk') {
            const chunk: unknown = request.params['data'];
            expect(chunk).toBeInstanceOf(Uint8Array);
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Upload was encoded into text');
            }
            expect(chunk.byteLength).toBeLessThanOrEqual(192 * 1024);
            expect(request.params['offset']).toBe(String(position));
            chunks.push(Uint8Array.from(chunk));
            position += BigInt(chunk.byteLength);
            result = { id: 'raw-upload', offset: String(position) };
        } else {
            result = {
                id: 'raw-upload',
                filename: 'original.bin',
                byteLength: String(bytes.length),
                path: '/workspace/original.bin',
            };
        }
        socket.send(JSON.stringify({ id: request.id, ok: true, result }));
    };
    const encode: MockInstance<typeof globalThis.btoa> = vi.spyOn(globalThis, 'btoa');
    const stored: DataFile = await client.uploadData(new Blob([bytes]), 'original.bin', {
        onProgress: (loaded: bigint): void => {
            progress.push(loaded);
        },
    });
    expect(stored.path).toBe('/workspace/original.bin');
    expect(chunks).toHaveLength(3);
    const restored: Uint8Array = new Uint8Array(await new Blob(chunks).arrayBuffer());
    expect(restored).toEqual(bytes);
    expect(progress).toEqual([0n, 196608n, 393216n, 400000n]);
    expect(encode).not.toHaveBeenCalled();
});

it('cancels a partial upload after an invalid acknowledgement and leaves the connection usable', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, binaryDataUploads: true },
    });
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    gateway.handler = (socket: WebSocket, request: Request): void => {
        const result: DataFile | DataUploadPosition =
            request.method === 'data.upload.chunk'
                ? { id: 'upload', offset: '0' }
                : {
                      id: 'upload',
                      filename: 'source.bin',
                      byteLength: '4',
                      path: '/workspace/source.bin',
                  };
        socket.send(JSON.stringify({ id: request.id, ok: true, result }));
    };
    await expect(client.uploadData(new Blob([new Uint8Array(4)]), 'source.bin')).rejects.toThrow(
        'unexpected upload position',
    );
    expect(gateway.requests.at(-1)?.method).toBe(Method.DataUploadCancel);
    expect(
        gateway.requests.some(
            (request: Request): boolean => request.method === 'data.upload.finish',
        ),
    ).toBe(false);
    expect(client.connected).toBe(true);
});

it('negotiates 4 MB slices and transfers 80 MB in twenty acknowledged chunks', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, binaryDataUploads: true },
    });
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    const total: number = 80 * 1024 * 1024;
    const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(total).fill(237);
    const progress: bigint[] = [];
    let offset: number = 0;
    let count: number = 0;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        let result: DataUploadPosition | DataFile;
        if (request.method === 'data.upload.chunk') {
            const chunk: unknown = request.params['data'];
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Upload was not binary');
            }
            expect(request.params['offset']).toBe(String(offset));
            expect(chunk.byteLength).toBe(4 * 1024 * 1024);
            expect(chunk.every((value: number): boolean => value === 237)).toBe(true);
            offset += chunk.byteLength;
            count += 1;
            result = { id: 'large', offset: String(offset) };
        } else {
            result = {
                id: 'large',
                filename: 'large.bin',
                byteLength: String(total),
                path: '/workspace/large.bin',
                chunkBytes: String(4 * 1024 * 1024),
            };
        }
        socket.send(JSON.stringify({ id: request.id, ok: true, result }));
    };
    await client.uploadData(new Blob([bytes]), 'large.bin', {
        onProgress: (loaded: bigint): void => {
            progress.push(loaded);
        },
    });
    expect(offset).toBe(total);
    expect(count).toBe(20);
    expect(progress).toHaveLength(21);
    expect(progress[0]).toBe(0n);
    expect(progress.at(-1)).toBe(BigInt(total));
});

it.each(['0', '-1', '4194305', '4e6', '004194304'])(
    'refuses invalid chunk advertisement %s and cancels the upload',
    async (chunkBytes: string): Promise<void> => {
        gateway = new TestGateway({
            ...hello,
            features: { ...hello.features, binaryDataUploads: true },
        });
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        gateway.handler = (socket: WebSocket, request: Request): void => {
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result: { id: 'bad-limit', filename: 'file.bin', byteLength: '1', chunkBytes },
                }),
            );
        };
        await expect(client.uploadData(new Blob([new Uint8Array(1)]), 'file.bin')).rejects.toThrow(
            'invalid upload chunk size',
        );
        expect(gateway.requests.at(-1)?.method).toBe(Method.DataUploadCancel);
        expect(
            gateway.requests.some(
                (request: Request): boolean => request.method === 'data.upload.chunk',
            ),
        ).toBe(false);
    },
);

it('fits negotiated binary slices inside a smaller advertised gateway frame budget', async (): Promise<void> => {
    const budget: number = 1024 * 1024;
    gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, binaryDataUploads: true },
        policy: { ...hello.policy, maxPayloadBytes: budget },
    });
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    let offset: number = 0;
    let count: number = 0;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        let result: DataUploadPosition | DataFile;
        if (request.method === 'data.upload.chunk') {
            const bytes: unknown = request.params['data'];
            if (!(bytes instanceof Uint8Array)) {
                throw new Error('Upload was not binary');
            }
            expect(bytes.length).toBeLessThanOrEqual(budget - 1024);
            offset += bytes.length;
            count += 1;
            result = { id: 'bounded', offset: String(offset) };
        } else {
            result = {
                id: 'bounded',
                filename: 'file.bin',
                byteLength: String(2 * budget),
                path: '/workspace/file.bin',
                chunkBytes: String(4 * budget),
            };
        }
        socket.send(JSON.stringify({ id: request.id, ok: true, result }));
    };
    await client.uploadData(new Blob([new Uint8Array(2 * budget)]), 'file.bin');
    expect(count).toBe(3);
    expect(offset).toBe(2 * budget);
});

it('refuses raw uploads on an old gateway and cleans up the started upload', async (): Promise<void> => {
    gateway = new TestGateway();
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: { id: 'old', filename: 'source.bin', byteLength: '1' },
            }),
        );
    };
    await expect(client.uploadData(new Blob([new Uint8Array(1)]), 'source.bin')).rejects.toThrow(
        'updated NEXA gateway',
    );
    expect(gateway.requests.map((request: Request): string => request.method)).toEqual([
        'connect',
        Method.DataUploadStart,
        Method.DataUploadCancel,
    ]);
});
