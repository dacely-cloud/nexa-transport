// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignTokenCategory } from './DesignTypes.js';
import type { DesignTokenChanges } from './DesignOperationTypes.js';

/** Partial token changes never replace unrelated saved design-system values. */
export class DesignTokenChangesCodec {
    /** Color validation uses the merged category when the edit is applied. */
    public static changes(raw: unknown): DesignTokenChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['name', 'value', 'category'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply at least one token property.');
        }
        return {
            ...(value['name'] === undefined ? {} : { name: V.text(value['name']) }),
            ...(value['value'] === undefined ? {} : { value: V.text(value['value'], 256) }),
            ...(value['category'] === undefined
                ? {}
                : { category: V.choice(value['category'], Object.values(DesignTokenCategory)) }),
        };
    }
}
