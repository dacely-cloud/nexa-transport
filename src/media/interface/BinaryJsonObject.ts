// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryJsonValue } from './BinaryJsonValue';

/** Validated JSON fields; undefined fields are omitted when producing metadata. */
export interface BinaryJsonObject {
    readonly [key: string]: BinaryJsonValue | undefined;
}
