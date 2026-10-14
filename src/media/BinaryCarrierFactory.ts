// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { Base64 } from './Base64.js';
import { BinaryChunks } from './BinaryChunks.js';
import { BinaryEncoding } from './interface/BinaryEncoding.js';
import type { BinaryCarrier } from './interface/BinaryCarrier.js';
import type { Base64ByteTarget } from './interface/Base64ByteTarget.js';
import type { Base64DecodeResult } from './interface/Base64DecodeResult.js';

/** Validates carrier values without enumerating typed bytes or allocating decoded payloads. */
export class BinaryCarrierFactory {
    static readonly #ALPHABET: string =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    /** Leaves noncanonical aliases in metadata so restoration preserves their exact original text. */
    public static base64(value: string, path: readonly string[]): BinaryCarrier | null {
        if (value.length > Math.ceil(BinaryChunks.MAX_FILE_BYTES / 3) * 4) {
            throw new RangeError('Binary envelope exceeds limits');
        }
        if (value.length % 4 !== 0 || !Base64.valid(value)) {
            return null;
        }
        const padding: number = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
        const last: string | undefined = value[value.length - padding - 1];
        if (
            padding !== 0 &&
            (last === undefined ||
                (BinaryCarrierFactory.#ALPHABET.indexOf(last) & (padding === 2 ? 15 : 3)) !== 0)
        ) {
            return null;
        }
        const length: number = (value.length / 4) * 3 - padding;
        BinaryCarrierFactory.#length(length);
        return {
            part: { path, length, encoding: BinaryEncoding.Base64 },
            mutateFrameBytes: (mutateDestination: Uint8Array, offset: number): void => {
                const target: Uint8Array = mutateDestination.subarray(offset, offset + length);
                const native: Base64ByteTarget = target;
                if (typeof native.setFromBase64 === 'function') {
                    const result: Base64DecodeResult = native.setFromBase64(value);
                    if (result.read !== value.length || result.written !== length) {
                        throw new RangeError('Incomplete binary base64 carrier');
                    }
                    return;
                }
                let written: number = 0;
                for (let at: number = 0; at < value.length; at += 8192) {
                    const decoded: string = atob(value.slice(at, at + 8192));
                    for (let index: number = 0; index < decoded.length; index += 1) {
                        target[written++] = decoded.charCodeAt(index);
                    }
                }
            },
        };
    }

    /** Accepts byte views, byte arrays and dense indexed objects without an Object.values copy. */
    public static array(value: unknown, path: readonly string[]): BinaryCarrier | null {
        if (value instanceof Uint8Array) {
            BinaryCarrierFactory.#length(value.byteLength);
            return {
                part: { path, length: value.byteLength, encoding: BinaryEncoding.Array },
                mutateFrameBytes: (mutateDestination: Uint8Array, offset: number): void => {
                    mutateDestination.set(value, offset);
                },
            };
        }
        if (BinaryCarrierFactory.#numberArray(value)) {
            return {
                part: { path, length: value.length, encoding: BinaryEncoding.Array },
                mutateFrameBytes: (mutateDestination: Uint8Array, offset: number): void => {
                    mutateDestination.set(value, offset);
                },
            };
        }
        if (!BinaryCarrierFactory.#numberRecord(value)) {
            return null;
        }
        let length: number = 0;
        let key: string;
        for (key in value) {
            if (Object.hasOwn(value, key)) {
                length += 1;
            }
        }
        return {
            part: { path, length, encoding: BinaryEncoding.Array },
            mutateFrameBytes: (mutateDestination: Uint8Array, offset: number): void => {
                let index: number = 0;
                let field: string;
                for (field in value) {
                    if (!Object.hasOwn(value, field)) {
                        continue;
                    }
                    const byte: number | undefined = value[field];
                    if (byte === undefined) {
                        throw new TypeError('Missing indexed byte');
                    }
                    mutateDestination[offset + index++] = byte;
                }
            },
        };
    }

    /** Checks a byte count before any frame or decoded payload allocation. */
    static #length(length: number): void {
        if (length > BinaryChunks.MAX_FILE_BYTES) {
            throw new RangeError('Binary envelope exceeds limits');
        }
    }

    /** Immediately narrows external array entries and refuses accessors without invoking them. */
    static #numberArray(value: unknown): value is readonly number[] {
        if (!Array.isArray(value)) {
            return false;
        }
        BinaryCarrierFactory.#length(value.length);
        for (let index: number = 0; index < value.length; index += 1) {
            const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                value,
                String(index),
            );
            if (descriptor?.get !== undefined || descriptor?.set !== undefined) {
                throw new TypeError('Invalid binary JSON accessor');
            }
            const byte: unknown = descriptor?.value;
            if (typeof byte !== 'number' || !Number.isInteger(byte) || byte < 0 || byte > 255) {
                return false;
            }
        }
        return true;
    }

    /** Keeps only dense own indexed records; arbitrary object keys are never converted into arrays. */
    static #numberRecord(value: unknown): value is Readonly<Record<string, number>> {
        if (
            value === null ||
            typeof value !== 'object' ||
            Array.isArray(value) ||
            (Reflect.getPrototypeOf(value) !== Object.prototype &&
                Reflect.getPrototypeOf(value) !== null)
        ) {
            return false;
        }
        let count: number = 0;
        let key: string;
        for (key in value) {
            if (!Object.hasOwn(value, key)) {
                continue;
            }
            if (key !== String(count)) {
                return false;
            }
            count += 1;
            BinaryCarrierFactory.#length(count);
            const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                value,
                key,
            );
            if (descriptor?.get !== undefined || descriptor?.set !== undefined) {
                throw new TypeError('Invalid binary JSON accessor');
            }
            const byte: unknown = descriptor?.value;
            if (typeof byte !== 'number' || !Number.isInteger(byte) || byte < 0 || byte > 255) {
                return false;
            }
        }
        return true;
    }
}
