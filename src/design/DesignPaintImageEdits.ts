// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignPaintLayerEdit } from './DesignPaintLayerEdit.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
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
        if (
            changes.assetId === undefined &&
            (source.kind !== DesignPaintKind.Image || source.assetId === null)
        ) {
            throw new Error('Choose an imported image asset before editing its framing.');
        }
        const { gradient: previous, ...rest }: DesignPaint = source;
        void previous;
        const { assetId, ...framing }: DesignPaintImageChanges = changes;
        return DesignStyleCodec.paint({
            ...rest,
            kind: DesignPaintKind.Image,
            assetId: assetId ?? source.assetId,
            tokenId: assetId === undefined ? source.tokenId : null,
            framing: { ...(source.framing ?? DesignDefaults.framing()), ...framing },
        });
    }
}
