// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryEncoding } from './BinaryEncoding.js';

/** Bounded replacement location and byte length in an NXBF envelope header. */
export interface BinaryPart {
    /** Own-property path to the null placeholder. */
    readonly path: readonly string[];
    /** Byte count bounded by the envelope's admitted media ceiling. */
    readonly length: number;
    /** Representation restored after the wire body is consumed. */
    readonly encoding: BinaryEncoding;
}
