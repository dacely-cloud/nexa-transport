// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgImageAssets } from './DesignSvgImageAssets.js';
import { DesignSvgImportAppearance as Appearance } from './DesignSvgImportAppearance.js';
import type { DesignSvgPaintContext } from './DesignSvgImportPaints.js';
import { DesignSvgImportStyles } from './DesignSvgImportStyles.js';
import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgPatternImage, type DesignSvgPatternRaster } from './DesignSvgPatternImage.js';
import { DesignSvgReferences } from './DesignSvgReferences.js';
import {
    DesignSvgTransforms as T,
    type DesignSvgMatrix,
    type DesignSvgPoint,
} from './DesignSvgTransforms.js';
import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignPaint } from './DesignTypes.js';

interface PatternDefinition {
    readonly element: DesignSvgElement;
    readonly attributes: Readonly<Record<string, string>>;
    readonly children: readonly DesignSvgElement[];
}
interface PreparedPattern extends PatternDefinition {
    readonly raster: DesignSvgPatternRaster | null;
}

/** Full raster tiles retain their original pixels and editable native repeat/affine framing. */
export class DesignSvgImportPatterns {
    readonly #prepared: Map<string, PreparedPattern> = new Map();
    readonly #styles: DesignSvgImportStyles;
    readonly #images: DesignSvgPatternImage;

    public constructor(
        public readonly elements: ReadonlyMap<string, DesignSvgElement>,
        css: DesignSvgCss,
        public readonly ancestors: ReadonlyMap<DesignSvgElement, readonly DesignSvgElement[]>,
        assets: DesignSvgImageAssets,
    ) {
        this.#styles = new DesignSvgImportStyles(css, ancestors);
        this.#images = new DesignSvgPatternImage(elements, css, assets);
    }

