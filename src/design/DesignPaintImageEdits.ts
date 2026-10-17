// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignPaintLayerEdit } from './DesignPaintLayerEdit.js';
import { DesignPaintSourceEdits } from './DesignPaintSourceEdits.js';
import { DesignPaintKind, type DesignNode, type DesignPaint } from './DesignTypes.js';
import type { DesignPaintImageChanges, DesignPaintImageOperation } from './DesignOperationTypes.js';

/** Image edits share authored-layer, instance-root and paint-slot authority with other paint edits. */
export class DesignPaintImageEdits {
    /** Native storage admits referenced assets against the authenticated document owner before saving. */
    public static apply(
        authority: DesignLayerAuthority,
        operation: DesignPaintImageOperation,
    ): DesignNode {
        return DesignPaintLayerEdit.apply(authority, operation, (paint: DesignPaint): DesignPaint =>
            this.paint(paint, operation.changes),
        );
    }
    /** Replacing an image retains framing; conversion clears gradient geometry and color-token linkage. */
    public static paint(source: DesignPaint, changes: DesignPaintImageChanges): DesignPaint {
        const { assetId, ...framing }: DesignPaintImageChanges = changes;
        return DesignPaintSourceEdits.paint(source, DesignPaintKind.Image, assetId, framing);
    }
}
