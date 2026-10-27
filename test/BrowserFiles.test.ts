// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { TestGateway, type Request } from './Support.js';
import { Method, type JsonValue, type BrowserFilesRead } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

it('exposes bounded browser RPCs without accepting caller-selected host or account authority', (): void => {
    const assignment: string = 'a'.repeat(64);
    expect(methodValidators[Method.WorkspaceFilesList].params({ path: '' })).toBe(true);
    expect(
        methodValidators[Method.WorkspaceFilesRead].params({
            path: 'hello.txt',
            assignment,
            offset: '0',
        }),
    ).toBe(true);
    for (const extra of [{ root: '/etc' }, { userId: 'other' }, { machineId: 'other' }]) {
        expect(methodValidators[Method.WorkspaceFilesList].params({ path: '', ...extra })).toBe(
            false,
        );
    }
    expect(
        methodValidators[Method.WorkspaceFilesChunk].params({
            uploadId: assignment,
            offset: '0',
            data: 'x'.repeat(1398105),
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.WorkspaceFilesList].result({
            assignment,
            entries: [],
            nextCursor: null,
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.WorkspaceFilesStart].result({
            uploadId: assignment,
            chunkBytes: 1048577,
        }),
    ).toBe(false);
});

it('round-trips bounded binary workspace transfers through the public websocket client', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    const assignment: string = 'a'.repeat(64);
    const uploadId: string = 'b'.repeat(64);
    const bytes: Buffer = Buffer.alloc(1048576, 175);
    const data: string = bytes.toString('base64');
    let received: string = '';
    let client: NexaClient | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        let result: JsonValue;
        switch (request.method) {
            case Method.WorkspaceFilesList:
                result = { assignment, entries: [], nextCursor: null };
                break;
            case Method.WorkspaceFilesStart:
                result = { uploadId, chunkBytes: 1048576 };
                break;
            case Method.WorkspaceFilesChunk:
                if (typeof request.params['data'] !== 'string') throw new Error('Missing chunk');
                received = createHash('sha256')
                    .update(Buffer.from(request.params['data'], 'base64'))
                    .digest('hex');
                result = { offset: '1048576' };
                break;
            case Method.WorkspaceFilesRead:
                result = {
                    assignment,
                    revision: 'opened-file-revision',
                    byteLength: '1048576',
                    data,
                };
                break;
            default:
                result = { ok: true };
        }
        socket.send(JSON.stringify({ id: request.id, ok: true, result }));
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect((await client.call(Method.WorkspaceFilesList, { path: '' })).assignment).toBe(
            assignment,
        );
        await client.call(Method.WorkspaceFilesStart, {
            assignment,
            path: 'file.bin',
            byteLength: '1048576',
            extractZip: false,
        });
        expect(
            await client.call(Method.WorkspaceFilesChunk, { uploadId, offset: '0', data }),
        ).toEqual({ offset: '1048576' });
        await client.call(Method.WorkspaceFilesFinish, { uploadId });
        const read: BrowserFilesRead = await client.call(Method.WorkspaceFilesRead, {
            assignment,
            path: 'file.bin',
            offset: '0',
        });
        const expected: string = createHash('sha256').update(bytes).digest('hex');
        expect(received).toBe(expected);
        expect(createHash('sha256').update(Buffer.from(read.data, 'base64')).digest('hex')).toBe(
            expected,
        );
        await client.call(Method.WorkspaceFilesStart, {
            assignment,
            path: 'cancel.bin',
            byteLength: '0',
            extractZip: false,
        });
        await client.call(Method.WorkspaceFilesCancel, { uploadId });
        await client.call(Method.WorkspaceFilesMkdir, { assignment, path: 'folder' });
        expect(
            gateway.requests.filter((request: Request): boolean =>
                request.method.startsWith('workspace.files.'),
            ),
        ).toHaveLength(8);
    } finally {
        client?.close();
        await gateway.close();
    }
});
