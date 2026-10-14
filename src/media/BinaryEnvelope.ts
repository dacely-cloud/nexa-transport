// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryEnvelopeEncoder } from './BinaryEnvelopeEncoder';
import type { BinaryJsonValue as JsonValue } from './interface/BinaryJsonValue';
import { BinaryEncoding } from './interface/BinaryEncoding';
import { BinaryEnvelopeDecoder } from './BinaryEnvelopeDecoder';
import type { BinaryDecodeAdmission } from './interface/BinaryDecodeAdmission';

/** NXBF envelopes replace inline media and PCM strings with raw, contiguous bytes. */
export class BinaryEnvelope {
    /** Parses a JSON-facing message and projects admitted byte carriers into an NXBF frame. */
    public static encode(text: string): Uint8Array<ArrayBuffer> | null {
        const raw: unknown = JSON.parse(text);
        return BinaryEnvelope.encodeValue(raw);
    }

    /** Extracts carriers before JSON serialization, so large files never create giant JSON frames. */
    public static encodeValue(raw: unknown): Uint8Array<ArrayBuffer> | null {
        return BinaryEnvelopeEncoder.encode(raw);
    }

    /** Encodes one disk upload chunk without converting its bytes to a string. */
    public static encodeUploadChunk(
        requestId: string,
        uploadId: string,
        offset: string,
        bytes: Uint8Array,
    ): Uint8Array<ArrayBuffer> {
        if (
            bytes.byteLength < 1 ||
            bytes.byteLength > 4 * 1024 * 1024 ||
            requestId.length === 0 ||
            uploadId.length === 0 ||
            requestId.length > 128 ||
            uploadId.length > 128 ||
            !/^(0|[1-9][0-9]{0,11})$/u.test(offset)
        ) {
            throw new RangeError('Invalid raw upload chunk');
        }
        const header: Uint8Array<ArrayBuffer> = new TextEncoder().encode(
            JSON.stringify({
                json: {
                    v: 1,
                    id: requestId,
                    method: 'data.upload.chunk',
                    params: { id: uploadId, offset, data: null },
                },
                parts: [
                    {
                        path: ['params', 'data'],
                        length: bytes.byteLength,
                        encoding: BinaryEncoding.Bytes,
                    },
                ],
            }),
        );
        const frame: Uint8Array<ArrayBuffer> = new Uint8Array(
            8 + header.byteLength + bytes.byteLength,
        );
        const view: DataView = new DataView(frame.buffer);
        view.setUint32(0, 0x4e584246);
        view.setUint32(4, header.byteLength);
        frame.set(header, 8);
        frame.set(bytes, 8 + header.byteLength);
        return frame;
    }

    /** Restores an admitted frame; optional allocation credit remains owned by its request. */
    public static decode(
        buffer: ArrayBuffer | Uint8Array,
        maxBytes: number,
        maxJsonBytes: number = Math.ceil(maxBytes / 3) * 4,
        admission?: BinaryDecodeAdmission,
    ): JsonValue {
        return BinaryEnvelopeDecoder.decode(buffer, maxBytes, maxJsonBytes, admission);
    }
}
