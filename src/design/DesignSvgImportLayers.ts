import { DesignSvgImportShape } from './DesignSvgImportShape.js';
// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignSvgImportAppearance } from './DesignSvgImportAppearance.js';
import { DesignSvgXml, type DesignSvgElement } from './DesignSvgXml.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import { DesignSvgImportPaints } from './DesignSvgImportPaints.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignCodec } from './DesignCodec.js';
import type { DesignNode } from './DesignTypes.js';

interface SvgLayerContext {
    readonly parentId: string;
    readonly matrix: DesignSvgMatrix;
    readonly width: number;
    readonly height: number;
    readonly style: Readonly<Record<string, string>>;
    readonly ancestors: readonly DesignSvgElement[];
}
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
        const box: readonly number[] =
            a['viewBox'] === undefined ? [] : DesignSvgNumbers.list(a['viewBox'], 4);
        const width: number = DesignSvgNumbers.length(
            a['width'] ?? '',
            box[2] ?? 300,
            box[2] ?? 300,
        );
        const height: number = DesignSvgNumbers.length(
            a['height'] ?? '',
            box[3] ?? 150,
            box[3] ?? 150,
        );
        const viewport: ReturnType<typeof T.viewport> = T.viewport(
            width,
            height,
            a['viewBox'],
            a['preserveAspectRatio'],
        );
        const style: Readonly<Record<string, string>> = this.#css.resolve(this.root, [], {});
        if ((style['transform'] ?? a['transform'] ?? '').trim() !== '') {
            throw new Error(
                'SVG root transforms require transformed viewport clipping; place the transform on a group.',
            );
        }
        DesignSvgImportAppearance.validate(style);
        const rootId: string = this.identify('root');
        const base: DesignNode = DesignDefaults.node(rootId, 'frame', name);
        const matrix: DesignSvgMatrix = T.multiply(
            T.parse(style['transform'] ?? a['transform'] ?? ''),
            viewport.matrix,
        );
        const children: string[] = [];
        this.#tree.append({
            ...base,
            width,
            height,
            opacity: DesignSvgImportAppearance.opacity(style['opacity']),
            visible: style['display'] !== 'none',
            style: { ...base.style, fills: [] },
            layout: { ...base.layout, clip: style['overflow'] !== 'visible' },
        });
        const context: SvgLayerContext = {
            parentId: rootId,
            matrix,
            width: box[2] ?? width,
            height: box[3] ?? height,
            style,
            ancestors: [this.root],
        };
        for (const child of this.root.children) {
            if (typeof child !== 'string') {
                const id: string | null = await this.#visit(child, context);
                if (id !== null) {
                    children.push(id);
                }
            }
        }
        this.#tree.replace(rootId, (node: DesignNode): DesignNode => ({ ...node, children }));
        const document: ReturnType<typeof DesignDefaults.document> = DesignCodec.document({
            ...DesignDefaults.document('svg-import'),
            pages: [{ id: 'page-1', name: 'SVG', background: '#FFFFFF', roots: [rootId] }],
            nodes: this.#tree.nodes,
        });
        return { rootId, nodes: document.nodes };
    }
    async #visit(element: DesignSvgElement, context: SvgLayerContext): Promise<string | null> {
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
                'mask',
                'symbol',
            ].includes(element.name)
        ) {
            return null;
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
        if (element.name === 'g' || element.name === 'a') {
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
            for (const child of element.children) {
                if (typeof child !== 'string') {
                    const childId: string | null = await this.#visit(child, {
                        ...context,
                        parentId: id,
                        matrix,
                        style,
                        ancestors: [...context.ancestors, element],
                    });
                    if (childId !== null) {
                        children.push(childId);
                    }
                }
            }
            this.#tree.replace(id, (node: DesignNode): DesignNode => ({ ...node, children }));
            this.#tree.tighten(id);
            return id;
        }
        if (
            !['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline'].includes(
                element.name,
            )
        ) {
            throw new Error('Unsupported SVG element ' + element.name);
        }
        return this.#shape.build(element, {
            id,
            parentId: context.parentId,
            name,
            matrix,
            width: context.width,
            height: context.height,
            style,
        });
    }
}
