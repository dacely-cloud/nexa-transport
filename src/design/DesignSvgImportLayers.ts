// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgImportMasks } from './DesignSvgImportMasks.js';
import { DesignSvgImportStyles } from './DesignSvgImportStyles.js';
import type { DesignSvgLayerContext } from './DesignSvgImportContext.js';
import { DesignSvgImportUse } from './DesignSvgImportUse.js';
import { DesignSvgImportViewport, type DesignSvgViewportPlan } from './DesignSvgImportViewport.js';
import { DesignSvgImportClipPaths } from './DesignSvgImportClipPaths.js';
import { DesignSvgImportMask } from './DesignSvgImportMask.js';
import { DesignSvgImportShape } from './DesignSvgImportShape.js';
import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignSvgImportAppearance } from './DesignSvgImportAppearance.js';
import { DesignSvgXml, type DesignSvgElement } from './DesignSvgXml.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import { DesignSvgImportPaints } from './DesignSvgImportPaints.js';
import { DesignSvgRootTransform } from './DesignSvgRootTransform.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignCodec } from './DesignCodec.js';
import type { DesignNode } from './DesignTypes.js';

/** One imported artboard and its editable layer forest, without any original markup embedded in nodes. */
export interface DesignSvgLayerImport {
    readonly rootId: string;
    readonly nodes: readonly DesignNode[];
}

