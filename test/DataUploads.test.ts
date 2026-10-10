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
