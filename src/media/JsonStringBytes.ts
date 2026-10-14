// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Measures JSON string escaping and UTF-8 without first allocating an escaped or encoded string. */
export class JsonStringBytes {
    /** Returns at most limit + 1; saturation allows early rejection of oversized metadata. */
    public static measure(value: string, limit: number): number {
        if (!Number.isSafeInteger(limit) || limit < 0) {
            throw new RangeError('Invalid JSON string ceiling');
        }
        let size: number = 2;
        for (let index: number = 0; index < value.length && size <= limit; index += 1) {
            const code: number = value.charCodeAt(index);
            if (code === 0x22 || code === 0x5c) {
                size += 2;
            } else if (code < 0x20) {
                size +=
                    code === 8 || code === 9 || code === 10 || code === 12 || code === 13 ? 2 : 6;
            } else if (code < 0x80) {
                size += 1;
            } else if (code < 0x800) {
                size += 2;
            } else if (code >= 0xd800 && code <= 0xdbff) {
                const next: number = value.charCodeAt(index + 1);
                if (next >= 0xdc00 && next <= 0xdfff) {
                    size += 4;
                    index += 1;
                } else {
                    size += 6;
                }
            } else {
                size += code >= 0xdc00 && code <= 0xdfff ? 6 : 3;
            }
        }
        return Math.min(size, limit + 1);
    }
}
