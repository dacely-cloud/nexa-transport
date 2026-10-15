// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgImportTree } from './DesignSvgImportTree.js';
import type { DesignSvgSourceBounds } from './DesignSvgImportGeometry.js';
import type { DesignSvgFilterEffectsResult } from './DesignSvgFilterEffects.js';
import type { DesignNode } from './DesignTypes.js';
import { DesignSizing } from './DesignTypes.js';
import { DesignEffectMetrics } from './DesignEffectMetrics.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignFailure, DesignFailureReason } from './DesignFailure.js';

/** An unpainted carrier controls every native effect pass's exact region independently of source geometry. */
export class DesignSvgFilterFrame {
    #sequence: number = 0;
    public constructor(
        public readonly tree: DesignSvgImportTree,
        public readonly identify: (key: string) => string,
    ) {}
    public apply(
        id: string,
        region: DesignSvgSourceBounds,
        effects: DesignSvgFilterEffectsResult,
    ): void {
        const margin: number = DesignEffectMetrics.margin(effects);
        const width: number = region.width - margin * 2;
        const height: number = region.height - margin * 2;
        if (width < 0.01 || height < 0.01) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG shadow graph region requires a native intermediate-region representation.',
            );
        }
        const x: number = region.x + margin;
        const y: number = region.y + margin;
        const original: DesignNode = this.tree.node(id);
        const contentId: string = this.identify('filter-artwork:' + (++this.#sequence).toString());
        this.tree.append({
            ...original,
            id: contentId,
            parentId: id,
            x: original.x - x,
            y: original.y - y,
            opacity: 1,
            visible: true,
            name: original.name + ' artwork',
        });
        for (const child of original.children) {
            this.tree.replace(child, (node: DesignNode): DesignNode => ({
                ...node,
                parentId: contentId,
            }));
        }
        const base: DesignNode = DesignDefaults.node(id, 'group', original.name);
        this.tree.replace(id, (): DesignNode => ({
            ...base,
            parentId: original.parentId,
            x,
            y,
            width,
            height,
            opacity: original.opacity,
            visible: original.visible,
            locked: original.locked,
            placement: {
                ...original.placement,
                width: DesignSizing.Fixed,
                height: DesignSizing.Fixed,
            },
            children: [contentId],
            style: { ...base.style, fills: [], blur: effects.blur, shadows: effects.shadows },
        }));
    }
}
