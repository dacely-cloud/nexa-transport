// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignFailure, DesignFailureReason } from './DesignFailure.js';
import type { DesignSvgLayerContext } from './DesignSvgImportContext.js';
import type { DesignSvgImportTree } from './DesignSvgImportTree.js';
import type { DesignSvgImportMask } from './DesignSvgImportMask.js';
import type { DesignSvgMatrix } from './DesignSvgTransforms.js';
import type {
    DesignSvgSourceBounds,
    DesignSvgImportedGeometry,
} from './DesignSvgImportGeometry.js';
import type { DesignNode } from './DesignTypes.js';
import { DesignSvgReferences } from './DesignSvgReferences.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgTransforms as T } from './DesignSvgTransforms.js';
import { DesignSvgImportBounds } from './DesignSvgImportBounds.js';
import { DesignSvgImportStyles } from './DesignSvgImportStyles.js';
import type { DesignSvgCss } from './DesignSvgCss.js';
import {
    DesignSvgFilterEffects,
    type DesignSvgFilterEffectsResult,
} from './DesignSvgFilterEffects.js';
import { DesignSvgImportGeometry } from './DesignSvgImportGeometry.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignSvgFilterFrame } from './DesignSvgFilterFrame.js';

/** Filters run before target clipping and opacity; their output region is an editable alpha-mask source. */
export class DesignSvgImportFilters {
    #sequence: number = 0;
    #styles: DesignSvgImportStyles;
    #frames: DesignSvgFilterFrame;
    public constructor(
        public readonly elements: ReadonlyMap<string, DesignSvgElement>,
        css: DesignSvgCss,
        ancestors: ReadonlyMap<DesignSvgElement, readonly DesignSvgElement[]>,
        public readonly tree: DesignSvgImportTree,
        public readonly masks: DesignSvgImportMask,
        public readonly identify: (key: string) => string,
    ) {
        this.#styles = new DesignSvgImportStyles(css, ancestors);
        this.#frames = new DesignSvgFilterFrame(tree, identify);
    }
    public async apply(
        targetId: string,
        source: string,
        context: DesignSvgLayerContext,
    ): Promise<void> {
        if (source.trim().toLowerCase() === 'none') {
            return;
        }
        const definition: DesignSvgElement | undefined = this.elements.get(this.#reference(source));
        if (definition?.name !== 'filter') {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter definition not found.',
            );
        }
        const allowed: ReadonlySet<string> = new Set([
            'id',
            'class',
            'style',
            'filterUnits',
            'primitiveUnits',
            'x',
            'y',
            'width',
            'height',
            'color-interpolation-filters',
            'color',
        ]);
        for (const name of Object.keys(definition.attributes)) {
            if (!allowed.has(name)) {
                throw new DesignFailure(
                    DesignFailureReason.Invalid,
                    'Unsupported SVG filter attribute ' + name + '.',
                );
            }
        }
        const units: string = definition.attributes['filterUnits'] ?? 'objectBoundingBox';
        const primitiveUnits: string = definition.attributes['primitiveUnits'] ?? 'userSpaceOnUse';
        if (
            ![units, primitiveUnits].every((value: string): boolean =>
                ['objectBoundingBox', 'userSpaceOnUse'].includes(value),
            )
        ) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'Unsupported SVG filter coordinate units.',
            );
        }
        const bounds: DesignSvgSourceBounds | null =
            units === 'objectBoundingBox' || primitiveUnits === 'objectBoundingBox'
                ? (context.referenceBox ??
                  (await DesignSvgImportBounds.measure(
                      this.tree,
                      targetId,
                      T.inverse(context.matrix),
                  )))
                : null;
        if (
            (units === 'objectBoundingBox' || primitiveUnits === 'objectBoundingBox') &&
            bounds === null
        ) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter object bounds require native geometry measurement.',
            );
        }
        const primitiveMatrix: DesignSvgMatrix =
            primitiveUnits === 'objectBoundingBox' && bounds !== null
                ? T.multiply(context.matrix, {
                      a: bounds.width,
                      b: 0,
                      c: 0,
                      d: bounds.height,
                      e: bounds.x,
                      f: bounds.y,
                  })
                : context.matrix;
        const effects: DesignSvgFilterEffectsResult = DesignSvgFilterEffects.parse(
            definition,
            this.#styles,
            primitiveMatrix,
        );
        const a: Readonly<Record<string, string>> = definition.attributes;
        const objectUnits: boolean = units === 'objectBoundingBox';
        const referenceWidth: number = objectUnits ? 1 : context.width;
        const referenceHeight: number = objectUnits ? 1 : context.height;
        const x: number = this.#coordinate(a['x'] ?? '-10%', referenceWidth);
        const y: number = this.#coordinate(a['y'] ?? '-10%', referenceHeight);
        const width: number = this.#coordinate(a['width'] ?? '120%', referenceWidth);
        const height: number = this.#coordinate(a['height'] ?? '120%', referenceHeight);
        if (width < 0 || height < 0) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter region dimensions must be nonnegative.',
            );
        }
        const regionMatrix: DesignSvgMatrix =
            objectUnits && bounds !== null
                ? T.multiply(context.matrix, {
                      a: bounds.width,
                      b: 0,
                      c: 0,
                      d: bounds.height,
                      e: bounds.x,
                      f: bounds.y,
                  })
                : context.matrix;
        const region: DesignSvgImportedGeometry | null =
            width === 0 || height === 0
                ? null
                : await DesignSvgImportGeometry.convert(
                      `M${x} ${y}h${width}v${height}h${-width}Z`,
                      regionMatrix,
                  );
        if (effects.graph && region !== null) {
            if (
                Math.min(Math.abs(regionMatrix.a), Math.abs(regionMatrix.b)) > 1e-12 ||
                Math.min(Math.abs(regionMatrix.c), Math.abs(regionMatrix.d)) > 1e-12
            ) {
                throw new DesignFailure(
                    DesignFailureReason.Invalid,
                    'SVG rotated shadow graph regions require native affine effect support.',
                );
            }
            const first: ReturnType<typeof T.point> = T.point(regionMatrix, x, y);
            const second: ReturnType<typeof T.point> = T.point(regionMatrix, x + width, y + height);
            this.#frames.apply(
                targetId,
                {
                    x: Math.min(first.x, second.x),
                    y: Math.min(first.y, second.y),
                    width: Math.abs(second.x - first.x),
                    height: Math.abs(second.y - first.y),
                },
                effects,
            );
        } else {
            this.tree.replace(targetId, (node: DesignNode): DesignNode => ({
                ...node,
                style: { ...node.style, blur: effects.blur, shadows: effects.shadows },
            }));
        }
        const sourceId: string = this.identify('filter-region:' + (++this.#sequence).toString());
        const base: DesignNode = DesignDefaults.node(
            sourceId,
            region === null ? 'group' : 'path',
            'Filter region',
        );
        this.tree.append({
            ...base,
            ...(region?.target ?? {}),
            style: {
                ...base.style,
                fills: region === null ? [] : [DesignDefaults.paint('#FFFFFF')],
                stroke: null,
            },
        });
        if (region !== null) {
            this.tree.recordGeometry(sourceId, region.target);
        }
        this.masks.wrap(targetId, sourceId, 'vector');
    }
    #coordinate(source: string, reference: number): number {
        try {
            return DesignSvgNumbers.length(source, reference);
        } catch {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'Invalid SVG filter region coordinate.',
            );
        }
    }
    #reference(source: string): string {
        try {
            return DesignSvgReferences.paint(source);
        } catch {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filters require a local url(#id).',
            );
        }
    }
}
