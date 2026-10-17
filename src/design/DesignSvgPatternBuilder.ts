// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import type { DesignNode, DesignPage } from './DesignTypes.js';
import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgLayerContext } from './DesignSvgImportContext.js';
import type { DesignSvgPatternSourcePlan } from './DesignSvgPatternTypes.js';
import type { DesignSvgImportTree } from './DesignSvgImportTree.js';

/** Pattern sources share normal layer conversion and remain outside the imported artboard. */
export class DesignSvgPatternBuilder {
    public constructor(
        public readonly tree: DesignSvgImportTree,
        public readonly identify: (key: string) => string,
        public readonly ancestors: ReadonlyMap<DesignSvgElement, readonly DesignSvgElement[]>,
        public readonly visit: (
            element: DesignSvgElement,
            context: DesignSvgLayerContext,
        ) => Promise<string | null>,
    ) {}

    /** Paint servers do not render as containers; child artwork retains its own normal layer effects. */
    public async build(plan: DesignSvgPatternSourcePlan): Promise<void> {
        const component: DesignNode = DesignDefaults.node(plan.id, 'component', plan.patternId);
        const contentId: string = this.identify('pattern-content:' + plan.id);
        this.tree.append({
            ...component,
            width: plan.width,
            height: plan.height,
            children: [contentId],
            style: { ...component.style, fills: [] },
            layout: { ...component.layout, clip: true },
        });
        this.tree.append({
            ...DesignDefaults.node(contentId, 'group', plan.patternId + ' artwork'),
            parentId: plan.id,
            width: plan.width,
            height: plan.height,
        });
        const context: DesignSvgLayerContext = {
            parentId: contentId,
            matrix: plan.matrix,
            width: plan.viewportWidth,
            height: plan.viewportHeight,
            style: plan.style,
            ancestors: [
                ...(this.ancestors.get(plan.definition.element) ?? []),
                plan.definition.element,
            ],
            references: plan.references,
        };
        const children: string[] = [];
        for (const child of plan.definition.children) {
            const id: string | null = await this.visit(child, context);
            if (id !== null) {
                children.push(id);
            }
        }
        this.tree.replace(contentId, (node: DesignNode): DesignNode => ({ ...node, children }));
        this.tree.tighten(contentId);
    }
    /** Library rows use resolved component bounds and cannot alter their internal paint origin. */
    public library(sourceRoots: readonly string[]): DesignPage | undefined {
        let library: DesignPage | undefined;
        if (sourceRoots.length > 0) {
            library = {
                id: this.identify('patterns-page'),
                name: 'SVG patterns',
                background: '#FFFFFF',
                roots: sourceRoots,
            };
            let x: number = 0;
            let y: number = 0;
            let row: number = 0;
            for (const id of sourceRoots) {
                const source: DesignNode = this.tree.node(id);
                if (x > 0 && x + source.width > 1600) {
                    x = 0;
                    y += row + 64;
                    row = 0;
                }
                this.tree.replace(id, (node: DesignNode): DesignNode => ({ ...node, x, y }));
                x += source.width + 64;
                row = Math.max(row, source.height);
            }
        }
        return library;
    }
}
