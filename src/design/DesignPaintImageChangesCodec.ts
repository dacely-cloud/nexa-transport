// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignImageFit } from './DesignTypes.js';
import type { DesignPaintImageChanges } from './DesignOperationTypes.js';

/** Validates compact owner-asset placement and bounded image framing before mutation. */
export class DesignPaintImageChangesCodec {
    /** Empty patches and unknown properties cannot silently produce a partial edit. */
    public static changes(raw: unknown): DesignPaintImageChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['assetId', 'fit', 'cropX', 'cropY', 'scale'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply an image asset or framing property.');
        }
        return {
            ...(value['assetId'] === undefined ? {} : { assetId: V.id(value['assetId']) }),
            ...(value['fit'] === undefined
                ? {}
                : { fit: V.choice(value['fit'], Object.values(DesignImageFit)) }),
            ...(value['cropX'] === undefined ? {} : { cropX: V.number(value['cropX'], -1, 1) }),
            ...(value['cropY'] === undefined ? {} : { cropY: V.number(value['cropY'], -1, 1) }),
            ...(value['scale'] === undefined ? {} : { scale: V.number(value['scale'], 0.01, 100) }),
        };
    }
}
