// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Measures TextEncoder's UTF-8 length without allocating its output buffer. */
export class Utf8Bytes {
    static readonly #ascii: RegExp = /^\p{ASCII}*$/u;
    /** Saturates at limit + 1, including replacement bytes for unpaired UTF-16 surrogates. */
    public static measure(value: string, limit: number): number {
        if (!Number.isSafeInteger(limit) || limit < 0) {
            throw new RangeError('Invalid UTF-8 byte ceiling');
        }
        if (value.length > limit) {
            return limit + 1;
        }
        if (Utf8Bytes.#ascii.test(value)) {
            return value.length;
        }
        let size: number = 0;
        for (let index: number = 0; index < value.length && size <= limit; index += 1) {
            const code: number = value.charCodeAt(index);
            if (code < 0x80) {
                size += 1;
            } else if (code < 0x800) {
                size += 2;
            } else if (
                code >= 0xd800 &&
                code <= 0xdbff &&
                value.charCodeAt(index + 1) >= 0xdc00 &&
                value.charCodeAt(index + 1) <= 0xdfff
            ) {
                size += 4;
                index += 1;
            } else {
                size += 3;
            }
        }
        return Math.min(size, limit + 1);
    }
}
