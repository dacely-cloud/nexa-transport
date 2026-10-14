// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryEnvelopeEncoder } from './BinaryEnvelopeEncoder';
import type { BinaryJsonValue as JsonValue } from './interface/BinaryJsonValue';
import { BinaryEncoding } from './interface/BinaryEncoding';
import type { BinaryPart } from './interface/BinaryPart';

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

    /** Restores fields within the wire limit and a bounded base64 expansion budget, or an explicit JSON cap. */
    public static decode(
        buffer: ArrayBuffer,
        maxBytes: number,
        maxJsonBytes: number = Math.ceil(maxBytes / 3) * 4,
    ): JsonValue {
        if (
            !Number.isSafeInteger(maxBytes) ||
            maxBytes < 0 ||
            !Number.isSafeInteger(maxJsonBytes) ||
            maxJsonBytes < 0
        ) {
            throw new RangeError('Invalid binary envelope limits');
        }
        if (buffer.byteLength < 8 || buffer.byteLength > maxBytes) {
            throw new RangeError('Invalid binary envelope size');
        }
        const view: DataView = new DataView(buffer);
        const length: number = view.getUint32(4);
        if (
            view.getUint32(0) !== 0x4e584246 ||
            length > 1024 * 1024 ||
            length > buffer.byteLength - 8
        ) {
            throw new TypeError('Invalid binary envelope header');
        }
        const header: unknown = JSON.parse(
            new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(buffer, 8, length)),
        );
        if (
            !BinaryEnvelope.#record(header) ||
            !BinaryEnvelope.#json(header['json']) ||
            !Array.isArray(header['parts']) ||
            header['parts'].length > 128
        ) {
            throw new TypeError('Invalid binary envelope metadata');
        }
        const json: JsonValue = header['json'];
        let jsonBytes: number = new TextEncoder().encode(JSON.stringify(json)).length;
        if (jsonBytes > maxJsonBytes) {
            throw new RangeError('Decoded binary JSON exceeds limit');
        }
        let offset: number = 8 + length;
        const parts: readonly unknown[] = header['parts'];
        let part: unknown;
        for (part of parts) {
            if (!BinaryEnvelope.#part(part) || part.length > buffer.byteLength - offset) {
                throw new TypeError('Invalid binary envelope part');
            }
            if (
                part.encoding === BinaryEncoding.Bytes &&
                (!BinaryEnvelope.#record(json) ||
                    json['method'] !== 'data.upload.chunk' ||
                    part.path.length !== 2 ||
                    part.path[0] !== 'params' ||
                    part.path[1] !== 'data' ||
                    part.length < 1 ||
                    part.length > 4 * 1024 * 1024 ||
                    header['parts'].length !== 1)
            ) {
                throw new TypeError('Raw bytes are restricted to bounded disk upload chunks');
            }
            const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(buffer, offset, part.length);
            offset += part.length;
            let target: JsonValue = json;
            for (let index: number = 0; index < part.path.length; index += 1) {
                const key: string | undefined = part.path[index];
                if (
                    key === undefined ||
                    key === '__proto__' ||
                    key === 'constructor' ||
                    key === 'prototype' ||
                    typeof target !== 'object' ||
                    target === null ||
                    target instanceof Uint8Array ||
                    !Object.hasOwn(target, key)
                ) {
                    throw new TypeError('Invalid binary field path');
                }
                if (
                    Array.isArray(target) &&
                    (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= target.length)
                ) {
                    throw new TypeError('Invalid binary array index');
                }
                if (index === part.path.length - 1) {
                    if ((Array.isArray(target) ? target[Number(key)] : target[key]) !== null) {
                        throw new TypeError('Binary field must reference an unused placeholder');
                    }
                    /** Check expansion before allocating a number array or base64 string. */
                    let replacementBytes: number =
                        part.encoding === BinaryEncoding.Bytes
                            ? bytes.length
                            : 2 + Math.ceil(bytes.length / 3) * 4;
                    if (part.encoding === BinaryEncoding.Array) {
                        replacementBytes = 2 + Math.max(0, bytes.length - 1);
                        let byte: number;
                        for (byte of bytes) {
                            replacementBytes += byte < 10 ? 1 : byte < 100 ? 2 : 3;
                        }
                    }
                    jsonBytes += replacementBytes - 4; // Replaces the JSON null placeholder.
                    if (jsonBytes > maxJsonBytes) {
                        throw new RangeError('Decoded binary JSON exceeds limit');
                    }
                    const replacement: JsonValue =
                        part.encoding === BinaryEncoding.Bytes
                            ? bytes
                            : part.encoding === BinaryEncoding.Array
                              ? Array.from(bytes)
                              : BinaryEnvelope.#base64(bytes);
                    if (Array.isArray(target)) {
                        target[Number(key)] = replacement;
                    } else {
                        Object.defineProperty(target, key, {
                            enumerable: true,
                            configurable: true,
                            writable: true,
                            value: replacement,
                        });
                    }
                } else {
                    const next: JsonValue | undefined = Array.isArray(target)
                        ? target[Number(key)]
                        : target[key];
                    if (next === undefined) {
                        throw new TypeError('Missing binary field');
                    }
                    target = next;
                }
            }
        }
        if (offset !== buffer.byteLength) {
            throw new RangeError('Unexpected trailing binary bytes');
        }
        return json;
    }

    static #base64(bytes: Uint8Array): string {
        const chunks: string[] = [];
        for (let offset: number = 0; offset < bytes.length; offset += 8192) {
            chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
        }
        return btoa(chunks.join(''));
    }
    static #record(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    static #part(value: unknown): value is BinaryPart {
        return (
            BinaryEnvelope.#record(value) &&
            Array.isArray(value['path']) &&
            value['path'].length > 0 &&
            value['path'].length <= 24 &&
            value['path'].every((key: unknown): key is string => typeof key === 'string') &&
            typeof value['length'] === 'number' &&
            Number.isSafeInteger(value['length']) &&
            value['length'] >= 0 &&
            (value['encoding'] === BinaryEncoding.Base64 ||
                value['encoding'] === BinaryEncoding.Array ||
                value['encoding'] === BinaryEncoding.Bytes)
        );
    }
    static #json(value: unknown, depth: number = 0): value is JsonValue {
        if (depth > 24) {
            return false;
        }
        if (value === null || typeof value === 'string' || typeof value === 'boolean') {
            return true;
        }
        if (typeof value === 'number') {
            return Number.isFinite(value);
        }
        if (Array.isArray(value)) {
            return value.every((entry: unknown): boolean => BinaryEnvelope.#json(entry, depth + 1));
        }
        return (
            BinaryEnvelope.#record(value) &&
            Object.values(value).every(
                (entry: unknown): boolean =>
                    entry === undefined || BinaryEnvelope.#json(entry, depth + 1),
            )
        );
    }
}
