// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryChunks } from './BinaryChunks.js';
import { BinaryEnvelopeDecodePlan } from './BinaryEnvelopeDecodePlan.js';
import { BinaryEncoding } from './interface/BinaryEncoding.js';
import type { BinaryDecodeAdmission } from './interface/BinaryDecodeAdmission.js';
import type { BinaryDecodedCarrier } from './interface/BinaryDecodedCarrier.js';
import type { BinaryJsonValue } from './interface/BinaryJsonValue.js';
import type { Base64ByteSource } from './interface/Base64ByteSource.js';

/** Restores carriers only after the entire frame and decoded allocation plan are admitted. */
export class BinaryEnvelopeDecoder {
    /** Borrows the exact input view for this synchronous operation, preserving offsets without a copy. */
    public static decode(
        input: ArrayBuffer | Uint8Array,
        maxBytes: number,
        maxJsonBytes: number,
        admission: BinaryDecodeAdmission | undefined,
    ): BinaryJsonValue {
        if (
            !Number.isSafeInteger(maxBytes) ||
            maxBytes < 0 ||
            !Number.isSafeInteger(maxJsonBytes) ||
            maxJsonBytes < 0
        ) {
            throw new RangeError('Invalid binary envelope limits');
        }
        const frame: Uint8Array =
            input instanceof Uint8Array
                ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
                : new Uint8Array(input);
        if (
            frame.length < 8 ||
            frame.length > maxBytes ||
            frame.length > BinaryChunks.MAX_TRANSFER_BYTES
        ) {
            throw new RangeError('Invalid binary envelope size');
        }
        const plan: BinaryEnvelopeDecodePlan = new BinaryEnvelopeDecodePlan(
            frame,
            maxJsonBytes,
            admission,
        );
        let carrier: BinaryDecodedCarrier;
        for (carrier of plan.carriers) {
            const bytes: Uint8Array = frame.subarray(
                carrier.offset,
                carrier.offset + carrier.length,
            );
            const replacement: BinaryJsonValue =
                carrier.encoding === BinaryEncoding.Bytes
                    ? frame.buffer.byteLength === frame.byteLength
                        ? bytes
                        : Uint8Array.from(bytes)
                    : carrier.encoding === BinaryEncoding.Array
                      ? Array.from(bytes)
                      : BinaryEnvelopeDecoder.#base64(bytes);
            if (Array.isArray(carrier.target)) {
                carrier.target[Number(carrier.key)] = replacement;
            } else {
                Object.defineProperty(carrier.target, carrier.key, {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: replacement,
                });
            }
        }
        return plan.json;
    }

    /** Keeps fallback scratch bounded and aligned to base64 triplets, without a giant binary string. */
    static #base64(bytes: Uint8Array): string {
        const native: Base64ByteSource = bytes;
        if (typeof native.toBase64 === 'function') {
            return native.toBase64();
        }
        const encoded: string[] = [];
        for (let offset: number = 0; offset < bytes.length; offset += 8190) {
            encoded.push(btoa(String.fromCharCode(...bytes.subarray(offset, offset + 8190))));
        }
        return encoded.join('');
    }
}
