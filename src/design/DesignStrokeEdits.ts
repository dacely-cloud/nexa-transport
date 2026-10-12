// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignLayerStyleEdit } from './DesignLayerStyleEdit.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignDefaults } from './DesignDefaults.js';
import type { DesignNode, DesignStyle, DesignStroke } from './DesignTypes.js';
import type { DesignStrokeOperation } from './DesignOperationTypes.js';

/** Native border patches use complete stored styles while source bodies remain deferred at the client. */
export class DesignStrokeEdits {
    /** A new border starts with the canonical gray solid paint, one unit width and no dashes. */
    public static apply(
        authority: DesignLayerAuthority,
        operation: DesignStrokeOperation,
    ): DesignNode {
        return DesignLayerStyleEdit.apply(
            authority,
            operation.id,
            operation.pageId,
            (style: DesignStyle): DesignStyle => {
                const before: DesignStroke = style.stroke ?? {
                    paint: DesignDefaults.paint('#808080'),
                    width: 1,
                    dash: [],
                };
                return DesignStyleCodec.style({
                    ...style,
                    stroke: operation.changes === null ? null : { ...before, ...operation.changes },
                });
            },
        );
    }
}
