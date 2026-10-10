// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Incremental byte accounting prevents allocating an unbounded graph before rejecting it. */
export class DesignBudget {
    #remaining: number = 16 * 1024 * 1024 - 4096;
    /** Charges each already-validated entity before the next entity is decoded. */
    public consume<T>(value: T): T {
        const encoded: string | undefined = JSON.stringify(value);
        if (encoded === undefined) {
            throw new Error('Design entity is not serializable');
        }
        this.#remaining -= new TextEncoder().encode(encoded).byteLength + 1;
        if (this.#remaining < 0) {
            throw new Error('Design document exceeds its content budget');
        }
        return value;
    }
}
