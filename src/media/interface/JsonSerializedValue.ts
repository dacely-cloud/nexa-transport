// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { JsonSerializedObject } from './JsonSerializedObject.js';

/** Readonly JSON and typed byte views accepted by allocation-free serialized sizing. */
export type JsonSerializedValue =
    | null
    | boolean
    | number
    | string
    | Uint8Array
    | readonly JsonSerializedValue[]
    | JsonSerializedObject;
