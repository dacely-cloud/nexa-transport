// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryInputReservation } from '../media/BinaryInputReservation.js';

/** Explicit consumer completion releases credit; collection is a fallback for abandoned file promises. */
export class InboundConsumerCredit {
    static readonly #collected: FinalizationRegistry<BinaryInputReservation> =
        new FinalizationRegistry<BinaryInputReservation>((credit: BinaryInputReservation): void => {
            credit.close();
        });

    /** Tracks backing storage rather than a view, so an application-owned subview keeps its charge. */
    public static track(buffer: ArrayBuffer, credit: BinaryInputReservation): void {
        InboundConsumerCredit.#collected.register(buffer, credit, credit);
    }

    /** Normal completion is deterministic; late finalizers and reconnects cannot release it twice. */
    public static release(credit: BinaryInputReservation): void {
        InboundConsumerCredit.#collected.unregister(credit);
        credit.close();
    }
}
