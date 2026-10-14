// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignLayerStyleEdit } from './DesignLayerStyleEdit.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import type { DesignNode, DesignStyle } from './DesignTypes.js';
import type { DesignStyleOperation } from './DesignOperationTypes.js';
import type { DesignBlendMode, DesignIsolation } from './DesignBlendTypes.js';

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
            (style: DesignStyle): DesignStyle => {
                const { blendMode, isolation, ...base }: DesignStyle = style;
                const nextMode: DesignBlendMode | undefined =
                    operation.changes.blendMode === null
                        ? undefined
                        : (operation.changes.blendMode ?? blendMode);
                const nextIsolation: DesignIsolation | undefined =
                    operation.changes.isolation === null
                        ? undefined
                        : (operation.changes.isolation ?? isolation);
                return DesignStyleCodec.style({
                    ...base,
                    ...(operation.changes.blur === undefined
                        ? {}
                        : { blur: operation.changes.blur }),
                    ...(operation.changes.shadows === undefined
                        ? {}
                        : { shadows: operation.changes.shadows }),
                    ...(nextMode === undefined ? {} : { blendMode: nextMode }),
                    ...(nextIsolation === undefined ? {} : { isolation: nextIsolation }),
                    corners: { ...style.corners, ...operation.changes.corners },
                });
            },
        );
    }
}
