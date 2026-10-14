// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { Utf8Bytes } from '../media/Utf8Bytes.js';

/** Bounded little-endian primitives shared by company persistence and the browser protocol. */
export class BinaryWriter {
    static readonly #utf8: TextEncoder = new TextEncoder();
    #data: Uint8Array<ArrayBuffer>;
    #length: number = 0;
    /** Start with bounded capacity and grow only as needed. */
    public constructor(capacity: number) {
        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 3 * 1024 * 1024) {
            throw new Error('Invalid company buffer capacity');
        }
        this.#data = new Uint8Array(capacity);
    }
    /** Bytes written so far. */
    public get length(): number {
        return this.#length;
    }
    /** Append one unsigned byte. */
    public u8(value: number): this {
        this.#integer(value, 255);
        this.#reserve(1);
        this.#data[this.#length++] = value;
        return this;
    }
    /** Append a bounded unsigned integer. */
    public u32(value: number): this {
        this.#integer(value, 0xffffffff);
        this.#reserve(4);
        new DataView(this.#data.buffer).setUint32(this.#length, value, true);
        this.#length += 4;
        return this;
    }
    /** Preserve all 64 bits of revisions, timestamps, and money. */
    public u64(value: bigint): this {
        if (value < 0n || value > 0xffffffffffffffffn) {
            throw new Error('Invalid company integer');
        }
        this.#reserve(8);
        new DataView(this.#data.buffer).setBigUint64(this.#length, value, true);
        this.#length += 8;
        return this;
    }
    /** Append already bounded bytes. */
    public bytes(value: Uint8Array): this {
        this.#reserve(value.length);
        this.#data.set(value, this.#length);
        this.#length += value.length;
        return this;
    }
    /** Append a length-prefixed UTF-8 string. */
    public str(value: string): this {
        const size: number = Utf8Bytes.measure(value, 65536);
        if (size > 65536) {
            throw new Error('Company text exceeds limits');
        }
        this.#reserve(4 + size);
        this.u32(size);
        const target: Uint8Array = this.#data.subarray(this.#length, this.#length + size);
        const result: TextEncoderEncodeIntoResult = BinaryWriter.#utf8.encodeInto(value, target);
        if (result.read !== value.length || result.written !== size) {
            throw new Error('Incomplete company text encoding');
        }
        this.#length += size;
        return this;
    }
    /** Return an owned packet. */
    public toBytes(): Uint8Array<ArrayBuffer> {
        return this.#data.slice(0, this.#length);
    }
    #integer(value: number, maximum: number): void {
        if (!Number.isInteger(value) || value < 0 || value > maximum) {
            throw new Error('Invalid company integer');
        }
    }
    #reserve(size: number): void {
        const required: number = this.#length + size;
        if (!Number.isSafeInteger(size) || size < 0 || required > 3 * 1024 * 1024) {
            throw new Error('Company packet exceeds limits');
        }
        if (required > this.#data.length) {
            const next: Uint8Array<ArrayBuffer> = new Uint8Array(
                Math.min(3 * 1024 * 1024, Math.max(required, this.#data.length * 2)),
            );
            next.set(this.#data);
            this.#data = next;
        }
    }
}
