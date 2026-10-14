// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Distinguishes denied allocation credit from malformed binary protocol data. */
export class BinaryAdmissionError extends RangeError {
    /** Allocation owners translate this failure to their backpressure policy and release credit. */
    public constructor() {
        super('Binary request memory exceeds the gateway input budget');
        this.name = 'BinaryAdmissionError';
    }
}
