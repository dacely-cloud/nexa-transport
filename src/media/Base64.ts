// SPDX-License-Identifier: Apache-2.0

/** Validates large carriers in bounded slices, avoiding whole-string regexp allocations. */
export class Base64 {
    public static valid(value: string): boolean {
        if (value.length % 4 !== 0) {
            return false;
        }
        const padding: number = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
        const end: number = value.length - padding;
        for (let offset: number = 0; offset < end; offset += 8192) {
            if (!/^[A-Za-z0-9+/]*$/u.test(value.slice(offset, Math.min(end, offset + 8192)))) {
                return false;
            }
        }
        return true;
    }
}
