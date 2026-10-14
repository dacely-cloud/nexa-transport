// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryChunkBudget } from './interface/BinaryChunkBudget';

/** Holds admitted transfer storage until cancellation or an atomic handoff to its original budget. */
export class BinaryChunkCredit {
    readonly #budget: BinaryChunkBudget;
    #bytes: number;
    #closed: boolean = false;

    /** Claims credit before the receiver allocates initial storage. */
    public constructor(budget: BinaryChunkBudget, bytes: number) {
        if (!Number.isSafeInteger(bytes) || bytes < 0 || !budget.reserve(bytes)) {
            throw new RangeError('Binary transfer memory budget is exhausted');
        }
        this.#budget = budget;
        this.#bytes = bytes;
        Object.freeze(this);
    }

    /** Held storage, including a growth peak until the old buffer is discarded. */
    public get used(): number {
        return this.#bytes;
    }

    /** Claims additional capacity before allocating or copying. */
    public reserve(bytes: number): boolean {
        if (
            this.#closed ||
            !Number.isSafeInteger(bytes) ||
            bytes < 0 ||
            bytes > Number.MAX_SAFE_INTEGER - this.#bytes ||
            !this.#budget.reserve(bytes)
        ) {
            return false;
        }
        this.#bytes += bytes;
        return true;
    }

    /** Returns storage discarded during geometric growth. */
    public release(bytes: number): void {
        if (this.#closed || !Number.isSafeInteger(bytes) || bytes < 0 || bytes > this.#bytes) {
            throw new RangeError('Invalid binary transfer credit release');
        }
        this.#budget.release(bytes);
        this.#bytes -= bytes;
    }

    /** Moves existing credit once, resizing in place without returning live input storage. */
    public transferTo(budget: BinaryChunkBudget, limit: number, bytes: number): boolean {
        if (
            this.#closed ||
            budget !== this.#budget ||
            !Number.isSafeInteger(limit) ||
            limit <= 0 ||
            !Number.isSafeInteger(bytes) ||
            bytes < this.#bytes ||
            bytes > limit
        ) {
            return false;
        }
        const growth: number = bytes - this.#bytes;
        if (growth > 0 && !this.#budget.reserve(growth)) {
            return false;
        }
        this.#closed = true;
        this.#bytes = 0;
        return true;
    }

    /** Idempotently releases a cancelled transfer or an unconsumed completed receipt. */
    public close(): void {
        if (this.#closed) {
            return;
        }
        this.#closed = true;
        this.#budget.release(this.#bytes);
        this.#bytes = 0;
    }
}
