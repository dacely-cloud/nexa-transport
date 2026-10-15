// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgReferences } from './DesignSvgReferences.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgImportStyles } from './DesignSvgImportStyles.js';
import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignSvgImportMask } from './DesignSvgImportMask.js';
import { DesignSvgImportBounds } from './DesignSvgImportBounds.js';
import { DesignSvgShapePaths } from './DesignSvgShapePaths.js';
import {
    DesignSvgImportGeometry,
    type DesignSvgSourceBounds,
    type DesignSvgImportedGeometry,
} from './DesignSvgImportGeometry.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import { DesignDefaults } from './DesignDefaults.js';
import type { DesignNode } from './DesignTypes.js';

/** Clip coordinates belong to the target element's current SVG user space. */
export interface DesignSvgClipContext {
    readonly matrix: DesignSvgMatrix;
    readonly width: number;
    readonly height: number;
    /** CSS-box targets supply their untransformed layout bounds instead of descendant paint bounds. */
    readonly referenceBox?: DesignSvgSourceBounds | null;
}

/** Native editable source layers retain clipping geometry and nested intersections without rasterizing artwork. */
export class DesignSvgImportClipPaths {
    #sequence: number = 0;
    #styles: DesignSvgImportStyles;
    public constructor(
        public readonly elements: ReadonlyMap<string, DesignSvgElement>,
        public readonly css: DesignSvgCss,
        public readonly ancestors: ReadonlyMap<DesignSvgElement, readonly DesignSvgElement[]>,
        public readonly tree: DesignSvgImportTree,
        public readonly masks: DesignSvgImportMask,
        public readonly identify: (key: string) => string,
    ) {
        this.#styles = new DesignSvgImportStyles(css, ancestors);
    }
    public async apply(
        targetId: string,
        source: string,
        context: DesignSvgClipContext,
        chain: readonly string[] = [],
    ): Promise<void> {
        if (source.trim().toLowerCase() === 'none') {
            return;
        }
        const id: string = DesignSvgReferences.paint(source);
        if (chain.includes(id) || chain.length >= 32) {
            throw new Error('SVG clip reference is cyclic or too deep.');
        }
        const definition: DesignSvgElement | undefined = this.elements.get(id);
        if (definition === undefined || definition.name !== 'clipPath') {
            throw new Error('SVG clipPath not found: ' + id);
        }
        const style: Readonly<Record<string, string>> = this.#styles.definition(definition);
        const units: string = definition.attributes['clipPathUnits'] ?? 'userSpaceOnUse';
        let map: DesignSvgMatrix = T.identity;
        if (units === 'objectBoundingBox') {
            const bounds: DesignSvgSourceBounds | null =
                context.referenceBox ??
                (await DesignSvgImportBounds.measure(
                    this.tree,
                    targetId,
                    T.inverse(context.matrix),
                ));
            if (bounds === null || bounds.width === 0 || bounds.height === 0) {
                const empty: string = this.#group('Empty clip path');
                this.masks.wrap(targetId, empty);
                return;
            }
            map = { a: bounds.width, b: 0, c: 0, d: bounds.height, e: bounds.x, f: bounds.y };
        } else if (units !== 'userSpaceOnUse') {
            throw new Error('Unsupported SVG clipPathUnits.');
        }
        const matrix: DesignSvgMatrix = T.multiply(
            context.matrix,
            T.multiply(
                map,
                T.parse(style['transform'] ?? definition.attributes['transform'] ?? ''),
            ),
        );
        const sourceId: string = this.#group(definition.attributes['id'] ?? 'Clip path');
        const children: string[] = [];
        const clipContext: DesignSvgClipContext = {
            matrix,
            width: units === 'objectBoundingBox' ? 1 : context.width,
            height: units === 'objectBoundingBox' ? 1 : context.height,
        };
        const references: readonly string[] = [...chain, id];
        for (const child of definition.children) {
            if (typeof child !== 'string') {
                const drawn: string | null = await this.#shape(
                    child,
                    sourceId,
                    clipContext,
                    style,
                    this.ancestors.get(child) ?? [],
                    references,
                    new Set(),
                );
                if (drawn !== null) {
                    children.push(drawn);
                }
            }
        }
        this.tree.replace(sourceId, (node: DesignNode): DesignNode => ({ ...node, children }));
        this.tree.tighten(sourceId);
        if (style['clip-path'] !== undefined) {
            await this.apply(sourceId, style['clip-path'], clipContext, references);
        }
        this.masks.wrap(targetId, sourceId, 'vector');
    }
    #group(name: string): string {
        const id: string = this.identify('clip-source:' + (++this.#sequence).toString());
        this.tree.append(DesignDefaults.node(id, 'group', name));
        return id;
    }
    async #shape(
        element: DesignSvgElement,
        parentId: string,
        context: DesignSvgClipContext,
        parentStyle: Readonly<Record<string, string>>,
        ancestors: readonly DesignSvgElement[],
        chain: readonly string[],
        uses: ReadonlySet<string>,
    ): Promise<string | null> {
        if (['title', 'desc', 'metadata'].includes(element.name)) {
            return null;
        }
        const style: Readonly<Record<string, string>> = this.css.resolve(
            element,
            ancestors,
            parentStyle,
        );
        if (
            style['display'] === 'none' ||
            style['visibility'] === 'hidden' ||
            style['visibility'] === 'collapse'
        ) {
            return null;
        }
        const matrix: DesignSvgMatrix = T.multiply(
            context.matrix,
            T.parse(style['transform'] ?? element.attributes['transform'] ?? ''),
        );
        if (element.name === 'use') {
            const id: string = DesignSvgReferences.fragment(
                element.attributes['href'] ?? element.attributes['xlink:href'] ?? '',
            );
            if (uses.has(id) || uses.size >= 32) {
                throw new Error('SVG clip use reference is cyclic or too deep.');
            }
            const referenced: DesignSvgElement | undefined = this.elements.get(id);
            if (referenced === undefined) {
                throw new Error('SVG clip use element not found: ' + id);
            }
            const offset: DesignSvgMatrix = {
                ...T.identity,
                e: DesignSvgNumbers.length(
                    style['x'] ?? element.attributes['x'] ?? '0',
                    context.width,
                ),
                f: DesignSvgNumbers.length(
                    style['y'] ?? element.attributes['y'] ?? '0',
                    context.height,
                ),
            };
            return this.#shape(
                referenced,
                parentId,
                { ...context, matrix: T.multiply(matrix, offset) },
                style,
                [],
                chain,
                new Set([...uses, id]),
            );
        }
        if (
            !['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline'].includes(
                element.name,
            )
        ) {
            throw new Error('Unsupported SVG clip content ' + element.name);
        }
        const data: string = DesignSvgShapePaths.data(
            { ...element, attributes: { ...element.attributes, ...style } },
            context.width,
            context.height,
        );
        const rule: string = style['clip-rule'] ?? 'nonzero';
        if (rule !== 'nonzero' && rule !== 'evenodd') {
            throw new Error('Unsupported SVG clip-rule.');
        }
        const geometry: DesignSvgImportedGeometry | null = await DesignSvgImportGeometry.convert(
            data,
            matrix,
            rule === 'evenodd',
        );
        if (geometry === null) {
            return null;
        }
        const id: string = this.identify('clip-shape:' + (++this.#sequence).toString());
        const base: DesignNode = DesignDefaults.node(
            id,
            'path',
            element.attributes['id'] ?? 'Clip ' + element.name,
        );
        this.tree.append({
            ...base,
            parentId,
            ...geometry.target,
            style: { ...base.style, fills: [DesignDefaults.paint('#FFFFFF')], stroke: null },
        });
        this.tree.recordGeometry(id, geometry.target);
        if (style['clip-path'] !== undefined) {
            await this.apply(id, style['clip-path'], { ...context, matrix }, chain);
        }
        return id;
    }
}
