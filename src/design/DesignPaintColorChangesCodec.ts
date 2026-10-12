// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import type { DesignPaintColorChanges } from './DesignOperationTypes.js';

/** Paint-color requests carry only RGB/alpha, opacity or a saved color reference. */
export class DesignPaintColorChangesCodec {
    /** Closed partial records reject empty, malformed and unrelated paint properties. */
    public static changes(raw: unknown): DesignPaintColorChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['color', 'tokenId', 'opacity'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply at least one paint color property.');
        }
        return {
            ...(value['color'] === undefined ? {} : { color: V.color(value['color']) }),
            ...(value['tokenId'] === undefined ? {} : { tokenId: V.optionalId(value['tokenId']) }),
            ...(value['opacity'] === undefined
                ? {}
                : { opacity: V.number(value['opacity'], 0, 1) }),
        };
    }
}
