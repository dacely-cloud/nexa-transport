// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgImportAppearance as Appearance } from './DesignSvgImportAppearance.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import type { DesignSvgImportPaints, DesignSvgPaintContext } from './DesignSvgImportPaints.js';
import type { DesignStroke } from './DesignTypes.js';

/** A stroke keeps its original paint reference until the complete SVG object bounds are known. */
export interface DesignSvgStrokeSource {
    readonly source: string;
    readonly opacity: number;
    readonly color: string;
    readonly width: number;
    readonly dash: readonly number[];
    readonly dashOffset: number;
    readonly cap: NonNullable<DesignStroke['cap']>;
    readonly join: NonNullable<DesignStroke['join']>;
    readonly miterLimit: number;
    readonly nonScaling: boolean;
}

/** Text and vector import use identical stroke defaults, validation and paint resolution. */
export class DesignSvgImportStroke {
    /** The caller resolves lengths against its SVG viewport and computed font-relative units. */
    public static read(
        style: Readonly<Record<string, string>>,
        length: (source: string) => number,
    ): DesignSvgStrokeSource | null {
        const width: number = length(style['stroke-width'] ?? '1');
        if (width < 0) {
            throw new DesignSvgInputError('SVG stroke width must be nonnegative.');
        }
        const raw: string = (style['stroke-dasharray'] ?? 'none').trim();
        const dash: readonly number[] =
            raw === 'none'
                ? []
                : DesignSvgNumbers.list(
                      raw.replace(/[^,\s]+/gu, (value: string): string => length(value).toString()),
                      16,
                  );
        if (dash.some((value: number): boolean => value < 0.01)) {
            throw new DesignSvgInputError('SVG dash lengths must be at least 0.01.');
        }
        const miterLimit: number = DesignSvgNumbers.length(style['stroke-miterlimit'] ?? '4', 1);
        if (miterLimit < 1) {
            throw new DesignSvgInputError('SVG miter limit must be at least one.');
        }
        const source: string = (style['stroke'] ?? 'none').trim();
        return source === 'none'
            ? null
            : {
                  source,
                  width,
                  dash,
                  dashOffset: length(style['stroke-dashoffset'] ?? '0'),
                  opacity: Appearance.opacity(style['stroke-opacity']),
                  color: style['color'] ?? '#000000',
                  cap: Appearance.cap(style['stroke-linecap'] ?? 'butt'),
                  join: Appearance.join(style['stroke-linejoin'] ?? 'miter'),
                  miterLimit,
                  nonScaling: style['vector-effect'] === 'non-scaling-stroke',
              };
    }

    /** Paint coordinates remain tied to the glyph/vector object while only stroke dimensions scale. */
    public static resolve(
        source: DesignSvgStrokeSource | null,
        paints: DesignSvgImportPaints,
        context: DesignSvgPaintContext,
        factor: number,
    ): DesignStroke | null {
        if (source === null) {
            return null;
        }
        const paint: DesignStroke['paint'] | null = paints.resolve(source.source, source.opacity, {
            ...context,
            color: source.color,
        });
        const scale: number = source.nonScaling ? 1 : factor;
        return paint === null || source.width === 0
            ? null
            : {
                  paint,
                  width: source.width * scale,
                  dash: source.dash.map((value: number): number => value * scale),
                  ...(source.dashOffset === 0 ? {} : { dashOffset: source.dashOffset * scale }),
                  cap: source.cap,
                  join: source.join,
                  miterLimit: source.miterLimit,
              };
    }
}
