// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryJsonObject } from './BinaryJsonObject';

/** Finite JSON values and byte carriers borrowed for the duration of synchronous framing. */
export type BinaryJsonValue =
    null | boolean | number | string | Uint8Array | BinaryJsonValue[] | BinaryJsonObject;
