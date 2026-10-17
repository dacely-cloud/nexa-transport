// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignPaintLayerEdit } from './DesignPaintLayerEdit.js';
import { DesignPaintSourceEdits } from './DesignPaintSourceEdits.js';
import { DesignPaintKind, type DesignNode, type DesignPaint } from './DesignTypes.js';
import type {
    DesignPaintPatternChanges,
    DesignPaintPatternOperation,
} from './DesignOperationTypes.js';

/** Linked vector sources remain owner-document references through the existing paint-slot authority. */
export class DesignPaintPatternEdits {
    /** Definitions, masks and private text stay native during source or framing changes. */
    public static apply(
        authority: DesignLayerAuthority,
        operation: DesignPaintPatternOperation,
    ): DesignNode {
        return DesignPaintLayerEdit.apply(authority, operation, (paint: DesignPaint): DesignPaint =>
            this.paint(paint, operation.changes),
        );
    }
    /** Framing changes preserve unrelated source and paint settings. */
    public static paint(source: DesignPaint, changes: DesignPaintPatternChanges): DesignPaint {
        const { patternId, ...framing }: DesignPaintPatternChanges = changes;
        return DesignPaintSourceEdits.paint(source, DesignPaintKind.Pattern, patternId, framing);
    }
}
