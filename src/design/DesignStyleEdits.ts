// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignLayerStyleEdit } from './DesignLayerStyleEdit.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import type { DesignNode, DesignStyle } from './DesignTypes.js';
import type { DesignStyleOperation } from './DesignOperationTypes.js';

/** Native decoration patches retain paints, source bodies and component definitions. */
export class DesignStyleEdits {
    /** Only supplied corner and effect properties change, including on a local instance-root override. */
    public static apply(
        authority: DesignLayerAuthority,
        operation: DesignStyleOperation,
    ): DesignNode {
        return DesignLayerStyleEdit.apply(
            authority,
            operation.id,
            operation.pageId,
            (style: DesignStyle): DesignStyle =>
                DesignStyleCodec.style({
                    ...style,
                    ...operation.changes,
                    corners: { ...style.corners, ...operation.changes.corners },
                }),
        );
    }
}
