// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Bounded little-endian primitives shared by company persistence and the browser protocol. */
export class BinaryWriter {
    #data: Uint8Array<ArrayBuffer>;
    #length = 0;
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
        const bytes = new TextEncoder().encode(value);
        if (bytes.length > 65536) {
            throw new Error('Company text exceeds limits');
        }
        return this.u32(bytes.length).bytes(bytes);
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
        const required = this.#length + size;
        if (required > 3 * 1024 * 1024) {
            throw new Error('Company packet exceeds limits');
        }
        if (required > this.#data.length) {
            const next = new Uint8Array(
                Math.min(3 * 1024 * 1024, Math.max(required, this.#data.length * 2)),
            );
            next.set(this.#data);
            this.#data = next;
        }
    }
}

/** Refuse truncated fields before reading or allocating them. */
export class BinaryReader {
    readonly #data: Uint8Array;
    readonly #view: DataView;
    #offset = 0;
    /** Wrap a bounded packet, respecting typed-array offsets. */
    public constructor(data: Uint8Array) {
        if (data.length > 3 * 1024 * 1024) {
            throw new Error('Company packet exceeds limits');
        }
        this.#data = data;
        this.#view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }
    /** Unread byte count. */
    public get remaining(): number {
        return this.#data.length - this.#offset;
    }
    /** Read one byte. */
    public u8(): number {
        return this.#view.getUint8(this.#take(1));
    }
    /** Read a small integer. */
    public u32(): number {
        return this.#view.getUint32(this.#take(4), true);
    }
    /** Read an exact revision or monetary value. */
    public u64(): bigint {
        return this.#view.getBigUint64(this.#take(8), true);
    }
    /** Read owned raw bytes. */
    public bytes(size: number): Uint8Array<ArrayBuffer> {
        const offset = this.#take(size);
        return this.#data.slice(offset, offset + size);
    }
    /** Read bounded, valid UTF-8. */
    public str(): string {
        const size = this.u32();
        if (size > 65536) {
            throw new Error('Company text exceeds limits');
        }
        return new TextDecoder('utf-8', { fatal: true }).decode(this.bytes(size));
    }
    #take(size: number): number {
        if (!Number.isInteger(size) || size < 0 || size > this.remaining) {
            throw new Error('Truncated company packet');
        }
        const offset = this.#offset;
        this.#offset += size;
        return offset;
    }
}
