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
import {
    DesignSvgPatternPlacement,
    type DesignSvgPatternPlacementResult,
} from './DesignSvgPatternPlacement.js';
import type { DesignSvgPatternDefinition as PatternDefinition } from './DesignSvgPatternTypes.js';
import type { DesignSvgPatternSources } from './DesignSvgPatternSources.js';

interface PreparedPattern extends PatternDefinition {
    readonly raster: DesignSvgPatternRaster | null | false;
    readonly style: Readonly<Record<string, string>>;
}

/** Raster cells retain original pixels; richer pattern artwork resolves to linked editable sources. */
export class DesignSvgImportPatterns {
    readonly #prepared: Map<string, PreparedPattern> = new Map();
    readonly #styles: DesignSvgImportStyles;
    readonly #images: DesignSvgPatternImage;

    public constructor(
        public readonly elements: ReadonlyMap<string, DesignSvgElement>,
        css: DesignSvgCss,
        public readonly ancestors: ReadonlyMap<DesignSvgElement, readonly DesignSvgElement[]>,
        assets: DesignSvgImageAssets,
        public readonly sources: DesignSvgPatternSources | null = null,
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
        Appearance.validate(style, false, true);
        const effects: boolean =
            ['clip-path', 'mask', 'filter'].some(
                (key: string): boolean => style[key] !== undefined && style[key] !== 'none',
            ) || (style['mix-blend-mode'] ?? 'normal') !== 'normal';
        if (!['hidden', 'clip'].includes(style['overflow'] ?? 'hidden')) {
            throw new DesignSvgInputError(
                'SVG pattern visible overflow requires repeating neighboring editable sources.',
            );
        }
        const attributes: Readonly<Record<string, string>> = {
            ...definition.attributes,
            ...(style['transform'] === undefined ? {} : { patternTransform: style['transform'] }),
        };
        const empty: boolean =
            DesignSvgNumbers.length(attributes['width'] ?? '0', 1) === 0 ||
            DesignSvgNumbers.length(attributes['height'] ?? '0', 1) === 0;
        const raster: DesignSvgPatternRaster | null | false = empty
            ? null
            : effects
              ? false
              : await this.#images.prepare(definition.children, style, [
                    ...(this.ancestors.get(definition.element) ?? []),
                    definition.element,
                ]);
        this.#prepared.set(id, { ...definition, attributes, raster, style });
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
        if (definition.raster === false) {
            if (this.sources === null) {
                throw new DesignSvgInputError(
                    'SVG pattern artwork requires editable pattern content.',
                );
            }
            return this.sources.resolve(id, definition, definition.style, opacity, context);
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
                : T.multiply(
                      {
                          ...T.identity,
                          a: object ? 1 / context.source.width : 1,
                          d: object ? 1 / context.source.height : 1,
                      },
                      T.viewport(
                          width * (object ? context.source.width : 1),
                          height * (object ? context.source.height : 1),
                          viewBox,
                          a['preserveAspectRatio'],
                      ).matrix,
                  );
        const image: DesignSvgPatternPlacementResult | null = DesignSvgPatternPlacement.image(
            raster,
            contentWidth,
            contentHeight,
        );
        if (image === null) {
            return null;
        }
        const artwork: DesignSvgMatrix = T.multiply(content, image.matrix);
        const complete: boolean = image.clip === null && this.#completeTile(artwork, width, height);
        const tile: DesignSvgMatrix = complete ? artwork : { ...T.identity, a: width, d: height };
        const cellContent: DesignSvgMatrix = T.multiply(
            { ...T.identity, a: 1 / width, d: 1 / height },
            artwork,
        );
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
                ...(complete
                    ? {}
                    : {
                          tile: {
                              content: {
                                  a: cellContent.a,
                                  b: cellContent.b,
                                  c: cellContent.c,
                                  d: cellContent.d,
                                  tx: cellContent.e,
                                  ty: cellContent.f,
                              },
                              ...(image.clip === null ? {} : { clip: image.clip }),
                          },
                      }),
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

    #completeTile(matrix: DesignSvgMatrix, width: number, height: number): boolean {
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
        return (
            axes &&
            close(Math.min(...points.map((p: DesignSvgPoint): number => p.x)), 0) &&
            close(Math.max(...points.map((p: DesignSvgPoint): number => p.x)), width) &&
            close(Math.min(...points.map((p: DesignSvgPoint): number => p.y)), 0) &&
            close(Math.max(...points.map((p: DesignSvgPoint): number => p.y)), height)
        );
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
