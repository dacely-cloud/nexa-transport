// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import type { DesignSvgImportTree } from './DesignSvgImportTree.js';
import type { DesignMaskMode } from './DesignMaskTypes.js';
import type { DesignNode } from './DesignTypes.js';

/** Wraps existing artwork without changing its geometry, inherited opacity or authored identity. */
export class DesignSvgImportMask {
    #sequence: number = 0;
    public constructor(
        public readonly tree: DesignSvgImportTree,
        public readonly identify: (key: string) => string,
    ) {}
    public wrap(id: string, sourceId: string, mode: DesignMaskMode = 'alpha'): void {
        const original: DesignNode = this.tree.node(id);
        const source: DesignNode = this.tree.node(sourceId);
        const contentId: string = this.identify('clip-content:' + (++this.#sequence).toString());
        this.tree.append({
            ...original,
            id: contentId,
            parentId: id,
            x: 0,
            y: 0,
            opacity: 1,
            visible: true,
            name: original.name + ' content',
        });
        for (const childId of original.children) {
            this.tree.replace(childId, (node: DesignNode): DesignNode => ({
                ...node,
                parentId: contentId,
            }));
        }
        this.tree.replace(sourceId, (node: DesignNode): DesignNode => ({
            ...node,
            parentId: id,
            x: source.x - original.x,
            y: source.y - original.y,
        }));
        const mask: DesignNode = DesignDefaults.node(id, 'mask', original.name);
        this.tree.replace(id, (): DesignNode => ({
            ...mask,
            parentId: original.parentId,
            x: original.x,
            y: original.y,
            width: original.width,
            height: original.height,
            opacity: original.opacity,
            visible: original.visible,
            locked: original.locked,
            placement: original.placement,
            children: [sourceId, contentId],
            mask: { mode, sourceId },
        }));
    }
}
