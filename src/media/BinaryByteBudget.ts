// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryChunkBudget } from './interface/BinaryChunkBudget.js';

/** Finite local storage accounting that can share an additional parent ceiling. */
export class BinaryByteBudget implements BinaryChunkBudget {
    #used: number = 0;
    readonly #limit: number;
    readonly #parent: BinaryChunkBudget | undefined;

    /** Both ceilings must admit storage before an allocation or retained lifetime starts. */
    public constructor(limit: number, parent?: BinaryChunkBudget) {
        if (!Number.isSafeInteger(limit) || limit <= 0) {
            throw new RangeError('Invalid byte budget');
        }
        this.#limit = limit;
        this.#parent = parent;
        if (new.target === BinaryByteBudget) {
            Object.freeze(this);
        }
    }

    /** Immutable ceiling; subclasses can add state without changing this counter's authority. */
    public get limit(): number {
        return this.#limit;
    }

    /** Currently retained storage owned by this budget. */
    public get used(): number {
        return this.#used;
    }

    /** Claims local and parent credit together, without queuing work. */
    public reserve(bytes: number): boolean {
        if (
            !Number.isSafeInteger(bytes) ||
            bytes < 0 ||
            bytes > this.#limit - this.#used ||
            (this.#parent !== undefined && !this.#parent.reserve(bytes))
        ) {
            return false;
        }
        this.#used += bytes;
        return true;
    }

    /** Returns only storage this budget actually owns, including its parent's corresponding charge. */
    public release(bytes: number): void {
        if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > this.#used) {
            throw new RangeError('Invalid byte budget release');
        }
        this.#parent?.release(bytes);
        this.#used -= bytes;
    }
}
