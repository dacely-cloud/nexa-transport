// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryUploadHeader } from './BinaryUploadHeader';
import { JsonFrameMemory } from './JsonFrameMemory';
import { BinaryRequestMemory } from './BinaryRequestMemory';
import { BinaryEncoding } from './interface/BinaryEncoding';

/** Sizes disk-upload slices against the gateway's complete request working-storage policy. */
export class BinaryUploadSizing {
    /** Bounds any numeric SDK request ID and offset without allocating the upload's content. */
    public static chunkBytes(uploadId: string, budget: number | undefined): number {
        const maximum: number = 4 * 1024 * 1024;
        if (budget === undefined) {
            return maximum;
        }
        if (!Number.isSafeInteger(budget) || budget < 1) {
            throw new RangeError('Gateway advertised an invalid upload memory budget');
        }
        const header: Uint8Array<ArrayBuffer> = BinaryUploadHeader.encode(
            '9'.repeat(128),
            uploadId,
            '9'.repeat(12),
            maximum,
        );
        const overhead: number =
            BinaryRequestMemory.wire(new Uint8Array(8 + header.byteLength)) +
            JsonFrameMemory.measure(header, budget) +
            BinaryRequestMemory.carrier(0, BinaryEncoding.Bytes, false) +
            512;
        const bytes: number = Math.min(maximum, Math.floor((budget - overhead) / 2));
        if (bytes < 1) {
            throw new RangeError('Gateway upload memory budget is too small');
        }
        return bytes;
    }
}
