// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignImageAdjustmentCodec } from './DesignImageAdjustmentCodec.js';
import { DesignPaintKind, type DesignPaint } from './DesignTypes.js';
import { DesignPatternGeometry } from './DesignPatternGeometry.js';
import type { DesignPaintImageChanges } from './DesignOperationTypes.js';

/** Raster and linked-vector sources share framing patches without resending their source contents. */
export class DesignPaintSourceEdits {
    /** A supplied source converts paint kind; omitted references only edit an existing matching source. */
    public static paint(
        source: DesignPaint,
        kind: typeof DesignPaintKind.Image | typeof DesignPaintKind.Pattern,
        reference: string | undefined,
        changes: Omit<DesignPaintImageChanges, 'assetId'>,
    ): DesignPaint {
        const before: string | null | undefined =
            kind === DesignPaintKind.Image ? source.assetId : source.patternId;
        if (reference === undefined && (source.kind !== kind || before == null)) {
            throw new Error(
                kind === DesignPaintKind.Image
                    ? 'Choose an imported image asset before editing its framing.'
                    : 'Choose a linked component before editing its pattern framing.',
            );
        }
        const { gradient: previous, ...rest }: DesignPaint = source;
        void previous;
        const { adjustments, ...framing }: Omit<DesignPaintImageChanges, 'assetId'> = changes;
        return DesignStyleCodec.paint({
            ...rest,
            kind,
            ...(kind === DesignPaintKind.Image
                ? { assetId: reference ?? before }
                : { patternId: reference ?? before }),
            tokenId: reference === undefined ? source.tokenId : null,
            framing: {
                ...(source.framing ??
                    (kind === DesignPaintKind.Pattern
                        ? DesignPatternGeometry.framing(source)
                        : DesignDefaults.framing())),
                ...framing,
                ...(adjustments === undefined
                    ? {}
                    : {
                          adjustments:
                              adjustments === null
                                  ? null
                                  : {
                                        ...(source.framing?.adjustments ??
                                            DesignImageAdjustmentCodec.neutral),
                                        ...adjustments,
                                    },
                      }),
            },
        });
    }
}
