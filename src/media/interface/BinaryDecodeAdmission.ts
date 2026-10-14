// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Allocation credit held by the request owner through decoding and asynchronous delivery. */
export interface BinaryDecodeAdmission {
    /** Total configured working-memory ceiling, used by bounded structural preflight. */
    readonly limit: number;
    /** All credit retained for this request, including previous allocation stages. */
    readonly used: number;
    /** Acquires additional credit before creating a decoded allocation. */
    readonly reserve: (bytes: number) => boolean;
}
