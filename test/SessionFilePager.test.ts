// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { SessionFilePager } from '../src/networking/SessionFilePager.js';
import { TransportError, TransportErrorCode } from '../src/networking/TransportError.js';
import type {
    SessionFileListParams,
    SessionFilePage,
    DeliveredAttachment,
} from '../src/protocol/Protocol.js';
import type { CallOptions } from '../src/interface/ClientOptions.js';

const revision: string = '00000000-0000-0000-0000-000000000001';
function file(index: number): DeliveredAttachment {
    return {
        id: '00000000-0000-0000-0000-' + index.toString(16).padStart(12, '0'),
        filename: String(index) + '.bin',
        mimeType: 'application/octet-stream',
        byteLength: 0,
    };
}

it('returns all metadata and advances exactly from the last validated page identity', async (): Promise<void> => {
    const requests: SessionFileListParams[] = [];
    const pager: SessionFilePager = new SessionFilePager(
        (params: SessionFileListParams): Promise<SessionFilePage> => {
            requests.push(params);
            return Promise.resolve(
                params.cursor === undefined
                    ? { files: [file(1)], revision, nextCursor: revision + '.' + file(1).id }
                    : { files: [file(2)], revision, nextCursor: null },
            );
        },
    );
    expect(await pager.read('chat')).toEqual([file(1), file(2)]);
    expect(requests).toEqual([
        { id: 'chat', limit: 128 },
        { id: 'chat', limit: 128, cursor: revision + '.' + file(1).id },
    ]);
});

it('closing the page iterator issues no later requests', async (): Promise<void> => {
    let calls: number = 0;
    const pager: SessionFilePager = new SessionFilePager((): Promise<SessionFilePage> => {
        calls += 1;
        return Promise.resolve({
            files: [file(1)],
            revision,
            nextCursor: revision + '.' + file(1).id,
        });
    });
    const pages: AsyncGenerator<SessionFilePage['files'], void> = pager.pages('chat');
    expect((await pages.next()).done).toBe(false);
    await pages.return();
    expect(calls).toBe(1);
});

it('discards partial metadata and makes only three attempts for a tagged source change', async (): Promise<void> => {
    let attempts: number = 0;
    const pager: SessionFilePager = new SessionFilePager(
        (params: SessionFileListParams): Promise<SessionFilePage> => {
            if (params.cursor === undefined) {
                attempts += 1;
                return Promise.resolve({
                    files: [file(1)],
                    revision,
                    nextCursor: revision + '.' + file(1).id,
                });
            }
            return Promise.reject(
                new TransportError(TransportErrorCode.Remote, 'Changed', {
                    code: 'invalid-request',
                    message: 'Changed',
                    retryable: false,
                    details: { kind: 'saved-file-list-changed' },
                }),
            );
        },
    );
    await expect(pager.read('chat')).rejects.toThrow('Changed');
    expect(attempts).toBe(3);
});

it('forwards cancellation and refuses an aborted page before yielding metadata', async (): Promise<void> => {
    const controller: AbortController = new AbortController();
    const pager: SessionFilePager = new SessionFilePager(
        (_params: SessionFileListParams, options: CallOptions): Promise<SessionFilePage> => {
            expect(options.signal).toBe(controller.signal);
            controller.abort(new Error('cancelled'));
            return Promise.resolve({ files: [file(1)], revision, nextCursor: null });
        },
    );
    await expect(pager.read('chat', { signal: controller.signal })).rejects.toThrow('cancelled');
});

it.each<SessionFilePage>([
    { files: [], revision, nextCursor: revision + '.' + file(1).id },
    { files: [file(2), file(1)], revision, nextCursor: null },
    { files: [file(1), file(1)], revision, nextCursor: null },
    { files: [file(1)], revision, nextCursor: revision + '.' + file(2).id },
    { files: [file(1)], revision: revision + '\n', nextCursor: null },
    { files: [{ ...file(1), id: '__proto__' }], revision, nextCursor: null },
    {
        files: Array.from(
            new Uint8Array(129),
            (_value: number, index: number): DeliveredAttachment => file(index + 1),
        ),
        revision,
        nextCursor: null,
    },
])(
    'refuses nonprogressing or malformed metadata pages',
    async (page: SessionFilePage): Promise<void> => {
        const pager: SessionFilePager = new SessionFilePager((): Promise<SessionFilePage> =>
            Promise.resolve(page),
        );
        await expect(pager.read('chat')).rejects.toMatchObject({
            code: TransportErrorCode.Protocol,
        });
    },
);
