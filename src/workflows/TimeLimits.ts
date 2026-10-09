// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ResourceBindingCodec } from './ResourceBindingCodec.js';

/** Portable wall-clock limits shared by admission, publications and durable waits. */
export class WorkflowTimeLimits {
    /** Total elapsed lifetime includes queued time, active execution and suspension. */
    public static readonly maximumMs: bigint = 2_592_000_000n;
    /** Run and human-response deadlines keep the existing one-second minimum. */
    public static timeout(raw: unknown, subject: string = 'Workflow run'): string {
        return this.#duration(
            raw,
            1000n,
            `${subject} timeout must be between one second and 30 days`,
        );
    }
    /** Short delays remain available without rounding sub-second durations away. */
    public static delay(raw: unknown): string {
        return this.#duration(raw, 1n, 'Choose a wait from 1 millisecond to 30 days.');
    }
    static #duration(raw: unknown, minimum: bigint, message: string): string {
        const duration: string = ResourceBindingCodec.decimal(raw);
        if (BigInt(duration) < minimum || BigInt(duration) > this.maximumMs) {
            throw new Error(message);
        }
        return duration;
    }
}
