// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryChunkBudget } from './interface/BinaryChunkBudget';
import type { BinaryChunkReceipt } from './interface/BinaryChunkReceipt';
import { BinaryChunkCredit } from './BinaryChunkCredit';

/** Owns one ordered transfer, allocating only received capacity and charging growth before copying. */
export class BinaryChunkTransfer {
    static readonly #OVERHEAD = 512 as const;
    static readonly #EMPTY: Uint8Array<ArrayBuffer> = new Uint8Array(0);
    readonly #credit: BinaryChunkCredit;
    readonly #expired: () => void;
    #data: Uint8Array<ArrayBuffer>;
    #offset: number = 0;
    #timer: ReturnType<typeof setTimeout> | null = null;
    #closed: boolean = false;

    /** The caller validates total and first payload against the wire limits before construction. */
    public constructor(
        public readonly id: string,
        public readonly total: number,
        firstBytes: number,
        budget: BinaryChunkBudget,
        expired: () => void,
    ) {
        if (
            !Number.isSafeInteger(total) ||
            total < 1 ||
            !Number.isSafeInteger(firstBytes) ||
            firstBytes < 1 ||
            firstBytes > total
        ) {
            throw new RangeError('Invalid initial binary transfer bounds');
        }
        this.#expired = expired;
        const capacity: number = Math.min(total, Math.max(4096, firstBytes));
        const charge: number = capacity + BinaryChunkTransfer.#OVERHEAD;
        this.#credit = new BinaryChunkCredit(budget, charge);
        try {
            this.#data = new Uint8Array(capacity);
        } catch (error: unknown) {
            this.#credit.close();
            throw error;
        }
        Object.freeze(this);
    }

    /** Actual received prefix length, distinct from the peer's advertised total. */
    public get offset(): number {
        return this.#offset;
    }

    /** Copies the next contiguous payload after reserving any required growth peak. */
    public append(offset: number, payload: Uint8Array): void {
        if (
            this.#closed ||
            offset !== this.#offset ||
            payload.length < 1 ||
            payload.length > this.total - this.#offset
        ) {
            throw new RangeError('Binary chunks are duplicated, interleaved or out of order');
        }
        const required: number = this.#offset + payload.length;
        if (required > this.#data.length) {
            const capacity: number = Math.min(
                this.total,
                Math.max(required, this.#data.length * 2),
            );
            if (!this.#credit.reserve(capacity)) {
                throw new RangeError('Binary transfer growth exceeds its memory budget');
            }
            let grown: Uint8Array<ArrayBuffer>;
            try {
                grown = new Uint8Array(capacity);
                grown.set(this.#data.subarray(0, this.#offset));
            } catch (error: unknown) {
                this.#credit.release(capacity);
                throw error;
            }
            const previous: number = this.#data.length;
            this.#data = grown;
            this.#credit.release(previous);
        }
        this.#data.set(payload, this.#offset);
        this.#offset = required;
    }

    /** Progress borrows this mutable prefix only until the callback returns. */
    public prefix(): Uint8Array<ArrayBuffer> {
        if (this.#closed) {
            throw new Error('Binary transfer is closed');
        }
        return this.#data.subarray(0, this.#offset);
    }

    /** Completion owns an exact-sized buffer; no final whole-transfer copy is necessary. */
    public completed(): BinaryChunkReceipt {
        if (this.#closed || this.#offset !== this.total || this.#data.length !== this.total) {
            throw new Error('Binary transfer is incomplete');
        }
        const receipt: BinaryChunkReceipt = Object.freeze({
            buffer: this.#data.buffer,
            credit: this.#credit,
        });
        this.#closed = true;
        if (this.#timer !== null) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
        this.#data = BinaryChunkTransfer.#EMPTY;
        return receipt;
    }

    /** An idle timeout resets only after actual forward progress. */
    public arm(): void {
        if (this.#closed) {
            return;
        }
        if (this.#timer !== null) {
            clearTimeout(this.#timer);
        }
        this.#timer = setTimeout(this.#expired, 30000);
    }

    /** Idempotently returns buffer and receiver metadata credit on every terminal path. */
    public close(): void {
        if (this.#closed) {
            return;
        }
        this.#closed = true;
        if (this.#timer !== null) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
        this.#credit.close();
        this.#data = BinaryChunkTransfer.#EMPTY;
    }
}
