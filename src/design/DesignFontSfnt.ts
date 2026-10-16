// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { unzlibSync } from 'fflate';
import { DesignFontContainer } from './DesignFontContainer.js';

/** HarfBuzz receives original sfnt tables, including reconstructed WOFF2 outlines for mark positioning. */
export class DesignFontSfnt {
    static readonly #decoded: WeakMap<Uint8Array, Uint8Array> = new WeakMap();
    static readonly #pending: WeakMap<Uint8Array, Promise<void>> = new WeakMap();

    /** Only compressed WOFF2 sources load the portable decoder; ordinary bundled TTF faces remain synchronous. */
    public static async prepare(bytes: Uint8Array): Promise<void> {
        DesignFontContainer.inspect(bytes);
        if (
            new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0) !==
                0x774f4632 ||
            this.#decoded.has(bytes)
        ) {
            return;
        }
        let pending: Promise<void> | undefined = this.#pending.get(bytes);
        if (pending === undefined) {
            pending = this.#decompress(bytes);
            this.#pending.set(bytes, pending);
        }
        try {
            await pending;
        } finally {
            this.#pending.delete(bytes);
        }
    }

    static async #decompress(bytes: Uint8Array): Promise<void> {
        const { default: decompress }: typeof import('woff2-encoder/decompress') =
            await import('woff2-encoder/decompress');
        const decoded: Uint8Array = await decompress(bytes);
        if (
            !(decoded instanceof Uint8Array) ||
            decoded.length > DesignFontContainer.maximum ||
            decoded.length < 12
        ) {
            throw new Error('WOFF2 font could not be reconstructed within its decoding budget.');
        }
        this.#decoded.set(bytes, decoded);
    }

    /** Existing validation bounds decompression before either codec receives the font data. */
    public static read(bytes: Uint8Array): Uint8Array {
        DesignFontContainer.inspect(bytes);
        const header: DataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const signature: number = header.getUint32(0);
        if (signature === 0x774f4632) {
            const decoded: Uint8Array | undefined = this.#decoded.get(bytes);
            if (decoded === undefined) {
                throw new Error('Prepare compressed fonts before measuring or shaping them.');
            }
            return decoded;
        }
        if (signature !== 0x774f4646) {
            return bytes;
        }
        const count: number = header.getUint16(12);
        let length: number = 12 + count * 16;
        for (let index: number = 0; index < count; index++) {
            length += Math.ceil(header.getUint32(44 + index * 20 + 12) / 4) * 4;
        }
        if (length > DesignFontContainer.maximum) {
            throw new Error('Decoded font exceeds its allocation budget.');
        }
        const output: Uint8Array<ArrayBuffer> = new Uint8Array(length);
        const view: DataView = new DataView(output.buffer);
        view.setUint32(0, header.getUint32(4));
        view.setUint16(4, count);
        const power: number = 2 ** Math.floor(Math.log2(count));
        view.setUint16(6, power * 16);
        view.setUint16(8, Math.log2(power));
        view.setUint16(10, count * 16 - power * 16);
        let destination: number = 12 + count * 16;
        for (let index: number = 0; index < count; index++) {
            const source: number = 44 + index * 20;
            const record: number = 12 + index * 16;
            const offset: number = header.getUint32(source + 4);
            const compressed: number = header.getUint32(source + 8);
            const size: number = header.getUint32(source + 12);
            const table: Uint8Array = bytes.subarray(offset, offset + compressed);
            const target: Uint8Array = output.subarray(destination, destination + size);
            if (compressed < size) {
                unzlibSync(table, { out: target });
            } else {
                target.set(table);
            }
            view.setUint32(record, header.getUint32(source));
            view.setUint32(record + 4, header.getUint32(source + 16));
            view.setUint32(record + 8, destination);
            view.setUint32(record + 12, size);
            destination += Math.ceil(size / 4) * 4;
        }
        return output;
    }
}
