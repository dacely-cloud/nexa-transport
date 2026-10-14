// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Bounds JSON allocation before parsing, including wire storage, UTF-16 text and two decoded copies.
 * Structural overhead covers containers, properties, array slots and scalar wrappers conservatively.
 * This byte preflight does not validate JSON grammar; the parser retains responsibility for that.
 */
export class JsonFrameMemory {
    static readonly #MAX_DEPTH = 64 as const;
    static readonly #NODE_BYTES = 128 as const;
    static readonly #WIRE_MULTIPLIER = 7 as const;

    /** Measures only byte tokens; escaped quotes and structural characters inside strings are inert. */
    public static measure(bytes: Uint8Array, limit: number): number {
        if (!Number.isSafeInteger(limit) || limit <= 0) {
            throw new RangeError('Invalid JSON memory ceiling');
        }
        const length: number = bytes.byteLength;
        let charge: number =
            length * JsonFrameMemory.#WIRE_MULTIPLIER + JsonFrameMemory.#NODE_BYTES;
        if (charge > limit) {
            throw new RangeError('JSON request memory exceeds the gateway input budget');
        }
        let quoted: boolean = false;
        let escaped: boolean = false;
        let scalar: boolean = false;
        let depth: number = 0;
        for (let index: number = 0; index < length; index += 1) {
            const byte: number | undefined = bytes[index];
            if (byte === undefined) {
                throw new RangeError('JSON input storage changed during memory admission');
            }
            if (quoted) {
                if (escaped) {
                    escaped = false;
                } else if (byte === 0x5c) {
                    escaped = true;
                } else if (byte === 0x22) {
                    quoted = false;
                }
                continue;
            }
            if (byte === 0x22) {
                quoted = true;
                scalar = false;
                charge += JsonFrameMemory.#NODE_BYTES;
            } else if (byte === 0x7b || byte === 0x5b) {
                depth += 1;
                if (depth > JsonFrameMemory.#MAX_DEPTH) {
                    throw new RangeError('JSON request nesting exceeds the gateway input limit');
                }
                scalar = false;
                charge += JsonFrameMemory.#NODE_BYTES;
            } else if (byte === 0x7d || byte === 0x5d) {
                depth = Math.max(0, depth - 1);
                scalar = false;
            } else if (byte === 0x2c || byte === 0x3a || byte <= 0x20) {
                scalar = false;
            } else if (!scalar) {
                scalar = true;
                charge += JsonFrameMemory.#NODE_BYTES;
            }
            if (charge > limit) {
                throw new RangeError('JSON request memory exceeds the gateway input budget');
            }
        }
        return charge;
    }
}
