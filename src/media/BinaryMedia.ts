// SPDX-License-Identifier: Apache-2.0
import type { DeliveredAttachment } from '../protocol/Protocol.js';

/** Original bytes and metadata received together in one binary frame. */
export interface ReceivedAttachment extends DeliveredAttachment {
    readonly data: Uint8Array<ArrayBuffer>;
    readonly streamId?: string;
    readonly sessionId?: string;
}

/** Platform-neutral NXMD binary attachment framing. */
export class BinaryMedia {
    public static encode(
        attachment: DeliveredAttachment,
        bytes: Uint8Array,
        streamId?: string,
        sessionId?: string,
    ): Uint8Array<ArrayBuffer> {
        const header: Uint8Array<ArrayBuffer> = new TextEncoder().encode(
            JSON.stringify({
                attachment,
                ...(streamId === undefined ? {} : { streamId }),
                ...(sessionId === undefined ? {} : { sessionId }),
            }),
        );
        if (header.byteLength > 16_384 || bytes.byteLength !== attachment.byteLength) {
            throw new RangeError('Invalid binary media header or byte length');
        }
        const frame: Uint8Array<ArrayBuffer> = new Uint8Array(
            8 + header.byteLength + bytes.byteLength,
        );
        frame.set([78, 88, 77, 68]);
        new DataView(frame.buffer).setUint32(4, header.byteLength);
        frame.set(header, 8);
        frame.set(bytes, 8 + header.byteLength);
        return frame;
    }

    /** Validates metadata and exposes a view of the original bytes, without base64 conversion. */
    public static decode(buffer: ArrayBuffer, maxBytes: number): ReceivedAttachment {
        if (buffer.byteLength < 8 || buffer.byteLength > maxBytes) {
            throw new RangeError('Invalid binary media frame size');
        }
        const view: DataView = new DataView(buffer);
        const length: number = view.getUint32(4);
        if (view.getUint32(0) !== 0x4e584d44 || length > 16_384 || length > buffer.byteLength - 8) {
            throw new TypeError('Invalid binary media frame header');
        }
        const raw: unknown = JSON.parse(
            new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(buffer, 8, length)),
        );
        if (
            !BinaryMedia.#record(raw) ||
            !BinaryMedia.#metadata(raw['attachment']) ||
            (raw['streamId'] !== undefined && typeof raw['streamId'] !== 'string') ||
            (raw['sessionId'] !== undefined && typeof raw['sessionId'] !== 'string')
        ) {
            throw new TypeError('Invalid binary media metadata');
        }
        const data: Uint8Array<ArrayBuffer> = new Uint8Array(buffer, 8 + length);
        if (raw['attachment'].byteLength !== data.byteLength) {
            throw new RangeError('Binary media byte length does not match metadata');
        }
        return {
            ...raw['attachment'],
            data,
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
            value['byteLength'] <= 100 * 1024 * 1024 &&
            (value['description'] === undefined ||
                (typeof value['description'] === 'string' &&
                    value['description'].length <= 4096)) &&
            (value['asFile'] === undefined || typeof value['asFile'] === 'boolean')
        );
    }
}