    /** Loading stays asynchronous while subsequent geometry/range rebasing reuses immutable metadata. */
    public async prepare(id: string): Promise<void> {
        if (this.#prepared.has(id)) {
            return;
        }
        const definition: PatternDefinition = this.#definition(id, new Set());
        const style: Readonly<Record<string, string>> = this.#styles.definition(definition.element);
        Appearance.validate(style);
        for (const key of ['clip-path', 'mask', 'filter']) {
            if (style[key] !== undefined && style[key] !== 'none') {
                throw new DesignSvgInputError(
                    'SVG raster pattern effects require editable pattern content.',
                );
            }
        }
        if (
            (style['mix-blend-mode'] ?? 'normal') !== 'normal' ||
            !['hidden', 'clip'].includes(style['overflow'] ?? 'hidden')
        ) {
            throw new DesignSvgInputError(
                'SVG raster pattern overflow or blending requires editable pattern content.',
            );
        }
        const attributes: Readonly<Record<string, string>> = {
            ...definition.attributes,
            ...(style['transform'] === undefined ? {} : { patternTransform: style['transform'] }),
        };
        const empty: boolean =
            DesignSvgNumbers.length(attributes['width'] ?? '0', 1) === 0 ||
            DesignSvgNumbers.length(attributes['height'] ?? '0', 1) === 0;
        const raster: DesignSvgPatternRaster | null = empty
            ? null
            : await this.#images.prepare(definition.children, style, [
                  ...(this.ancestors.get(definition.element) ?? []),
                  definition.element,
              ]);
        this.#prepared.set(id, { ...definition, attributes, raster });
    }

    /** Source and destination boxes remain independent under skewed, reflected and nonuniform object transforms. */
    public resolve(
        id: string,
        opacity: number,
        context: DesignSvgPaintContext,
    ): DesignPaint | null {
        const definition: PreparedPattern | undefined = this.#prepared.get(id);
        if (definition === undefined) {
            throw new DesignSvgInputError(
                'SVG raster pattern was not prepared before paint resolution.',
            );
        }
        const a: Readonly<Record<string, string>> = definition.attributes;
        const object: boolean = this.#object(a['patternUnits'] ?? 'objectBoundingBox');
        if (object && (context.source.width <= 0 || context.source.height <= 0)) {
            return null;
        }
        const width: number = DesignSvgNumbers.length(
            a['width'] ?? '0',
            object ? 1 : context.viewportWidth,
        );
        const height: number = DesignSvgNumbers.length(
            a['height'] ?? '0',
            object ? 1 : context.viewportHeight,
        );
        if (width < 0 || height < 0) {
            throw new DesignSvgInputError('SVG pattern dimensions must be nonnegative.');
        }
        const raster: DesignSvgPatternRaster | null = definition.raster;
        if (width === 0 || height === 0 || raster === null) {
            return null;
        }
        const viewBox: string | undefined = a['viewBox'];
        const contentObject: boolean =
            viewBox === undefined && this.#object(a['patternContentUnits'] ?? 'userSpaceOnUse');
        if (contentObject && (context.source.width <= 0 || context.source.height <= 0)) {
            return null;
        }
        const values: readonly number[] =
            viewBox === undefined ? [] : DesignSvgNumbers.list(viewBox, 4);
        const contentWidth: number = values[2] ?? (contentObject ? 1 : context.viewportWidth);
        const contentHeight: number = values[3] ?? (contentObject ? 1 : context.viewportHeight);
        const content: DesignSvgMatrix =
            viewBox === undefined
                ? {
                      a:
                          (contentObject ? context.source.width : 1) /
                          (object ? context.source.width : 1),
                      b: 0,
                      c: 0,
                      d:
                          (contentObject ? context.source.height : 1) /
                          (object ? context.source.height : 1),
                      e: 0,
                      f: 0,
                  }
                : T.viewport(width, height, viewBox, a['preserveAspectRatio']).matrix;
        const image: DesignSvgMatrix | null = this.#image(raster, contentWidth, contentHeight);
        if (image === null) {
            return null;
        }
        const tile: DesignSvgMatrix = T.multiply(content, image);
        this.#completeTile(tile, width, height);
        const units: DesignSvgMatrix = object
            ? {
                  a: context.source.width,
                  b: 0,
                  c: 0,
                  d: context.source.height,
                  e: context.source.x,
                  f: context.source.y,
              }
            : T.identity;
        const placement: DesignSvgMatrix = T.multiply(
            context.matrix,
            T.multiply(
                T.parse(a['patternTransform'] ?? ''),
                T.multiply(
                    units,
                    T.multiply(
                        {
                            ...T.identity,
                            e: DesignSvgNumbers.length(
                                a['x'] ?? '0',
                                object ? 1 : context.viewportWidth,
                            ),
                            f: DesignSvgNumbers.length(
                                a['y'] ?? '0',
                                object ? 1 : context.viewportHeight,
                            ),
                        },
                        tile,
                    ),
                ),
            ),
        );
        const box: DesignSvgPaintContext['target'] = context.target;
        return DesignStyleCodec.paint({
            ...DesignDefaults.paint('#FFFFFF'),
            kind: 'image',
            assetId: raster.asset.id,
            opacity: opacity * raster.opacity,
            framing: {
                ...DesignDefaults.framing(),
                fit: 'tile',
                transform: {
                    a: placement.a / box.width,
                    b: placement.b / box.height,
                    c: placement.c / box.width,
                    d: placement.d / box.height,
                    tx: (placement.e - box.x) / box.width,
                    ty: (placement.f - box.y) / box.height,
                },
            },
        });
    }

    #image(raster: DesignSvgPatternRaster, width: number, height: number): DesignSvgMatrix | null {
        const a: Readonly<Record<string, string>> = {
            ...raster.element.attributes,
            ...raster.style,
        };
        const rawWidth: string = a['width'] ?? 'auto';
        const rawHeight: string = a['height'] ?? 'auto';
        let w: number | null =
            rawWidth === 'auto' ? null : DesignSvgNumbers.length(rawWidth, width);
        let h: number | null =
            rawHeight === 'auto' ? null : DesignSvgNumbers.length(rawHeight, height);
        if (w === null && h === null) {
            w = raster.asset.width;
            h = raster.asset.height;
        } else if (w === null) {
            w = ((h ?? raster.asset.height) * raster.asset.width) / raster.asset.height;
        } else if (h === null) {
            h = (w * raster.asset.height) / raster.asset.width;
        }
        if (w === null || h === null || w < 0 || h < 0) {
            throw new DesignSvgInputError('SVG pattern image dimensions must be nonnegative.');
        }
        if (w === 0 || h === 0) {
            return null;
        }
        const viewport: DesignSvgMatrix = T.viewport(
            w,
            h,
            `0 0 ${raster.asset.width} ${raster.asset.height}`,
            (a['preserveAspectRatio'] ?? 'xMidYMid meet').replace(/^defer\s+/u, ''),
        ).matrix;
        // A separate image viewport can clip a larger raster before the tile; do not discard it.
        if (
            viewport.e < -1e-8 ||
            viewport.f < -1e-8 ||
            viewport.a * raster.asset.width > w + 1e-8 ||
            viewport.d * raster.asset.height > h + 1e-8
        ) {
            throw new DesignSvgInputError(
                'SVG raster pattern image cropping requires editable pattern content.',
            );
        }
        return T.multiply(
            DesignSvgPatternImage.matrix(raster, width, height),
            T.multiply(
                {
                    ...T.identity,
                    e: DesignSvgNumbers.length(a['x'] ?? '0', width),
                    f: DesignSvgNumbers.length(a['y'] ?? '0', height),
                },
                T.multiply(viewport, {
                    ...T.identity,
                    a: raster.asset.width,
                    d: raster.asset.height,
                }),
            ),
        );
    }

    #completeTile(matrix: DesignSvgMatrix, width: number, height: number): void {
        const points: readonly DesignSvgPoint[] = [
            T.point(matrix, 0, 0),
            T.point(matrix, 1, 0),
            T.point(matrix, 0, 1),
            T.point(matrix, 1, 1),
        ];
        const epsilon: number = 1e-7 * Math.max(width, height, 1);
        const close: (a: number, b: number) => boolean = (a: number, b: number): boolean =>
            Math.abs(a - b) <= epsilon;
        const axes: boolean =
            (close(matrix.b, 0) && close(matrix.c, 0)) ||
            (close(matrix.a, 0) && close(matrix.d, 0));
        if (
            !axes ||
            !close(Math.min(...points.map((p: DesignSvgPoint): number => p.x)), 0) ||
            !close(Math.max(...points.map((p: DesignSvgPoint): number => p.x)), width) ||
            !close(Math.min(...points.map((p: DesignSvgPoint): number => p.y)), 0) ||
            !close(Math.max(...points.map((p: DesignSvgPoint): number => p.y)), height)
        ) {
            throw new DesignSvgInputError(
                'SVG raster pattern gaps, overlaps or clipped content require editable pattern content.',
            );
        }
    }

    #object(value: string): boolean {
        if (value !== 'objectBoundingBox' && value !== 'userSpaceOnUse') {
            throw new DesignSvgInputError('Unsupported SVG pattern coordinate units.');
        }
        return value === 'objectBoundingBox';
    }

    #definition(id: string, visited: Set<string>): PatternDefinition {
        if (visited.has(id) || visited.size >= 64) {
            throw new DesignSvgInputError('SVG pattern reference is cyclic or too deep.');
        }
        visited.add(id);
        const element: DesignSvgElement | undefined = this.elements.get(id);
        if (element === undefined || element.name !== 'pattern') {
            throw new DesignSvgInputError('Missing SVG pattern ' + id);
        }
        const link: string | undefined =
            element.attributes['href'] ?? element.attributes['xlink:href'];
        const inherited: PatternDefinition | null =
            link === undefined
                ? null
                : this.#definition(DesignSvgReferences.fragment(link), visited);
        const children: readonly DesignSvgElement[] = element.children.filter(
            (child): child is DesignSvgElement =>
                typeof child !== 'string' && !['title', 'desc', 'metadata'].includes(child.name),
        );
        return {
            element,
            attributes: { ...inherited?.attributes, ...element.attributes },
            children: children.length === 0 ? (inherited?.children ?? []) : children,
        };
    }
}
