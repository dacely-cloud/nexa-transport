// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { EventStream } from './EventStream.js';
import type { BinaryInputReservation } from '../media/BinaryInputReservation.js';

/** Owns queued credit without retaining queued values or their iterator. */
export class EventCredits {
    static readonly #collected: FinalizationRegistry<EventCredits> = new FinalizationRegistry(
        (credits: EventCredits): void => credits.clear(),
    );
    readonly #credits: Set<BinaryInputReservation> = new Set();

    /** Unreachable completed queues release their counters without a client or payload retention cycle. */
    public track<T>(queue: EventStream<T>): void {
        EventCredits.#collected.register(queue, this, this);
    }

    /** Adds credit only after its acquisition succeeded. */
    public add(credit: BinaryInputReservation): void {
        this.#credits.add(credit);
    }

    /** Dequeuing transfers the value to its consumer and returns its SDK-owned credit once. */
    public release(credit: BinaryInputReservation): void {
        this.#credits.delete(credit);
        credit.close();
    }

    /** Cancellation and protocol failure deterministically return every unread allocation. */
    public clear(): void {
        let credit: BinaryInputReservation;
        for (credit of this.#credits) {
            credit.close();
        }
        this.#credits.clear();
    }

    /** Terminal empty queues no longer need a collection fallback. */
    public dispose(): void {
        this.clear();
        EventCredits.#collected.unregister(this);
    }
}
