// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryEncoding } from './BinaryEncoding';
import type { BinaryJsonObject } from './BinaryJsonObject';
import type { BinaryJsonValue } from './BinaryJsonValue';

/** Validated destination in the decoder's owned metadata tree, before carrier expansion. */
export interface BinaryDecodedCarrier {
    /** Owned container whose placeholder is replaced only after full plan admission. */
    readonly target: BinaryJsonObject | BinaryJsonValue[];
    /** Validated own-property name or array index. */
    readonly key: string;
    /** Body offset within the exact incoming frame view. */
    readonly offset: number;
    /** Admitted body length. */
    readonly length: number;
    /** Required restoration format. */
    readonly encoding: BinaryEncoding;
}
