// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignStyle } from './DesignTypes.js';

/** Saved enum values produce inert SVG appearance without changing geometry or source layers. */
export class DesignSvgCompositing {
    /** Legacy styles emit the same SVG bytes; authored properties remain explicit on the logical group. */
    public static attributes(style: DesignStyle): string {
        const properties: string[] = [];
        if (style.blendMode !== undefined) {
            properties.push('mix-blend-mode:' + style.blendMode);
        }
        if (style.isolation !== undefined) {
            properties.push('isolation:' + style.isolation);
        }
        return properties.length === 0 ? '' : ` style="${properties.join(';')}"`;
    }
}
