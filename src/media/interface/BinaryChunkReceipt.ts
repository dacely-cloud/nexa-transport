// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryChunkCredit } from '../BinaryChunkCredit';

/** Completed input keeps its transfer reservation until the consumer adopts or releases it. */
export interface BinaryChunkReceipt {
    readonly buffer: ArrayBuffer;
    readonly credit: BinaryChunkCredit | null;
}
