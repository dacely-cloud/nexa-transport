// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryEncodingValues } from './BinaryEncodingValues';

/** Immutable encoding names shared by envelope planning and restoration. */
export const BinaryEncoding: Readonly<BinaryEncodingValues> = Object.freeze({
    Base64: 'base64',
    Array: 'array',
    Bytes: 'bytes',
});

/** One encoding from the single runtime mapping. */
export type BinaryEncoding = (typeof BinaryEncoding)[keyof typeof BinaryEncoding];
