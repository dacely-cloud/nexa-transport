// SPDX-License-Identifier: Apache-2.0

/** Font table lengths are checked before third-party parsing can allocate decompressed buffers. */
export class DesignFontContainer {
    public static readonly maximum: number = 32 * 1024 * 1024;
    #offset: number = 48;
    readonly #bytes: Uint8Array;

    private constructor(bytes: Uint8Array) {
        this.#bytes = bytes;
    }

    /** Validates table sums and returns a conservative bound for one decoded standalone face. */
    public static inspect(bytes: Uint8Array): number {
        if (bytes.length < 12 || bytes.length > 16 * 1024 * 1024) {
            throw new Error('Font must contain 12 bytes to 16 MiB.');
        }
        const header: DataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const signature: number = header.getUint32(0);
        if (![0x00010000, 0x4f54544f, 0x74727565, 0x774f4646, 0x774f4632].includes(signature)) {
            throw new Error('Use a standalone TTF, OTF, WOFF or WOFF2 font.');
        }
        const compressed: boolean = signature === 0x774f4646 || signature === 0x774f4632;
        const count: number = header.getUint16(compressed ? 12 : 4);
        if (count < 1 || count > 512) {
            throw new Error('Font table directory is invalid.');
        }
        if (
            compressed &&
            (bytes.length < 48 ||
                header.getUint32(8) !== bytes.length ||
                header.getUint32(16) > this.maximum)
        ) {
            throw new Error('Font container exceeds its decompression budget or is truncated.');
        }
        if (signature === 0x774f4632) {
            if (header.getUint32(4) === 0x74746366) {
                throw new Error('Font collections require a standalone face file.');
            }
            return Math.max(
                bytes.length,
                header.getUint32(16),
                new DesignFontContainer(bytes).#woff2(header, count),
            );
        }
        const start: number = compressed ? 44 : 12;
        const stride: number = compressed ? 20 : 16;
        if (start + count * stride > bytes.length) {
            throw new Error('Font table directory is truncated.');
        }
        let total: number = 0;
        for (let index: number = 0; index < count; index++) {
            const entry: number = start + index * stride;
            const offset: number = header.getUint32(entry + (compressed ? 4 : 8));
            const length: number = header.getUint32(entry + (compressed ? 8 : 12));
            const original: number = compressed ? header.getUint32(entry + 12) : length;
            total += original;
            if (
                offset + length > bytes.length ||
                total > this.maximum ||
                (compressed && length > original)
            ) {
                throw new Error('Font tables exceed the file or decompression budget.');
            }
        }
        return Math.max(bytes.length, total, compressed ? header.getUint32(16) : 0);
    }

    #woff2(header: DataView, count: number): number {
        let original: number = 0;
        let expanded: number = 0;
        for (let index: number = 0; index < count; index++) {
            const flags: number = this.#byte();
            const tag: number = flags & 63;
            let glyph: boolean = tag === 10 || tag === 11;
            if (tag === 63) {
                const custom: string = String.fromCharCode(
                    this.#byte(),
                    this.#byte(),
                    this.#byte(),
                    this.#byte(),
                );
                glyph = custom === 'glyf' || custom === 'loca';
            }
            const length: number = this.#base128();
            const version: number = flags >>> 6;
            const transformed: boolean = glyph ? version === 0 : version !== 0;
            const transformedLength: number = transformed ? this.#base128() : length;
            if ((!glyph && transformed) || (glyph && version !== 0 && version !== 3)) {
                throw new Error(
                    'Use an uncompressed font for this unsupported WOFF2 table transform.',
                );
            }
            original += length;
            expanded += transformedLength;
            if (original > DesignFontContainer.maximum || expanded > DesignFontContainer.maximum) {
                throw new Error('Font tables exceed the decompression budget.');
            }
        }
        if (this.#offset + header.getUint32(20) > this.#bytes.length) {
            throw new Error('Compressed font data is truncated.');
        }
        return Math.max(original, expanded);
    }

    #byte(): number {
        const value: number | undefined = this.#bytes[this.#offset++];
        if (value === undefined) {
            throw new Error('Font table directory is truncated.');
        }
        return value;
    }

    #base128(): number {
        let result: number = 0;
        for (let index: number = 0; index < 5; index++) {
            const value: number = this.#byte();
            if ((index === 0 && value === 128) || result > 0x1ffffff) {
                throw new Error('Invalid font table length.');
            }
            result = result * 128 + (value & 127);
            if ((value & 128) === 0) {
                return result;
            }
        }
        throw new Error('Invalid font table length.');
    }
}
