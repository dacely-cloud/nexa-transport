// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BinaryJsonValue } from './interface/BinaryJsonValue.js';

/** Narrows parsed JSON with bounded nesting, without allocating another values array. */
export class BinaryJsonValidation {
    /** Accepts only finite JSON values; byte-view carriers are restored after validation. */
    public static valid(value: unknown, depth: number = 0): value is BinaryJsonValue {
        if (depth > 24) {
            return false;
        }
        if (value === null || typeof value === 'string' || typeof value === 'boolean') {
            return true;
        }
        if (typeof value === 'number') {
            return Number.isFinite(value);
        }
        if (Array.isArray(value)) {
            const entries: readonly unknown[] = value;
            let entry: unknown;
            for (entry of entries) {
                if (!BinaryJsonValidation.valid(entry, depth + 1)) {
                    return false;
                }
            }
            return true;
        }
        if (!BinaryJsonValidation.record(value)) {
            return false;
        }
        let key: string;
        for (key in value) {
            if (Object.hasOwn(value, key) && !BinaryJsonValidation.valid(value[key], depth + 1)) {
                return false;
            }
        }
        return true;
    }

    /** Narrows a parsed record before any of its external fields are inspected. */
    public static record(value: unknown): value is Readonly<Record<string, unknown>> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
}
