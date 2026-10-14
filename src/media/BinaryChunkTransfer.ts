// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryChunkBudget } from './interface/BinaryChunkBudget';

/** Owns one ordered transfer, allocating only received capacity and charging growth before copying. */
export class BinaryChunkTransfer {
    static readonly #OVERHEAD = 512 as const;
    readonly #budget: BinaryChunkBudget;
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
        this.#budget = budget;
        this.#expired = expired;
        const capacity: number = Math.min(total, Math.max(4096, firstBytes));
        const charge: number = capacity + BinaryChunkTransfer.#OVERHEAD;
        if (!budget.reserve(charge)) {
            throw new RangeError('Binary transfer memory budget is exhausted');
        }
        try {
            this.#data = new Uint8Array(capacity);
        } catch (error: unknown) {
            budget.release(charge);
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
            if (!this.#budget.reserve(capacity)) {
                throw new RangeError('Binary transfer growth exceeds its memory budget');
            }
            let grown: Uint8Array<ArrayBuffer>;
            try {
                grown = new Uint8Array(capacity);
                grown.set(this.#data.subarray(0, this.#offset));
            } catch (error: unknown) {
                this.#budget.release(capacity);
                throw error;
            }
            const previous: number = this.#data.length;
            this.#data = grown;
            this.#budget.release(previous);
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
    public completed(): ArrayBuffer {
        if (this.#closed || this.#offset !== this.total || this.#data.length !== this.total) {
            throw new Error('Binary transfer is incomplete');
        }
        return this.#data.buffer;
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
        this.#budget.release(this.#data.length + BinaryChunkTransfer.#OVERHEAD);
        this.#data = new Uint8Array(0);
    }
}
