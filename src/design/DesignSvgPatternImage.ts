// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignAsset } from './DesignAssetTypes.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgImageAssets } from './DesignSvgImageAssets.js';
import { DesignSvgImportAppearance as Appearance } from './DesignSvgImportAppearance.js';
import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgReferences } from './DesignSvgReferences.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import type { DesignSvgElement } from './DesignSvgXml.js';

/** Local wrappers retain authored coordinate strings until the pattern's object bounds are known. */
interface RasterStep {
    readonly transform: string;
    readonly x: string;
    readonly y: string;
}

/** Original immutable pixels and their editable local placement remain separate from the tile transform. */
export interface DesignSvgPatternRaster {
    readonly asset: DesignAsset;
    readonly element: DesignSvgElement;
    readonly style: Readonly<Record<string, string>>;
    readonly steps: readonly RasterStep[];
    readonly opacity: number;
}

/** Resolves one raster through local image/use/group wrappers without drawing or fetching SVG markup. */
export class DesignSvgPatternImage {
    public constructor(
        public readonly elements: ReadonlyMap<string, DesignSvgElement>,
        public readonly css: DesignSvgCss,
        public readonly assets: DesignSvgImageAssets,
    ) {}

    public async prepare(
        children: readonly DesignSvgElement[],
        style: Readonly<Record<string, string>>,
        ancestors: readonly DesignSvgElement[],
    ): Promise<DesignSvgPatternRaster | null> {
        const child: DesignSvgElement | undefined = this.#child(children);
        return child === undefined
            ? null
            : this.#visit(
                  child,
                  style,
                  ancestors,
                  [],
                  Appearance.opacity(style['opacity']),
                  new Set(),
              );
    }

    /** Content offsets resolve against their SVG viewport, rather than against intrinsic bitmap pixels. */
    public static matrix(
        raster: DesignSvgPatternRaster,
        width: number,
        height: number,
    ): DesignSvgMatrix {
        let matrix: DesignSvgMatrix = T.identity;
        for (const step of raster.steps) {
            matrix = T.multiply(
                matrix,
                T.multiply(T.parse(step.transform), {
                    ...T.identity,
                    e: DesignSvgNumbers.length(step.x, width),
                    f: DesignSvgNumbers.length(step.y, height),
                }),
            );
        }
        return matrix;
    }

    async #visit(
        element: DesignSvgElement,
        inherited: Readonly<Record<string, string>>,
        ancestors: readonly DesignSvgElement[],
        steps: readonly RasterStep[],
        opacity: number,
        references: ReadonlySet<string>,
    ): Promise<DesignSvgPatternRaster | null> {
        if (steps.length >= 64) {
            throw new DesignSvgInputError('SVG raster pattern content is too deep.');
        }
        const style: Readonly<Record<string, string>> = this.css.resolve(
            element,
            ancestors,
            inherited,
        );
        if (style['display'] === 'none') {
            return null;
        }
        Appearance.validate(style);
        for (const key of ['clip-path', 'mask', 'filter']) {
            if (style[key] !== undefined && style[key] !== 'none') {
                throw new DesignSvgInputError(
                    'SVG raster pattern effects require editable pattern content.',
                );
            }
        }
        if ((style['mix-blend-mode'] ?? 'normal') !== 'normal') {
            throw new DesignSvgInputError(
                'SVG raster pattern blending requires editable pattern content.',
            );
        }
        const next: readonly RasterStep[] = [
            ...steps,
            {
                transform: style['transform'] ?? element.attributes['transform'] ?? '',
                x: element.name === 'use' ? (style['x'] ?? element.attributes['x'] ?? '0') : '0',
                y: element.name === 'use' ? (style['y'] ?? element.attributes['y'] ?? '0') : '0',
            },
        ];
        const alpha: number = opacity * Appearance.opacity(style['opacity']);
        if (element.name === 'use') {
            const id: string = DesignSvgReferences.fragment(
                element.attributes['href'] ?? element.attributes['xlink:href'] ?? '',
            );
            if (references.has(id) || references.size >= 32) {
                throw new DesignSvgInputError(
                    'SVG raster pattern use reference is cyclic or too deep.',
                );
            }
            const target: DesignSvgElement | undefined = this.elements.get(id);
            if (target === undefined) {
                throw new DesignSvgInputError('SVG raster pattern use element not found: ' + id);
            }
            return this.#visit(target, style, [], next, alpha, new Set([...references, id]));
        }
        const children: readonly DesignSvgElement[] = element.children.filter(
            (child): child is DesignSvgElement => typeof child !== 'string',
        );
        const child: DesignSvgElement | undefined = this.#child(children);
        if (element.name === 'g') {
            return child === undefined
                ? null
                : this.#visit(child, style, [...ancestors, element], next, alpha, references);
        }
        if (element.name !== 'image' || child !== undefined) {
            throw new DesignSvgInputError(
                'SVG pattern artwork requires editable pattern content; this importer currently supports raster image tiles.',
            );
        }
        if (['hidden', 'collapse'].includes(style['visibility'] ?? 'visible') || alpha === 0) {
            return null;
        }
        return {
            asset: await this.assets.admit(
                element.attributes['href'] ?? element.attributes['xlink:href'] ?? '',
                'SVG pattern image',
            ),
            element,
            style,
            steps: next,
            opacity: alpha,
        };
    }

    #child(children: readonly DesignSvgElement[]): DesignSvgElement | undefined {
        const content: readonly DesignSvgElement[] = children.filter(
            (child: DesignSvgElement): boolean =>
                !['title', 'desc', 'metadata', 'style', 'defs'].includes(child.name),
        );
        if (content.length > 1) {
            throw new DesignSvgInputError(
                'SVG pattern artwork requires editable pattern content; multiple drawing elements cannot be reduced to one image tile.',
            );
        }
        return content[0];
    }
}
