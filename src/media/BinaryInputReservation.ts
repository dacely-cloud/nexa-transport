// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryByteBudget } from './BinaryByteBudget';
import { BinaryChunkCredit } from './BinaryChunkCredit';
import { BinaryAdmissionError } from './BinaryAdmissionError';
import { BinaryAllocationCredit } from './BinaryAllocationCredit';
import type { BinaryDecodeAdmission } from './interface/BinaryDecodeAdmission';

/** Keeps one inbound allocation admitted from reassembly through decoding and consumer completion. */
export class BinaryInputReservation implements BinaryDecodeAdmission {
    readonly #credit: BinaryAllocationCredit;
    readonly #owner: symbol;
    #closed: boolean = false;

    /** Construction follows successful admission and retains counters, never the payload buffer. */
    private constructor(
        credit: BinaryAllocationCredit,
        owner: symbol,
        public readonly limit: number,
    ) {
        this.#credit = credit;
        this.#owner = owner;
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
        const credit: BinaryAllocationCredit | null =
            input === undefined
                ? BinaryAllocationCredit.acquire(budget, budget.limit, bytes)
                : BinaryAllocationCredit.adopt(budget, budget.limit, bytes, input);
        if (credit === null) {
            throw new BinaryAdmissionError();
        }
        return BinaryInputReservation.#create(credit, credit.initialOwner);
    }

    /** A queued consumer extends the existing input's lifetime without counting its storage twice. */
    public retain(minimumBytes: number = this.used): BinaryInputReservation {
        if (this.#closed) {
            throw new RangeError('Inbound input owner is closed');
        }
        const owner: symbol | null = this.#credit.retain(minimumBytes);
        if (owner === null) {
            throw new BinaryAdmissionError();
        }
        return BinaryInputReservation.#create(this.#credit, owner);
    }

    /** Failed wrapper construction returns only the owner it just acquired. */
    static #create(credit: BinaryAllocationCredit, owner: symbol): BinaryInputReservation {
        try {
            return new BinaryInputReservation(credit, owner, credit.limit);
        } catch (error: unknown) {
            credit.release(owner);
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
        this.#credit.reserve(this.#owner, bytes);

    /** Exactly-once release remains safe after disconnect and late asynchronous consumer settlement. */
    public close(): void {
        if (this.#closed) {
            return;
        }
        this.#closed = true;
        this.#credit.release(this.#owner);
    }
}
