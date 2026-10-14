// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Refuse truncated fields before reading or allocating them. */
export class BinaryReader {
    static readonly #utf8: TextDecoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
    readonly #data: Uint8Array;
    readonly #view: DataView;
    #offset: number = 0;
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
        const offset: number = this.#take(size);
        return Uint8Array.from(this.#data.subarray(offset, offset + size));
    }
    /** Read bounded, valid UTF-8. */
    public str(): string {
        const size: number = this.u32();
        if (size > 65536) {
            throw new Error('Company text exceeds limits');
        }
        const offset: number = this.#take(size);
        return BinaryReader.#utf8.decode(this.#data.subarray(offset, offset + size));
    }
    #take(size: number): number {
        if (!Number.isSafeInteger(size) || size < 0 || size > this.remaining) {
            throw new Error('Truncated company packet');
        }
        const offset = this.#offset;
        this.#offset += size;
        return offset;
    }
}
