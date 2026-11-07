// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    DataUpload,
    DataUploadPosition,
    DataUploadContext,
    JsonValue,
} from '../../src/protocol/Protocol.js';
import type { Request } from '../Support.js';

/** Fixed explicit placement is test-only metadata; no real account, host or workspace is contacted. */
export const uploadContext: DataUploadContext = {
    sessionId: 'chat',
    selectionRevision: 'c'.repeat(64),
    ownerSha256: 'd'.repeat(64),
};
/** Current closed replies remain distinct for admission, offsets, completion and cancellation. */
export function uploadReply(request: Request, value: DataUpload | DataUploadPosition): JsonValue {
    if (request.method === 'data.upload.cancel') {
        return { ok: true };
    }
    if (!('filename' in value)) {
        return { id: value.id, offset: value.offset };
    }
    const common = {
        id: value.id,
        filename: value.filename,
        byteLength: value.byteLength,
        chunkBytes: value.chunkBytes ?? '196608',
        context: { ...uploadContext },
    };
    if (request.method === 'data.upload.start') {
        return { ...common, state: 'receiving', offset: '0' };
    }
    const path: string =
        'path' in value && typeof value.path === 'string' ? value.path : '/workspace/source.bin';
    return { ...common, state: 'complete', offset: value.byteLength, path, sha256: null };
}

/** Tests inspect the typed cause without unsafe framework matchers or discarding retained original metadata. */
export async function failedUpload(
    request: Promise<import('../../src/protocol/Protocol.js').ConversationDataFile>,
): Promise<import('../../src/networking/DataUploadFailure.js').DataUploadFailure> {
    try {
        await request;
    } catch (error: unknown) {
        const { DataUploadFailure } = await import('../../src/networking/DataUploadFailure.js');
        if (error instanceof DataUploadFailure) {
            return error;
        }
        throw error;
    }
    throw new Error('Expected an upload failure');
}
/** Native observations are surfaced without guessing an error class or encoding. */
export async function uploadFailureReason(
    request: Promise<import('../../src/protocol/Protocol.js').ConversationDataFile>,
): Promise<string> {
    const failure: import('../../src/networking/DataUploadFailure.js').DataUploadFailure =
        await failedUpload(request);
    if (!(failure.cause instanceof Error)) {
        throw failure;
    }
    return failure.cause.message;
}
