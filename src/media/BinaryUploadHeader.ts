// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryEncoding } from './interface/BinaryEncoding.js';
import { GatewayVersion } from '../protocol/GatewayVersion.js';

/** One canonical raw-upload header used for framing and working-memory negotiation. */
export class BinaryUploadHeader {
    /** Validates upload metadata before it can control framing or allocation. */
    public static encode(
        requestId: string,
        uploadId: string,
        offset: string,
        length: number,
    ): Uint8Array<ArrayBuffer> {
        if (
            !Number.isSafeInteger(length) ||
            length < 1 ||
            length > 4 * 1024 * 1024 ||
            requestId.length === 0 ||
            uploadId.length === 0 ||
            requestId.length > 128 ||
            uploadId.length > 128 ||
            !/^(0|[1-9][0-9]{0,11})$/u.test(offset)
        ) {
            throw new RangeError('Invalid raw upload chunk');
        }
        return new TextEncoder().encode(
            JSON.stringify({
                json: {
                    v: GatewayVersion.Current,
                    id: requestId,
                    method: 'data.upload.chunk',
                    params: { id: uploadId, offset, data: null },
                },
                parts: [
                    {
                        path: ['params', 'data'],
                        length,
                        encoding: BinaryEncoding.Bytes,
                    },
                ],
            }),
        );
    }
}
