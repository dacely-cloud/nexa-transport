// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignSvgShapePaths } from './DesignSvgShapePaths.js';
import {
    DesignSvgImportGeometry,
    type DesignSvgImportedGeometry,
} from './DesignSvgImportGeometry.js';
import { DesignSvgImportAppearance as Appearance } from './DesignSvgImportAppearance.js';
import { DesignSvgImportPaints, type DesignSvgPaintContext } from './DesignSvgImportPaints.js';
import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import type { DesignPathGeometry } from './DesignPaths.js';
import type { DesignNode, DesignPaint, DesignStroke } from './DesignTypes.js';

/** SVG geometry is already in page-local pixels; appearance keeps the original user-space paint frame. */
export interface DesignSvgShapeContext {
    readonly id: string;
    readonly parentId: string;
    readonly name: string;
    readonly matrix: DesignSvgMatrix;
    readonly width: number;
    readonly height: number;
    readonly style: Readonly<Record<string, string>>;
}

/** Imported fill and stroke layers share one logical element, including isolated opacity at overlaps. */
export class DesignSvgImportShape {
    public constructor(
        public readonly paints: DesignSvgImportPaints,
        public readonly tree: DesignSvgImportTree,
        public readonly identify: (key: string) => string,
    ) {}
    public async build(
        element: DesignSvgElement,
        context: DesignSvgShapeContext,
    ): Promise<string | null> {
        const style: Readonly<Record<string, string>> = context.style;
        const data: string = DesignSvgShapePaths.data(
            { ...element, attributes: { ...element.attributes, ...style } },
            context.width,
            context.height,
        );
        const original: DesignSvgImportedGeometry | null = await DesignSvgImportGeometry.convert(
            data,
            context.matrix,
        );
        if (original === null) {
            return null;
        }
        const evenOdd: boolean = (style['fill-rule'] ?? 'nonzero') === 'evenodd';
        if (
            style['fill-rule'] !== undefined &&
            !['nonzero', 'evenodd'].includes(style['fill-rule'])
        ) {
            throw new Error('Unsupported SVG fill-rule.');
        }
        const geometry: DesignSvgImportedGeometry | null = evenOdd
            ? await DesignSvgImportGeometry.convert(data, context.matrix, true)
            : original;
        const paintContext: DesignSvgPaintContext = {
            ...original,
            matrix: context.matrix,
            viewportWidth: context.width,
            viewportHeight: context.height,
            color: style['color'] ?? '#000000',
        };
        const fill: DesignPaint | null =
            geometry === null
                ? null
                : this.paints.resolve(
                      style['fill'] ?? '#000000',
                      Appearance.opacity(style['fill-opacity']),
                      { ...paintContext, target: geometry.target },
                  );
        const strokePaint: DesignPaint | null = this.paints.resolve(
            style['stroke'] ?? 'none',
            Appearance.opacity(style['stroke-opacity']),
            paintContext,
        );
        const width: number = DesignSvgNumbers.length(
            style['stroke-width'] ?? '1',
            Math.hypot(context.width, context.height) / Math.SQRT2,
        );
        if (width < 0) {
            throw new Error('SVG stroke width must be nonnegative.');
        }
        const dash: readonly number[] =
            (style['stroke-dasharray'] ?? 'none') === 'none'
                ? []
                : DesignSvgNumbers.list(style['stroke-dasharray'] ?? '', 16);
        if (dash.some((value: number): boolean => value < 0.01)) {
            throw new Error(
                'SVG zero or very small dash lengths require native dotted-stroke support.',
            );
        }
        const border: DesignStroke | null =
            strokePaint === null || width === 0
                ? null
                : {
                      paint: strokePaint,
                      width,
                      dash,
                      cap: Appearance.cap(style['stroke-linecap'] ?? 'butt'),
                      join: Appearance.join(style['stroke-linejoin'] ?? 'miter'),
                      miterLimit: DesignSvgNumbers.length(style['stroke-miterlimit'] ?? '4', 1),
                  };
        if (border !== null && (border.miterLimit ?? 4) < 1) {
            throw new Error('SVG miter limit must be at least one.');
        }
        const factor: number | null =
            style['vector-effect'] === 'non-scaling-stroke' ? 1 : T.strokeScale(context.matrix);
        const outlined: boolean =
            border !== null &&
            (factor === null || border.width * factor > 1000 || (border.miterLimit ?? 4) > 100);
        if (outlined || (evenOdd && border !== null)) {
            const group: DesignNode = DesignDefaults.node(context.id, 'group', context.name);
            const children: string[] = [];
            this.tree.append({
                ...group,
                parentId: context.parentId,
                opacity: Appearance.opacity(style['opacity']),
                visible: this.#visible(style),
            });
            if (fill !== null && geometry !== null) {
                const id: string = this.identify('fill:' + context.id);
                this.#path(
                    id,
                    context.id,
                    context.name + ' fill',
                    geometry.target,
                    fill,
                    null,
                    1,
                    true,
                );
                children.push(id);
            }
            if (border !== null) {
                const id: string = this.identify('stroke:' + context.id);
                if (outlined) {
                    const outline: DesignPathGeometry | null =
                        await DesignSvgImportGeometry.outline(data, context.matrix, border);
                    if (outline !== null) {
                        const paint: DesignPaint | null = this.paints.resolve(
                            style['stroke'] ?? 'none',
                            Appearance.opacity(style['stroke-opacity']),
                            { ...paintContext, target: outline },
                        );
                        if (paint !== null) {
                            this.#path(
                                id,
                                context.id,
                                context.name + ' stroke outline',
                                outline,
                                paint,
                                null,
                                1,
                                true,
                            );
                            children.push(id);
                        }
                    }
                } else {
                    this.#path(
                        id,
                        context.id,
                        context.name + ' stroke',
                        original.target,
                        null,
                        this.#scaled(border, factor ?? 1),
                        1,
                        true,
                    );
                    children.push(id);
                }
            }
            this.tree.replace(context.id, (node: DesignNode): DesignNode => ({
                ...node,
                children,
            }));
            this.tree.tighten(context.id);
        } else {
            this.#path(
                context.id,
                context.parentId,
                context.name,
                geometry?.target ?? original.target,
                fill,
                border === null ? null : this.#scaled(border, factor ?? 1),
                Appearance.opacity(style['opacity']),
                this.#visible(style),
            );
        }
        return context.id;
    }
    #scaled(stroke: DesignStroke, factor: number): DesignStroke {
        return {
            ...stroke,
            width: stroke.width * factor,
            dash: stroke.dash.map((value: number): number => value * factor),
        };
    }
    #visible(style: Readonly<Record<string, string>>): boolean {
        return (
            style['display'] !== 'none' &&
            style['visibility'] !== 'hidden' &&
            style['visibility'] !== 'collapse'
        );
    }
    #path(
        id: string,
        parentId: string,
        name: string,
        geometry: DesignPathGeometry,
        fill: DesignPaint | null,
        stroke: DesignStroke | null,
        opacity: number,
        visible: boolean,
    ): void {
        const base: DesignNode = DesignDefaults.node(id, 'path', name);
        this.tree.append({
            ...base,
            parentId,
            ...geometry,
            opacity,
            visible,
            style: DesignStyleCodec.style({
                ...base.style,
                fills: fill === null ? [] : [fill],
                stroke,
            }),
        });
    }
}
