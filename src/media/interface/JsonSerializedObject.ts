// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { JsonSerializedValue } from './JsonSerializedValue.js';

/** Readonly fields exposed by a validated JSON value. */
export interface JsonSerializedObject {
    readonly [key: string]: JsonSerializedValue | undefined;
}
