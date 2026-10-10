// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BrowserStorageComparison, BrowserStorageChange } from '../protocol/Protocol.js';

/** Native comparison enumeration. */
export const BrowserStorageCompareStatus = {
    Changed: 'changed',
    Unchanged: 'unchanged',
    Unknown: 'unknown',
} as const;
/** Native comparison selection type. */
export type BrowserStorageCompareStatus = (typeof BrowserStorageCompareStatus)[keyof typeof BrowserStorageCompareStatus];

/** Native comparison enumeration. */
export const BrowserStorageCompareMode = {
    Fingerprints: 'fingerprints',
    Names: 'names',
    Unavailable: 'unavailable',
} as const;
/** Native comparison selection type. */
export type BrowserStorageCompareMode = (typeof BrowserStorageCompareMode)[keyof typeof BrowserStorageCompareMode];

/** Native comparison enumeration. */
export const BrowserStorageChangeKind = {
    Added: 'added',
    Removed: 'removed',
    Modified: 'modified',
} as const;
/** Native comparison selection type. */
export type BrowserStorageChangeKind = (typeof BrowserStorageChangeKind)[keyof typeof BrowserStorageChangeKind];

/** Complete host reports stay separate from paged wire contracts. */
export interface BrowserStorageComparisonCapture { readonly comparison: BrowserStorageComparison; readonly changes: readonly BrowserStorageChange[]; }
