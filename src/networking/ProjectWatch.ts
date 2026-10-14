// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { CompanyProjectState } from '../company/CompanyProjectTypes.js';

/** One private project subscription retains immutable callbacks and a native private sequence fence. */
export class ProjectWatch {
    #sequence: bigint = -1n;

    /** Callbacks belong to the subscribing application, never to wire-selected owners. */
    public constructor(
        public readonly project: string,
        public readonly listener: (state: CompanyProjectState) => void,
        public readonly error: (error: Error) => void,
    ) {
        Object.freeze(this);
    }

    /** Last accepted sequence; minus one requires the authoritative initial snapshot. */
    public get sequence(): bigint {
        return this.#sequence;
    }

    /** A replacement transport must receive a fresh snapshot before any update. */
    public reset(): void {
        this.#sequence = -1n;
    }

    /** The channel verifies contiguous order and project identity before advancing this fence. */
    public advance(sequence: bigint): void {
        this.#sequence = sequence;
    }
}
