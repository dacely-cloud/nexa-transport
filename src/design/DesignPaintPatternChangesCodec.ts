// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignPaintImageChangesCodec } from './DesignPaintImageChangesCodec.js';
import type { DesignPaintImageChanges, DesignPaintPatternChanges } from './DesignOperationTypes.js';

/** One canonical framing validator serves raster and linked-vector paint operations. */
export class DesignPaintPatternChangesCodec {
    /** Rejects unknown keys and accessors before renaming the ID into the shared source validator. */
    public static changes(raw: unknown): DesignPaintPatternChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['patternId', ...DesignPaintImageChangesCodec.framingFields],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply a linked pattern source or framing property.');
        }
        const { patternId, ...framing }: Readonly<Record<string, unknown>> = value;
        const parsed: DesignPaintImageChanges = DesignPaintImageChangesCodec.changes({
            ...framing,
            ...(patternId === undefined ? {} : { assetId: V.id(patternId) }),
        });
        const { assetId, ...changes }: DesignPaintImageChanges = parsed;
        return { ...changes, ...(assetId === undefined ? {} : { patternId: assetId }) };
    }
}
