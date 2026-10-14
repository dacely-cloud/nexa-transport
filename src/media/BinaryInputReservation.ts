// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryByteBudget } from './BinaryByteBudget';
import { BinaryChunkCredit } from './BinaryChunkCredit';
import { BinaryAdmissionError } from './BinaryAdmissionError';
import type { BinaryDecodeAdmission } from './interface/BinaryDecodeAdmission';

/** Keeps one inbound allocation admitted from reassembly through decoding and consumer completion. */
export class BinaryInputReservation implements BinaryDecodeAdmission {
    readonly #credit: BinaryChunkCredit;
    #closed: boolean = false;

    /** Construction follows successful admission and retains counters, never the payload buffer. */
    private constructor(
        credit: BinaryChunkCredit,
        public readonly limit: number,
    ) {
        this.#credit = credit;
        Object.freeze(this);
    }

    /** Keeps completed credit live, growing only its existing charge instead of releasing/reacquiring it. */
    public static acquire(
        budget: BinaryByteBudget,
        bytes: number,
        input?: BinaryChunkCredit,
    ): BinaryInputReservation {
        if (input !== undefined && !input.belongsTo(budget)) {
            throw new RangeError('Foreign inbound allocation owner');
        }
        let credit: BinaryChunkCredit | undefined = input;
        try {
            if (credit === undefined) {
                credit = new BinaryChunkCredit(budget, 0);
            }
            const target: number = Math.max(bytes, credit.used);
            if (
                !Number.isSafeInteger(bytes) ||
                bytes < 0 ||
                target > budget.limit ||
                !credit.reserve(target - credit.used)
            ) {
                throw new BinaryAdmissionError();
            }
            return new BinaryInputReservation(credit, budget.limit);
        } catch (error: unknown) {
            if (input === undefined) {
                credit?.close();
            }
            throw error;
        }
    }

    /** All storage still held by this input lifetime. */
    public get used(): number {
        return this.#closed ? 0 : this.#credit.used;
    }

    /** Decoder expansion is admitted before metadata, strings or arrays are allocated. */
    public readonly reserve: (bytes: number) => boolean = (bytes: number): boolean =>
        !this.#closed &&
        Number.isSafeInteger(bytes) &&
        bytes >= 0 &&
        bytes <= this.limit - this.#credit.used &&
        this.#credit.reserve(bytes);

    /** Exactly-once release remains safe after disconnect and late asynchronous consumer settlement. */
    public close(): void {
        if (this.#closed) {
            return;
        }
        this.#closed = true;
        this.#credit.close();
    }
}
