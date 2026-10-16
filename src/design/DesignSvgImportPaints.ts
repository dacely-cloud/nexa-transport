// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import type { DesignPaint, DesignGradientStop } from './DesignTypes.js';
import type { DesignGradientTransform } from './DesignGradientTypes.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import type { DesignSvgSourceBounds } from './DesignSvgImportGeometry.js';
import type { DesignPathGeometry } from './DesignPaths.js';
import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgColors } from './DesignSvgColors.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgImportPatterns } from './DesignSvgImportPatterns.js';
import { DesignSvgImageAssets } from './DesignSvgImageAssets.js';
import {
    DesignSvgTransforms as T,
    type DesignSvgMatrix,
    type DesignSvgPoint,
} from './DesignSvgTransforms.js';

/** Both bounding boxes remain available while transformed artwork receives normalized native paint points. */
export interface DesignSvgPaintContext {
    readonly source: DesignSvgSourceBounds;
    readonly target: DesignPathGeometry;
    readonly matrix: DesignSvgMatrix;
    readonly viewportWidth: number;
    readonly viewportHeight: number;
    readonly color: string;
}
interface SvgGradientDefinition {
    readonly element: DesignSvgElement;
    readonly attributes: Readonly<Record<string, string>>;
    readonly stops: readonly DesignSvgElement[];
}

