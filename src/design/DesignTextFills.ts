// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignPaint } from './DesignTypes.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import { DesignDefaults } from './DesignDefaults.js';

/** Shared range-paint semantics preserve legacy color opacity and explicit stack ordering. */
export class DesignTextFills {
    /** Null and omitted stacks both retain legacy inheritance; an empty array is explicitly invisible. */
    public static same(
        left: readonly DesignPaint[] | null | undefined,
        right: readonly DesignPaint[] | null | undefined,
    ): boolean {
        return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
    }

    /** Paint coordinates remain relative to the complete text layer, including wrapped and streamed ranges. */
    public static resolve(
        layer: readonly DesignPaint[],
        style: DesignTextSpanStyle,
    ): readonly DesignPaint[] {
        if (style.fills != null) {
            return style.fills;
        }
        return style.rich
            ? layer.map((paint: DesignPaint): DesignPaint => ({
                  ...DesignDefaults.paint(style.color),
                  opacity: paint.opacity,
              }))
            : layer;
    }
}
