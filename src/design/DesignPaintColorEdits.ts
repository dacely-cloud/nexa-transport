// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignPaintLayerEdit } from './DesignPaintLayerEdit.js';
import {
    DesignTokenCategory,
    type DesignNode,
    type DesignPaint,
    type DesignToken,
} from './DesignTypes.js';
import type { DesignPaintColorOperation } from './DesignOperationTypes.js';

/** Color-property edits preserve source text, vectors, paint modes and unrelated style records. */
export class DesignPaintColorEdits {
    /** Shared authored paint authority validates the page, locking and instance-root overrides. */
    public static apply(
        authority: DesignLayerAuthority,
        tokens: readonly DesignToken[],
        operation: DesignPaintColorOperation,
    ): DesignNode {
        return DesignPaintLayerEdit.apply(
            authority,
            operation,
            (source: DesignPaint): DesignPaint => {
                const detached: string | undefined =
                    operation.changes.tokenId === null &&
                    operation.changes.color === undefined &&
                    source.tokenId !== null
                        ? tokens.find(
                              (token: DesignToken): boolean =>
                                  token.id === source.tokenId &&
                                  token.category === DesignTokenCategory.Color,
                          )?.value
                        : undefined;
                return DesignStyleCodec.paint({
                    ...source,
                    ...(detached === undefined ? {} : { color: detached }),
                    ...operation.changes,
                });
            },
        );
    }
}