/** Local gradient references become editable native paints; no URL leaves the imported document. */
export class DesignSvgImportPaints {
    readonly #patterns: DesignSvgImportPatterns;
    public constructor(
        public readonly elements: ReadonlyMap<string, DesignSvgElement>,
        public readonly css: DesignSvgCss,
        public readonly ancestors: ReadonlyMap<DesignSvgElement, readonly DesignSvgElement[]>,
        images: DesignSvgImageAssets = new DesignSvgImageAssets(null),
    ) {
        this.#patterns = new DesignSvgImportPatterns(elements, css, ancestors, images);
    }
    /** Referenced raster assets are admitted once before synchronous geometry and rich-range rebasing. */
    public async prepare(source: string): Promise<void> {
        const id: string | null = this.#reference(source);
        if (id !== null && this.elements.get(id)?.name === 'pattern') {
            await this.#patterns.prepare(id);
        }
    }
    public resolve(
        source: string,
        opacity: number,
        context: DesignSvgPaintContext,
    ): DesignPaint | null {
        if (source === 'none') {
            return null;
        }
        const id: string | null = this.#reference(source);
        if (id === null) {
            return {
                ...DesignDefaults.paint(DesignSvgColors.parse(source, context.color)),
                opacity,
            };
        }
        if (this.elements.get(id)?.name === 'pattern') {
            return this.#patterns.resolve(id, opacity, context);
        }
        const definition: SvgGradientDefinition = this.#definition(id, new Set());
        const a: Readonly<Record<string, string>> = definition.attributes;
        if (a['spreadMethod'] !== undefined && a['spreadMethod'] !== 'pad') {
            throw new DesignSvgInputError('SVG gradient spreadMethod requires pad.');
        }
        const stops: readonly DesignGradientStop[] = this.#stops(definition.stops, context.color);
        if (stops.length === 0) {
            return null;
        }
        const last: DesignGradientStop | undefined = stops.at(-1);
        if (last === undefined) {
            throw new DesignSvgInputError('Missing SVG gradient color.');
        }
        if (stops.length === 1) {
            return { ...DesignDefaults.paint(last.color), opacity };
        }
        const object: boolean = (a['gradientUnits'] ?? 'objectBoundingBox') === 'objectBoundingBox';
        if (!object && a['gradientUnits'] !== 'userSpaceOnUse') {
            throw new DesignSvgInputError('Unsupported SVG gradientUnits.');
        }
        if (object && (context.source.width <= 0 || context.source.height <= 0)) {
            return null;
        }
        const map: DesignSvgMatrix = object
            ? {
                  a: context.source.width,
                  b: 0,
                  c: 0,
                  d: context.source.height,
                  e: context.source.x,
                  f: context.source.y,
              }
            : T.identity;
        const matrix: DesignSvgMatrix = T.multiply(
            context.matrix,
            T.multiply(map, T.parse(a['gradientTransform'] ?? '')),
        );
        const x: (key: string, fallback: string) => number = (
            key: string,
            fallback: string,
        ): number =>
            DesignSvgNumbers.length(a[key] ?? fallback, object ? 1 : context.viewportWidth);
        const y: (key: string, fallback: string) => number = (
            key: string,
            fallback: string,
        ): number =>
            DesignSvgNumbers.length(a[key] ?? fallback, object ? 1 : context.viewportHeight);
        let start: DesignSvgPoint;
        let end: DesignSvgPoint;
        let axis: DesignSvgPoint;
        const radial: boolean = definition.element.name === 'radialGradient';
        if (radial) {
            const cx: number = x('cx', '50%');
            const cy: number = y('cy', '50%');
            const radius: number = DesignSvgNumbers.length(
                a['r'] ?? '50%',
                object ? 1 : Math.hypot(context.viewportWidth, context.viewportHeight) / Math.SQRT2,
            );
            const fx: number = a['fx'] === undefined ? cx : x('fx', '50%');
            const fy: number = a['fy'] === undefined ? cy : y('fy', '50%');
            if (
                Math.abs(cx - fx) > 1e-8 ||
                Math.abs(cy - fy) > 1e-8 ||
                DesignSvgNumbers.length(a['fr'] ?? '0', 1) !== 0
            ) {
                throw new DesignSvgInputError(
                    'SVG radial gradients with an offset focal point are not supported yet.',
                );
            }
            if (radius < 0) {
                throw new DesignSvgInputError('SVG radial gradient radius must be nonnegative.');
            }
            if (radius === 0) {
                return { ...DesignDefaults.paint(last.color), opacity };
            }
            start = T.point(matrix, cx, cy);
            end = T.point(matrix, cx + radius, cy);
            axis = T.point(matrix, cx, cy + radius);
        } else {
            const x1: number = x('x1', '0%');
            const y1: number = y('y1', '0%');
            const dx: number = x('x2', '100%') - x1;
            const dy: number = y('y2', '0%') - y1;
            const length: number = dx * dx + dy * dy;
            if (length < 1e-20) {
                return { ...DesignDefaults.paint(last.color), opacity };
            }
            const determinant: number = matrix.a * matrix.d - matrix.b * matrix.c;
            if (Math.abs(determinant) < 1e-20) {
                throw new DesignSvgInputError('SVG gradient transform is singular.');
            }
            // Linear paint coordinates are covectors: an affine map uses its inverse transpose.
            const nx: number = (matrix.d * dx - matrix.b * dy) / (determinant * length);
            const ny: number = (-matrix.c * dx + matrix.a * dy) / (determinant * length);
            const denominator: number = nx * nx + ny * ny;
            start = T.point(matrix, x1, y1);
            end = { x: start.x + nx / denominator, y: start.y + ny / denominator };
            axis = { x: start.x - ny / denominator, y: start.y + nx / denominator };
        }
        const box: DesignPathGeometry = context.target;
        const gradient: DesignGradientTransform = {
            startX: (start.x - box.x) / box.width,
            startY: (start.y - box.y) / box.height,
            endX: (end.x - box.x) / box.width,
            endY: (end.y - box.y) / box.height,
            axisX: (axis.x - box.x) / box.width,
            axisY: (axis.y - box.y) / box.height,
        };
        return DesignStyleCodec.paint({
            ...DesignDefaults.paint(last.color),
            kind: radial ? 'radial' : 'linear',
            opacity,
            stops,
            gradient,
        });
    }
    #reference(source: string): string | null {
        const id: string | undefined = /^url\(\s*['"]?#([^'"\s)]+)['"]?\s*\)$/u.exec(source)?.[1];
        if (id === undefined && /^url\(/iu.test(source)) {
            throw new DesignSvgInputError(
                'SVG paint references must stay within the imported document.',
            );
        }
        return id ?? null;
    }
    #definition(id: string, visited: Set<string>): SvgGradientDefinition {
        if (visited.has(id) || visited.size > 64) {
            throw new DesignSvgInputError('SVG gradient reference is cyclic or too deep.');
        }
        visited.add(id);
        const element: DesignSvgElement | undefined = this.elements.get(id);
        if (
            element === undefined ||
            (element.name !== 'linearGradient' && element.name !== 'radialGradient')
        ) {
            throw new DesignSvgInputError('Missing SVG gradient ' + id);
        }
        const link: string | undefined =
            element.attributes['href'] ?? element.attributes['xlink:href'];
        const inherited: SvgGradientDefinition | null =
            link === undefined
                ? null
                : link.startsWith('#')
                  ? this.#definition(link.slice(1), visited)
                  : null;
        if (link !== undefined && !link.startsWith('#')) {
            throw new DesignSvgInputError(
                'SVG paint references must stay within the imported document.',
            );
        }
        const stops: readonly DesignSvgElement[] = element.children.filter(
            (child): child is DesignSvgElement =>
                typeof child !== 'string' && child.name === 'stop',
        );
        return {
            element,
            attributes: { ...inherited?.attributes, ...element.attributes },
            stops: stops.length === 0 ? (inherited?.stops ?? []) : stops,
        };
    }
    #stops(
        elements: readonly DesignSvgElement[],
        fallbackColor: string,
    ): readonly DesignGradientStop[] {
        if (elements.length > 64) {
            throw new DesignSvgInputError('SVG gradient requires at most 64 stops.');
        }
        let previous: number = 0;
        return elements.map((element: DesignSvgElement): DesignGradientStop => {
            let parent: Readonly<Record<string, string>> = {};
            const ancestors: readonly DesignSvgElement[] = this.ancestors.get(element) ?? [];
            for (let index: number = 0; index < ancestors.length; index++) {
                const ancestor: DesignSvgElement | undefined = ancestors[index];
                if (ancestor !== undefined) {
                    parent = this.css.resolve(ancestor, ancestors.slice(0, index), parent);
                }
            }
            const style: Readonly<Record<string, string>> = this.css.resolve(
                element,
                ancestors,
                parent,
            );
            const offset: number = Math.max(
                previous,
                Math.min(
                    1,
                    Math.max(0, DesignSvgNumbers.length(element.attributes['offset'] ?? '0', 1)),
                ),
            );
            previous = offset;
            const current: string = DesignSvgColors.parse(
                style['color'] ?? fallbackColor,
                fallbackColor,
            );
            const base: string = DesignSvgColors.parse(style['stop-color'] ?? '#000000', current);
            const alpha: number = base.length === 9 ? Number.parseInt(base.slice(7), 16) / 255 : 1;
            const opacity: number = Math.min(
                1,
                Math.max(0, DesignSvgNumbers.length(style['stop-opacity'] ?? '1', 1)),
            );
            const color: string =
                base.slice(0, 7) +
                (alpha * opacity < 1
                    ? Math.round(alpha * opacity * 255)
                          .toString(16)
                          .padStart(2, '0')
                          .toUpperCase()
                    : '');
            return { offset, color };
        });
    }
}