/** SVG import authors ordinary native layers that use the same editor, paths, paints and undo. */
export class DesignSvgImportLayers {
    #tree: DesignSvgImportTree = new DesignSvgImportTree();
    #elements: Map<string, DesignSvgElement> = new Map();
    #ancestors: Map<DesignSvgElement, readonly DesignSvgElement[]> = new Map();
    #sequence: number = 0;
    #shape: DesignSvgImportShape;
    #clips: DesignSvgImportClipPaths;
    #viewports: DesignSvgImportViewport;
    #masks: DesignSvgImportMasks;
    #css: DesignSvgCss;
    #paints: DesignSvgImportPaints;
    public constructor(
        public readonly root: DesignSvgElement,
        public readonly identify: (key: string) => string,
    ) {
        const visit: (element: DesignSvgElement, parents: readonly DesignSvgElement[]) => void = (
            element: DesignSvgElement,
            parents: readonly DesignSvgElement[],
        ): void => {
            this.#ancestors.set(element, parents);
            const id: string | undefined = element.attributes['id'];
            if (id !== undefined) {
                if (this.#elements.has(id)) {
                    throw new Error('Duplicate SVG id ' + id);
                }
                this.#elements.set(id, element);
            }
            for (const child of element.children) {
                if (typeof child !== 'string') {
                    visit(child, [...parents, element]);
                }
            }
        };
        visit(root, []);
        this.#css = new DesignSvgCss(root);
        this.#paints = new DesignSvgImportPaints(this.#elements, this.#css, this.#ancestors);
        this.#shape = new DesignSvgImportShape(this.#paints, this.#tree, this.identify);
        const masks: DesignSvgImportMask = new DesignSvgImportMask(this.#tree, this.identify);
        this.#viewports = new DesignSvgImportViewport(this.#tree, masks, this.identify);
        this.#clips = new DesignSvgImportClipPaths(
            this.#elements,
            this.#css,
            this.#ancestors,
            this.#tree,
            masks,
            this.identify,
        );
        this.#masks = new DesignSvgImportMasks(
            this.#elements,
            new DesignSvgImportStyles(this.#css, this.#ancestors),
            this.#tree,
            masks,
            this.#viewports,
            (element: DesignSvgElement, context: DesignSvgLayerContext): Promise<string | null> =>
                this.#visit(element, context, true),
        );
    }
    public static async parse(
        source: string,
        name: string,
        identify: (key: string) => string,
    ): Promise<DesignSvgLayerImport> {
        return new DesignSvgImportLayers(new DesignSvgXml(source).parse(), identify).build(name);
    }
    public async build(name: string): Promise<DesignSvgLayerImport> {
        const a: Readonly<Record<string, string>> = this.root.attributes;
        const style: Readonly<Record<string, string>> = this.#css.resolve(this.root, [], {});
        const box: readonly number[] =
            a['viewBox'] === undefined ? [] : DesignSvgNumbers.list(a['viewBox'], 4);
        const width: number = DesignSvgNumbers.length(
            style['width'] ?? a['width'] ?? '',
            box[2] ?? 300,
            box[2] ?? 300,
        );
        const height: number = DesignSvgNumbers.length(
            style['height'] ?? a['height'] ?? '',
            box[3] ?? 150,
            box[3] ?? 150,
        );
        const viewport: ReturnType<typeof T.viewport> = T.viewport(
            width,
            height,
            a['viewBox'],
            a['preserveAspectRatio'],
        );
        DesignSvgImportAppearance.validate(style, true);
        const transform: DesignSvgMatrix = DesignSvgRootTransform.matrix(style, width, height);
        const transformed: boolean =
            transform.a !== 1 ||
            transform.b !== 0 ||
            transform.c !== 0 ||
            transform.d !== 1 ||
            transform.e !== 0 ||
            transform.f !== 0;
        if (transform.a * transform.d - transform.b * transform.c === 0) {
            throw new Error('SVG root transform must be invertible.');
        }
        const rootId: string = this.identify('root');
        const contentId: string = transformed ? this.identify('root-content') : rootId;
        const base: DesignNode = DesignDefaults.node(rootId, 'frame', name);
        const matrix: DesignSvgMatrix = T.multiply(transform, viewport.matrix);
        const children: string[] = [];
        this.#tree.append({
            ...base,
            width,
            height,
            opacity: DesignSvgImportAppearance.opacity(style['opacity']),
            visible: style['display'] !== 'none',
            style: { ...base.style, fills: [] },
            layout: { ...base.layout, clip: !transformed && style['overflow'] !== 'visible' },
        });
        if (transformed) {
            this.#tree.append({
                ...DesignDefaults.node(contentId, 'group', name + ' artwork'),
                parentId: rootId,
                width,
                height,
            });
        }
        const context: DesignSvgLayerContext = {
            parentId: contentId,
            matrix,
            width: box[2] ?? width,
            height: box[3] ?? height,
            style,
            ancestors: [this.root],
            references: [],
        };
        for (const child of this.root.children) {
            if (typeof child !== 'string') {
                const id: string | null = await this.#visit(child, context);
                if (id !== null) {
                    children.push(id);
                }
            }
        }
        this.#tree.replace(contentId, (node: DesignNode): DesignNode => ({ ...node, children }));
        if (transformed) {
            this.#tree.replace(rootId, (node: DesignNode): DesignNode => ({
                ...node,
                children: [contentId],
            }));
        }
        if (style['clip-path'] !== undefined) {
            await this.#clips.apply(contentId, style['clip-path'], context);
        }
        if (style['mask'] !== undefined) {
            await this.#masks.apply(contentId, style['mask'], context);
        }
        if (transformed && style['overflow'] !== 'visible') {
            await this.#viewports.rectangle(contentId, width, height, transform);
        }
        const document: ReturnType<typeof DesignDefaults.document> = DesignCodec.document({
            ...DesignDefaults.document('svg-import'),
            pages: [{ id: 'page-1', name: 'SVG', background: '#FFFFFF', roots: [rootId] }],
            nodes: this.#tree.nodes,
        });
        return { rootId, nodes: document.nodes };
    }
    async #visit(
        element: DesignSvgElement,
        context: DesignSvgLayerContext,
        referenced: boolean = false,
    ): Promise<string | null> {
        if (
            [
                'defs',
                'style',
                'title',
                'desc',
                'metadata',
                'linearGradient',
                'radialGradient',
                'clipPath',
            ].includes(element.name)
        ) {
            return null;
        }
        if ((element.name === 'symbol' || element.name === 'mask') && !referenced) {
            return null;
        }
        if (context.ancestors.length + context.references.length > 64) {
            throw new Error('SVG hierarchy is too deep.');
        }
        if (
            element.attributes['xmlns'] !== undefined &&
            element.attributes['xmlns'] !== 'http://www.w3.org/2000/svg'
        ) {
            throw new Error('Unsupported SVG element namespace.');
        }
        const style: Readonly<Record<string, string>> = this.#css.resolve(
            element,
            context.ancestors,
            context.style,
        );
        DesignSvgImportAppearance.validate(style);
        const matrix: DesignSvgMatrix = T.multiply(
            context.matrix,
            T.parse(style['transform'] ?? element.attributes['transform'] ?? ''),
        );
        const id: string = this.identify('element:' + (++this.#sequence).toString());
        if (style['display'] === 'none') {
            this.#tree.excludeBounds(id);
        }
        const title: DesignSvgElement | undefined = element.children.find(
            (child): child is DesignSvgElement =>
                typeof child !== 'string' && child.name === 'title',
        );
        const name: string =
            element.attributes['inkscape:label'] ??
            element.attributes['id'] ??
            title?.children
                .filter((child): child is string => typeof child === 'string')
                .join('') ??
            element.name;
        if (['g', 'a', 'use', 'svg', 'symbol', 'mask'].includes(element.name)) {
            const base: DesignNode = DesignDefaults.node(id, 'group', name);
            this.#tree.append({
                ...base,
                parentId: context.parentId,
                width: context.width,
                height: context.height,
                opacity: DesignSvgImportAppearance.opacity(style['opacity']),
                visible: style['display'] !== 'none',
            });
            const children: string[] = [];
            let childContext: DesignSvgLayerContext = {
                ...context,
                parentId: id,
                matrix,
                style,
                ancestors: [...context.ancestors, element],
            };
            let viewport: DesignSvgViewportPlan | null = null;
            if (element.name === 'svg' || element.name === 'symbol') {
                viewport = this.#viewports.plan(element, childContext);
                if (viewport === null) {
                    this.#tree.replace(id, (node: DesignNode): DesignNode => ({
                        ...node,
                        visible: false,
                    }));
                    return id;
                }
                childContext = viewport.context;
            }
            if (element.name === 'use') {
                const plan: ReturnType<typeof DesignSvgImportUse.plan> = DesignSvgImportUse.plan(
                    element,
                    childContext,
                    this.#elements,
                );
                childContext = plan.context;
                const childId: string | null = await this.#visit(plan.element, plan.context, true);
                if (childId !== null) {
                    children.push(childId);
                }
            } else {
                for (const child of element.children) {
                    if (typeof child !== 'string') {
                        const childId: string | null = await this.#visit(child, childContext);
                        if (childId !== null) {
                            children.push(childId);
                        }
                    }
                }
            }
            this.#tree.replace(id, (node: DesignNode): DesignNode => ({ ...node, children }));
            this.#tree.tighten(id);
            if (viewport !== null) {
                await this.#viewports.clip(id, viewport);
            }
            if (style['clip-path'] !== undefined) {
                await this.#clips.apply(id, style['clip-path'], {
                    matrix: childContext.matrix,
                    width: childContext.width,
                    height: childContext.height,
                });
            }
            if (style['mask'] !== undefined) {
                await this.#masks.apply(id, style['mask'], {
                    ...childContext,
                    matrix: childContext.matrix,
                });
            }
            return id;
        }
        if (
            !['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline'].includes(
                element.name,
            )
        ) {
            throw new Error('Unsupported SVG element ' + element.name);
        }
        const shape: string | null = await this.#shape.build(element, {
            id,
            parentId: context.parentId,
            name,
            matrix,
            width: context.width,
            height: context.height,
            style,
        });
        if (shape !== null && style['clip-path'] !== undefined) {
            await this.#clips.apply(shape, style['clip-path'], {
                matrix,
                width: context.width,
                height: context.height,
            });
        }
        if (shape !== null && style['mask'] !== undefined) {
            await this.#masks.apply(shape, style['mask'], { ...context, matrix, style });
        }
        return shape;
    }
}
