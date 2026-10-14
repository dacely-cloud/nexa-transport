// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryChunks } from './BinaryChunks.js';
import { BinaryEncoding } from './interface/BinaryEncoding.js';

/** Working-storage policy shared by binary admission and the default full-asset gateway budget. */
export class BinaryRequestMemory {
    static readonly #WIRE_MULTIPLIER = 2 as const;
    static readonly #BASE64_MULTIPLIER = 8 as const;
    static readonly #ARRAY_MULTIPLIER = 32 as const;

    /** One maximum base64 carrier, including wire views and decoded transport working storage. */
    public static readonly DEFAULT_REQUEST_BYTES: number =
        (BinaryRequestMemory.#WIRE_MULTIPLIER + BinaryRequestMemory.#BASE64_MULTIPLIER) *
        BinaryChunks.MAX_TRANSFER_BYTES;

    /** Charges backing storage rather than only the length of a potentially narrow view. */
    public static wire(bytes: Uint8Array): number {
        return BinaryRequestMemory.#WIRE_MULTIPLIER * bytes.buffer.byteLength;
    }

    /** Covers decoded copies, serialized base64 storage, array growth and bounded fallback scratch. */
    public static carrier(length: number, encoding: BinaryEncoding, compact: boolean): number {
        if (!Number.isSafeInteger(length) || length < 0) {
            throw new RangeError('Invalid binary carrier memory length');
        }
        if (encoding === BinaryEncoding.Array) {
            return BinaryRequestMemory.#ARRAY_MULTIPLIER * length + 256;
        }
        if (encoding === BinaryEncoding.Base64) {
            return (
                BinaryRequestMemory.#BASE64_MULTIPLIER * length + 8 * Math.min(length, 8190) + 1024
            );
        }
        return compact ? 2 * length + 256 : 256;
    }
}
