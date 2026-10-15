// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignStyle, DesignShadow } from './DesignTypes.js';

/** Export, import and GPU rendering share the same world-space effect footprint. */
export class DesignEffectMetrics {
    public static margin(style: Pick<DesignStyle, 'blur' | 'shadows'>): number {
        return Math.max(style.blur * 3, this.#shadowReach(style.shadows));
    }
    public static influence(style: Pick<DesignStyle, 'blur' | 'shadows'>): number {
        return style.blur * 3 + this.#shadowReach(style.shadows);
    }
    static #shadowReach(shadows: readonly DesignShadow[]): number {
        let reach: number = 0;
        for (const shadow of shadows) {
            reach = Math.max(
                reach,
                Math.max(Math.abs(shadow.x), Math.abs(shadow.y)) +
                    shadow.blur * 3 +
                    Math.abs(shadow.spread),
            );
        }
        return reach;
    }
}
