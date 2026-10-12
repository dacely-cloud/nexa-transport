// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignLayerStyleEdit } from './DesignLayerStyleEdit.js';
import type { DesignStyle, DesignNode, DesignPaint } from './DesignTypes.js';
import type { DesignPaintColorTarget } from './DesignOperationTypes.js';

/** An authored layer and paint slot are verified before any compact paint property changes. */
export interface DesignPaintReference {
    readonly id: string;
    readonly pageId: string;
    readonly target: DesignPaintColorTarget;
    readonly index: number;
}
/** Shared paint edits retain stack order and unrelated style fields. */
export class DesignPaintLayerEdit {
    /** A first fill may be created; stroke paint requires an existing stroke at index zero. */
    public static apply(
        authority: DesignLayerAuthority,
        reference: DesignPaintReference,
        edit: (paint: DesignPaint) => DesignPaint,
    ): DesignNode {
        return DesignLayerStyleEdit.apply(
            authority,
            reference.id,
            reference.pageId,
            (style: DesignStyle): DesignStyle => {
                const stroke: boolean = reference.target === 'stroke';
                const before: DesignPaint | undefined = stroke
                    ? style.stroke?.paint
                    : style.fills[reference.index];
                if (stroke && (reference.index !== 0 || before === undefined)) {
                    throw new Error('Choose index 0 on an existing stroke.');
                }
                if (
                    !stroke &&
                    before === undefined &&
                    (reference.index !== 0 || style.fills.length > 0)
                ) {
                    throw new Error('Fill paint index is outside the layer.');
                }
                const source: DesignPaint = before ?? DesignDefaults.paint();
                const paint: DesignPaint = edit(source);
                const next: DesignStyle = {
                    ...style,
                    ...(stroke && style.stroke !== null
                        ? { stroke: { ...style.stroke, paint } }
                        : {
                              fills:
                                  before === undefined
                                      ? [paint]
                                      : style.fills.map(
                                            (entry: DesignPaint, index: number): DesignPaint =>
                                                index === reference.index ? paint : entry,
                                        ),
                          }),
                };
                return next;
            },
        );
    }
}
