// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    type DesignDocument,
    type DesignNode,
    type DesignBox,
    type DesignPage,
} from './DesignTypes.js';
import type { DesignSvgSelection, DesignSvgPatternSource } from './DesignSvgTypes.js';
import type { DesignLayoutResult, DesignTextMeasurer, DesignSize } from './DesignLayoutTypes.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignLayoutEngine } from './DesignLayout.js';
import { DesignSvgGeometry } from './DesignSvgGeometry.js';
import { DesignPatternReferences } from './DesignPatternReferences.js';

/** Resolves each linked source once; rendered cells never become saved image assets or copied layers. */
export class DesignPatternSources {
    readonly #nodes: ReadonlyMap<string, DesignNode>;
    readonly #sources: Map<string, DesignSvgPatternSource> = new Map();
    readonly #pages: Map<string, DesignLayoutResult> = new Map();
    readonly #active: Set<string> = new Set();
    #layers: number = 0;

    private constructor(
        public readonly document: DesignDocument,
        public readonly measurer?: DesignTextMeasurer,
        public readonly dimensions?: (id: string) => DesignSize | null,
    ) {
        this.#nodes = new Map(
            document.nodes.map((node: DesignNode): readonly [string, DesignNode] => [
                node.id,
                node,
            ]),
        );
    }

    /** Explicit exports and native previews share original vector sources and one unique asset dependency list. */
    public static prepare(
        document: DesignDocument,
        selection: DesignSvgSelection,
        measurer?: DesignTextMeasurer,
        dimensions?: (id: string) => DesignSize | null,
    ): DesignSvgSelection {
        return new DesignPatternSources(document, measurer, dimensions).#prepare(selection);
    }

    /** A preview rasterizes only this intrinsic cell, with the source's own nested patterns still linked. */
    public static cell(
        document: DesignDocument,
        componentId: string,
        measurer?: DesignTextMeasurer,
    ): DesignSvgSelection {
        return new DesignPatternSources(document, measurer).#source(componentId).selection;
    }

    #prepare(selection: DesignSvgSelection): DesignSvgSelection {
        const ids: ReadonlySet<string> = new Set(
            selection.boxes.map((box: DesignBox): string => box.id),
        );
        const references: Set<string> = new Set();
        for (const node of selection.scene.nodes) {
            if (ids.has(node.id)) {
                for (const id of DesignPatternReferences.ids(node)) {
                    references.add(id);
                }
            }
        }
        if (references.size === 0) {
            return selection;
        }
        const patterns: readonly DesignSvgPatternSource[] = [...references].map(
            (id: string): DesignSvgPatternSource => this.#source(id),
        );
        const assets: Set<string> = new Set(selection.assetIds);
        for (const pattern of patterns) {
            for (const id of pattern.selection.assetIds) {
                assets.add(id);
            }
        }
        return { ...selection, patternSources: patterns, assetIds: [...assets] };
    }

    #source(id: string): DesignSvgPatternSource {
        if (this.#active.has(id) || this.#active.size >= 64) {
            throw new Error('Pattern reference is cyclic or too deep.');
        }
        const cached: DesignSvgPatternSource | undefined = this.#sources.get(id);
        if (cached !== undefined) {
            return cached;
        }
        const component: DesignNode | undefined = this.#nodes.get(id);
        if (component?.kind !== DesignKind.Component) {
            throw new Error('Pattern paint requires an existing component definition.');
        }
        let measured: DesignSize | null = this.dimensions?.(id) ?? null;
        if (measured === null) {
            let root: DesignNode = component;
            while (root.parentId !== null) {
                const parent: DesignNode | undefined = this.#nodes.get(root.parentId);
                if (parent === undefined) {
                    throw new Error('Pattern source parent is missing.');
                }
                root = parent;
            }
            const page: DesignPage | undefined = this.document.pages.find(
                (entry: DesignPage): boolean => entry.roots.includes(root.id),
            );
            if (page === undefined) {
                throw new Error('Pattern source belongs to no page.');
            }
            let layout: DesignLayoutResult | undefined = this.#pages.get(page.id);
            if (layout === undefined) {
                layout = new DesignLayoutEngine(this.document, page.id, this.measurer).solve();
                this.#pages.set(page.id, layout);
            }
            const box: DesignBox | undefined = layout.boxes.find(
                (entry: DesignBox): boolean => entry.id === id,
            );
            measured = box ?? null;
        }
        if (measured === null || measured.width <= 0 || measured.height <= 0) {
            throw new Error('Pattern source requires positive resolved dimensions.');
        }
        let key: string = 'pattern-preview-root';
        let sequence: number = 0;
        while (
            this.#nodes.has(key) ||
            this.document.pages.some((entry: DesignPage): boolean => entry.id === key)
        ) {
            key = 'pattern-preview-root-' + String(++sequence);
        }
        const node: DesignNode = {
            ...DesignDefaults.node(key, DesignKind.Instance, component.name),
            componentId: id,
            width: measured.width,
            height: measured.height,
        };
        const scene: DesignLayoutResult = new DesignLayoutEngine(
            {
                ...this.document,
                pages: [
                    ...this.document.pages,
                    { id: key, name: 'Pattern cell', background: '#00000000', roots: [key] },
                ],
                nodes: [...this.document.nodes, node],
            },
            key,
            this.measurer,
        ).solve();
        this.#layers += scene.nodes.length;
        if (this.#layers > 20000) {
            throw new Error('Pattern sources exceed the expanded scene budget.');
        }
        this.#active.add(id);
        try {
            const selection: DesignSvgSelection = this.#prepare({
                ...DesignSvgGeometry.select(scene),
                x: 0,
                y: 0,
                width: measured.width,
                height: measured.height,
            });
            const result: DesignSvgPatternSource = { id, selection };
            this.#sources.set(id, result);
            return result;
        } finally {
            this.#active.delete(id);
        }
    }
}
