// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it, vi, type MockInstance } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { DataUploadFailure } from '../src/networking/DataUploadFailure.js';
import type {
    ConversationDataUpload,
    ConversationDataFile,
    JsonValue,
} from '../src/protocol/Protocol.js';
import { TestGateway, hello, type Request } from './Support.js';
import { uploadContext, failedUpload } from './support/UploadWireFixture.js';

/** A current bounded metadata result never includes source bytes or permission overrides. */
function admission(
    size: number,
    offset: number,
    state: ConversationDataUpload['state'],
): ConversationDataUpload {
    return {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        filename: 'source.bin',
        byteLength: String(size),
        chunkBytes: '196608',
        context: uploadContext,
        offset: String(offset),
        state,
    };
}
/** A strict current completion has its original target and exact acknowledged total. */
function completed(size: number): ConversationDataFile {
    return {
        ...admission(size, size, 'complete'),
        state: 'complete',
        path: '/workspace/source.bin',
        sha256: null,
    };
}

it('resumes only the acknowledged original offset and never reads the preceding source slices again', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway({
        ...hello,
        features: { ...hello.features, binaryDataUploads: true },
    });
    const client: NexaClient = await NexaClient.connect({
        url: await gateway.url(),
        reconnect: false,
    });
    const source: Blob = new Blob([new Uint8Array(400000).fill(173)]);
    const slices: MockInstance<Blob['slice']> = vi.spyOn(source, 'slice');
    let offset: number = 300000;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        let result: JsonValue;
        if (request.method === 'data.upload.start') {
            result = {
                ...admission(source.size, offset, 'receiving'),
                context: { ...uploadContext },
            };
        } else if (request.method === 'data.upload.chunk') {
            const bytes: unknown = request.params['data'];
            if (!(bytes instanceof Uint8Array)) {
                throw new Error('Expected exact native bytes');
            }
            expect(request.params['offset']).toBe(String(offset));
            offset += bytes.length;
            result = { id: admission(0, 0, 'receiving').id, offset: String(offset) };
        } else {
            result = { ...completed(source.size), context: { ...uploadContext } };
        }
        socket.send(JSON.stringify({ id: request.id, ok: true, result }));
    };
    try {
        const result: ConversationDataFile = await client.uploadData(source, 'source.bin', {
            context: uploadContext,
            requestId: 'same-original',
        });
        expect(result.offset).toBe('400000');
        expect(slices).toHaveBeenCalledTimes(1);
        expect(slices.mock.calls[0]?.[0]).toBe(300000);
    } finally {
        slices.mockRestore();
        client.close();
        await gateway.close();
    }
});

it('observes an already completed original without reading or sending any Blob bytes', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway({
        ...hello,
        features: { ...hello.features, binaryDataUploads: true },
    });
    const client: NexaClient = await NexaClient.connect({
        url: await gateway.url(),
        reconnect: false,
    });
    const source: Blob = new Blob(['content']);
    const slices: MockInstance<Blob['slice']> = vi.spyOn(source, 'slice');
    gateway.handler = (socket: WebSocket, request: Request): void =>
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result:
                    request.method === 'data.upload.start'
                        ? admission(source.size, source.size, 'complete')
                        : completed(source.size),
            }),
        );
    try {
        expect(
            (
                await client.uploadData(source, 'source.bin', {
                    context: uploadContext,
                    requestId: 'completed-original',
                })
            ).state,
        ).toBe('complete');
        expect(slices).not.toHaveBeenCalled();
        expect(gateway.requests.map((request: Request): string => request.method)).toEqual([
            'connect',
            'data.upload.start',
            'data.upload.finish',
        ]);
    } finally {
        slices.mockRestore();
        client.close();
        await gateway.close();
    }
});

it('does not cancel or send bytes to a mismatched original returned by a malformed peer', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway({
        ...hello,
        features: { ...hello.features, binaryDataUploads: true },
    });
    const client: NexaClient = await NexaClient.connect({
        url: await gateway.url(),
        reconnect: false,
    });
    gateway.handler = (socket: WebSocket, request: Request): void =>
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: {
                    ...admission(1, 0, 'receiving'),
                    context: { ...uploadContext, ownerSha256: 'e'.repeat(64) },
                },
            }),
        );
    try {
        const failure: DataUploadFailure = await failedUpload(
            client.uploadData(new Blob(['a']), 'source.bin', {
                context: uploadContext,
                requestId: 'mismatched',
            }),
        );
        expect(failure.uploadId).toBeNull();
        if (!(failure.cause instanceof Error)) {
            throw failure;
        }
        expect(failure.cause.message).toBe('Gateway returned another upload original');
        expect(gateway.requests.map((request: Request): string => request.method)).toEqual([
            'connect',
            'data.upload.start',
        ]);
    } finally {
        client.close();
        await gateway.close();
    }
});

it('keeps a publishing original uncertain without admitting another byte range or replacement identity', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway({
        ...hello,
        features: { ...hello.features, binaryDataUploads: true },
    });
    const client: NexaClient = await NexaClient.connect({
        url: await gateway.url(),
        reconnect: false,
    });
    gateway.handler = (socket: WebSocket, request: Request): void => {
        if (request.method === 'data.upload.finish') {
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: false,
                    error: {
                        code: 'delivery-unconfirmed',
                        message: 'Exact native publication remains retained',
                        retryable: false,
                    },
                }),
            );
        } else {
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result:
                        request.method === 'data.upload.start'
                            ? admission(1, 1, 'publishing')
                            : { ok: true },
                }),
            );
        }
    };
    try {
        for (let attempt: number = 0; attempt < 2; attempt++) {
            await expect(
                client.uploadData(new Blob(['a']), 'source.bin', {
                    context: uploadContext,
                    requestId: 'publishing-original',
                }),
            ).rejects.toBeInstanceOf(DataUploadFailure);
        }
        const starts: readonly Request[] = gateway.requests.filter(
            (request: Request): boolean => request.method === 'data.upload.start',
        );
        expect(starts).toHaveLength(2);
        expect(starts[0]?.params).toEqual(starts[1]?.params);
        expect(
            gateway.requests.some(
                (request: Request): boolean => request.method === 'data.upload.chunk',
            ),
        ).toBe(false);
    } finally {
        client.close();
        await gateway.close();
    }
});
