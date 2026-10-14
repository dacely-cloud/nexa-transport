// SPDX-License-Identifier: Apache-2.0

import { BinaryChunks } from './BinaryChunks.js';
import type { DeliveredAttachment } from '../protocol/Protocol.js';
import type { BinaryMediaHeader } from './interface/BinaryMediaHeader.js';
import type { BinaryDecodeAdmission } from './interface/BinaryDecodeAdmission.js';
import { JsonFrameMemory } from './JsonFrameMemory.js';
import { BinaryRequestMemory } from './BinaryRequestMemory.js';
import { BinaryAdmissionError } from './BinaryAdmissionError.js';

/** Original bytes and metadata received together in one binary frame. */
export interface ReceivedAttachment extends DeliveredAttachment {
    readonly data: Uint8Array<ArrayBuffer>;
    readonly streamId?: string;
    readonly sessionId?: string;
}

/** Validated identity and content byte counts while an attachment is arriving. */
export interface AttachmentProgress {
    readonly id: string;
    readonly sessionId?: string;
    readonly streamId?: string;
    readonly receivedBytes: number;
    readonly totalBytes: number;
}

/** Platform-neutral NXMD binary attachment framing. */
export class BinaryMedia {
    /** Reads only an available NXMD header; framing bytes do not count as file progress. */
    public static progress(
        prefix: Uint8Array<ArrayBuffer>,
        total: number,
        admission?: BinaryDecodeAdmission,
    ): AttachmentProgress | null {
        if (prefix.byteLength < 8) {
            return null;
        }
        const view: DataView = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength);
        if (view.getUint32(0) !== 0x4e584d44) {
            return null;
        }
        const length: number = view.getUint32(4);
        if (length > 16_384 || length > total - 8) {
            throw new TypeError('Invalid binary media header');
        }
        if (prefix.byteLength < 8 + length) {
            return null;
        }
        const header: BinaryMediaHeader = BinaryMedia.#read(
            prefix.subarray(8, 8 + length),
            total - 8 - length,
            admission,
        );
        return {
            id: header.attachment.id,
            receivedBytes: prefix.byteLength - 8 - length,
            totalBytes: header.attachment.byteLength,
            ...(header.sessionId === undefined ? {} : { sessionId: header.sessionId }),
            ...(header.streamId === undefined ? {} : { streamId: header.streamId }),
        };
    }
    public static encode(
        attachment: DeliveredAttachment,
        bytes: Uint8Array,
        streamId?: string,
        sessionId?: string,
    ): Uint8Array<ArrayBuffer> {
        if (bytes.byteLength !== attachment.byteLength) {
            throw new RangeError('Invalid binary media metadata or byte length');
        }
        const prefix: Uint8Array<ArrayBuffer> = BinaryMedia.#prefix(
            attachment,
            streamId,
            sessionId,
        );
        const frame: Uint8Array<ArrayBuffer> = new Uint8Array(prefix.byteLength + bytes.byteLength);
        frame.set(prefix);
        frame.set(bytes, prefix.byteLength);
        return frame;
    }

    /** Streams saved pages or existing bytes without allocating another full attachment frame. */
    public static stream(
        attachment: DeliveredAttachment,
        parts: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
        streamId?: string,
        sessionId?: string,
        chunkBytes: number = BinaryChunks.CHUNK_BYTES,
    ): AsyncGenerator<Uint8Array<ArrayBuffer>, void> {
        const prefix: Uint8Array<ArrayBuffer> = BinaryMedia.#prefix(
            attachment,
            streamId,
            sessionId,
        );
        const source: AsyncGenerator<Uint8Array, void> = (async function* (): AsyncGenerator<
            Uint8Array,
            void
        > {
            yield prefix;
            yield* parts;
        })();
        return BinaryChunks.stream(source, prefix.byteLength + attachment.byteLength, chunkBytes);
    }

    static #prefix(
        attachment: DeliveredAttachment,
        streamId?: string,
        sessionId?: string,
    ): Uint8Array<ArrayBuffer> {
        if (!BinaryMedia.#metadata(attachment)) {
            throw new RangeError('Invalid binary media metadata or byte length');
        }
        const header: Uint8Array<ArrayBuffer> = new TextEncoder().encode(
            JSON.stringify({
                attachment,
                ...(streamId === undefined ? {} : { streamId }),
                ...(sessionId === undefined ? {} : { sessionId }),
            }),
        );
        if (header.byteLength > 16_384) {
            throw new RangeError('Invalid binary media header');
        }
        const frame: Uint8Array<ArrayBuffer> = new Uint8Array(8 + header.byteLength);
        frame.set([78, 88, 77, 68]);
        new DataView(frame.buffer).setUint32(4, header.byteLength);
        frame.set(header, 8);
        return frame;
    }

    /** Validates metadata and exposes a view of the original bytes, without base64 conversion. */
    public static decode(
        buffer: ArrayBuffer,
        maxBytes: number,
        admission?: BinaryDecodeAdmission,
    ): ReceivedAttachment {
        if (buffer.byteLength < 8 || buffer.byteLength > maxBytes) {
            throw new RangeError('Invalid binary media frame size');
        }
        const view: DataView = new DataView(buffer);
        const length: number = view.getUint32(4);
        if (view.getUint32(0) !== 0x4e584d44 || length > 16_384 || length > buffer.byteLength - 8) {
            throw new TypeError('Invalid binary media frame header');
        }
        const data: Uint8Array<ArrayBuffer> = new Uint8Array(buffer, 8 + length);
        const header: BinaryMediaHeader = BinaryMedia.#read(
            new Uint8Array(buffer, 8, length),
            data.byteLength,
            admission,
        );
        return {
            ...header.attachment,
            data,
            ...(header.streamId === undefined ? {} : { streamId: header.streamId }),
            ...(header.sessionId === undefined ? {} : { sessionId: header.sessionId }),
        };
    }

    /** Structural preflight precedes parsing; only validated scalar metadata survives decoding. */
    static #read(
        bytes: Uint8Array,
        contentBytes: number,
        admission: BinaryDecodeAdmission | undefined,
    ): BinaryMediaHeader {
        let charge: number;
        try {
            charge = JsonFrameMemory.measure(
                bytes,
                admission?.limit ?? BinaryRequestMemory.DEFAULT_REQUEST_BYTES,
            );
        } catch (error: unknown) {
            if (admission !== undefined && error instanceof RangeError) {
                throw new BinaryAdmissionError(error.message);
            }
            throw error;
        }
        if (admission !== undefined && !admission.reserve(charge)) {
            throw new BinaryAdmissionError();
        }
        const raw: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        if (
            !BinaryMedia.#record(raw) ||
            !BinaryMedia.#metadata(raw['attachment']) ||
            (raw['streamId'] !== undefined && typeof raw['streamId'] !== 'string') ||
            (raw['sessionId'] !== undefined && typeof raw['sessionId'] !== 'string')
        ) {
            throw new TypeError('Invalid binary media metadata');
        }
        if (raw['attachment'].byteLength !== contentBytes) {
            throw new RangeError('Binary media byte length does not match metadata');
        }
        return {
            attachment: {
                id: raw['attachment'].id,
                filename: raw['attachment'].filename,
                mimeType: raw['attachment'].mimeType,
                byteLength: raw['attachment'].byteLength,
                ...(raw['attachment'].description === undefined
                    ? {}
                    : { description: raw['attachment'].description }),
                ...(raw['attachment'].asFile === undefined
                    ? {}
                    : { asFile: raw['attachment'].asFile }),
                ...(raw['attachment'].website === undefined
                    ? {}
                    : { website: raw['attachment'].website }),
            },
            ...(typeof raw['streamId'] === 'string' ? { streamId: raw['streamId'] } : {}),
            ...(typeof raw['sessionId'] === 'string' ? { sessionId: raw['sessionId'] } : {}),
        };
    }

    static #record(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    static #metadata(value: unknown): value is DeliveredAttachment {
        return (
            BinaryMedia.#record(value) &&
            typeof value['id'] === 'string' &&
            value['id'].length > 0 &&
            value['id'].length <= 128 &&
            typeof value['filename'] === 'string' &&
            value['filename'].length <= 1024 &&
            typeof value['mimeType'] === 'string' &&
            value['mimeType'].length <= 256 &&
            typeof value['byteLength'] === 'number' &&
            Number.isSafeInteger(value['byteLength']) &&
            value['byteLength'] >= 0 &&
            value['byteLength'] <= BinaryChunks.MAX_FILE_BYTES &&
            (value['description'] === undefined ||
                (typeof value['description'] === 'string' &&
                    value['description'].length <= 4096)) &&
            (value['asFile'] === undefined || typeof value['asFile'] === 'boolean') &&
            (value['website'] === undefined || typeof value['website'] === 'boolean')
        );
    }
}
