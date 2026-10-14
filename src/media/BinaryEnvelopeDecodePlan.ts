// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryAdmissionError } from './BinaryAdmissionError';
import { BinaryRequestMemory } from './BinaryRequestMemory';
import { BinaryJsonValidation } from './BinaryJsonValidation';
import { JsonFrameMemory } from './JsonFrameMemory';
import { BinaryEncoding } from './interface/BinaryEncoding';
import type { BinaryDecodeAdmission } from './interface/BinaryDecodeAdmission';
import type { BinaryDecodedCarrier } from './interface/BinaryDecodedCarrier';
import type { BinaryJsonValue } from './interface/BinaryJsonValue';
import type { BinaryPart } from './interface/BinaryPart';

/** Validates every header, path, body range and expansion before allocating decoded carriers. */
export class BinaryEnvelopeDecodePlan {
    /** Decoder-owned metadata; placeholders remain untouched until the complete plan is admitted. */
    public readonly json: BinaryJsonValue;
    /** Immutable restoration instructions referring only to the owned metadata tree. */
    public readonly carriers: readonly BinaryDecodedCarrier[];

    /** Borrows the frame only for synchronous validation; request admission owns allocated metadata. */
    public constructor(
        frame: Uint8Array,
        maxJsonBytes: number,
        admission: BinaryDecodeAdmission | undefined,
    ) {
        const view: DataView = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
        const length: number = view.getUint32(4);
        if (view.getUint32(0) !== 0x4e584246 || length > 1024 * 1024 || length > frame.length - 8) {
            throw new TypeError('Invalid binary envelope header');
        }
        const headerBytes: Uint8Array = frame.subarray(8, 8 + length);
        if (admission !== undefined) {
            let charge: number;
            try {
                charge = JsonFrameMemory.measure(headerBytes, admission.limit);
            } catch (error: unknown) {
                if (error instanceof RangeError) {
                    throw new BinaryAdmissionError();
                }
                throw error;
            }
            BinaryEnvelopeDecodePlan.#reserve(admission, charge);
        }
        const header: unknown = JSON.parse(
            new TextDecoder('utf-8', { fatal: true }).decode(headerBytes),
        );
        if (
            !BinaryJsonValidation.record(header) ||
            !BinaryJsonValidation.valid(header['json']) ||
            !Array.isArray(header['parts']) ||
            header['parts'].length > 128
        ) {
            throw new TypeError('Invalid binary envelope metadata');
        }
        this.json = header['json'];
        let jsonBytes: number;
        try {
            jsonBytes = new TextEncoder().encode(JSON.stringify(this.json)).byteLength;
        } catch (error: unknown) {
            if (error instanceof RangeError) {
                throw new RangeError('Decoded binary JSON exceeds limit');
            }
            throw error;
        }
        if (jsonBytes > maxJsonBytes) {
            throw new RangeError('Decoded binary JSON exceeds limit');
        }
        const paths: Set<string> = new Set();
        const carriers: BinaryDecodedCarrier[] = [];
        const parts: readonly unknown[] = header['parts'];
        let offset: number = 8 + length;
        let raw: unknown;
        for (raw of parts) {
            if (!BinaryEnvelopeDecodePlan.#part(raw) || raw.length > frame.length - offset) {
                throw new TypeError('Invalid binary envelope part');
            }
            if (
                raw.encoding === BinaryEncoding.Bytes &&
                (!BinaryJsonValidation.record(this.json) ||
                    this.json['method'] !== 'data.upload.chunk' ||
                    raw.path.length !== 2 ||
                    raw.path[0] !== 'params' ||
                    raw.path[1] !== 'data' ||
                    raw.length < 1 ||
                    raw.length > 4 * 1024 * 1024 ||
                    parts.length !== 1)
            ) {
                throw new TypeError('Raw bytes are restricted to bounded disk upload chunks');
            }
            const path: string = JSON.stringify(raw.path);
            if (paths.has(path)) {
                throw new TypeError('Binary field must reference an unused placeholder');
            }
            paths.add(path);
            const target: BinaryDecodedCarrier = BinaryEnvelopeDecodePlan.#target(
                this.json,
                raw,
                offset,
            );
            const workingBytes: number = BinaryRequestMemory.carrier(
                raw.length,
                raw.encoding,
                frame.buffer.byteLength !== frame.byteLength,
            );
            BinaryEnvelopeDecodePlan.#reserve(admission, workingBytes);
            let replacementBytes: number =
                raw.encoding === BinaryEncoding.Bytes
                    ? raw.length
                    : 2 + Math.ceil(raw.length / 3) * 4;
            if (raw.encoding === BinaryEncoding.Array) {
                replacementBytes = 2 + Math.max(0, raw.length - 1);
                for (let index: number = offset; index < offset + raw.length; index += 1) {
                    const byte: number | undefined = frame[index];
                    if (byte === undefined) {
                        throw new TypeError('Changed binary envelope storage');
                    }
                    replacementBytes += byte < 10 ? 1 : byte < 100 ? 2 : 3;
                }
            }
            jsonBytes += replacementBytes - 4;
            if (jsonBytes > maxJsonBytes) {
                throw new RangeError('Decoded binary JSON exceeds limit');
            }
            carriers.push(Object.freeze(target));
            offset += raw.length;
        }
        if (offset !== frame.length) {
            throw new RangeError('Unexpected trailing binary bytes');
        }
        this.carriers = Object.freeze(carriers);
    }

    /** Acquires credit before a parse, decoded array, base64 string or associated clone exists. */
    static #reserve(admission: BinaryDecodeAdmission | undefined, bytes: number): void {
        if (admission !== undefined && !admission.reserve(bytes)) {
            throw new BinaryAdmissionError();
        }
    }

    /** Resolves own placeholders without writing them, including duplicate and unsafe-key rejection. */
    static #target(json: BinaryJsonValue, part: BinaryPart, offset: number): BinaryDecodedCarrier {
        let target: BinaryJsonValue = json;
        for (let index: number = 0; index < part.path.length; index += 1) {
            const key: string | undefined = part.path[index];
            if (
                key === undefined ||
                key === '__proto__' ||
                key === 'constructor' ||
                key === 'prototype' ||
                target === null ||
                typeof target !== 'object' ||
                target instanceof Uint8Array ||
                !Object.hasOwn(target, key)
            ) {
                throw new TypeError('Invalid binary field path');
            }
            if (
                Array.isArray(target) &&
                (!/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) >= target.length)
            ) {
                throw new TypeError('Invalid binary array index');
            }
            const child: BinaryJsonValue | undefined = Array.isArray(target)
                ? target[Number(key)]
                : target[key];
            if (index === part.path.length - 1) {
                if (child !== null) {
                    throw new TypeError('Binary field must reference an unused placeholder');
                }
                return { target, key, offset, length: part.length, encoding: part.encoding };
            }
            if (child === undefined) {
                throw new TypeError('Missing binary field');
            }
            target = child;
        }
        throw new TypeError('Missing binary field path');
    }

    /** Narrows external part descriptors before their path or length can control allocation. */
    static #part(value: unknown): value is BinaryPart {
        return (
            BinaryJsonValidation.record(value) &&
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
}
