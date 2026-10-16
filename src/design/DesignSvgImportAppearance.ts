// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import type { DesignStroke } from './DesignTypes.js';
import { DesignBlendMode, DesignIsolation, type DesignBlendStyle } from './DesignBlendTypes.js';
import { DesignValues } from './DesignValues.js';

/** Shared appearance validation prevents an imported element from silently losing authored effects. */
export class DesignSvgImportAppearance {
    /** Compositing is applied once to the logical element, including split fill/stroke geometry. */
    public static compositing(style: Readonly<Record<string, string>>): DesignBlendStyle {
        return {
            ...(style['mix-blend-mode'] === undefined
                ? {}
                : {
                      blendMode: DesignValues.choice(
                          style['mix-blend-mode'],
                          Object.values(DesignBlendMode),
                          'SVG mix-blend-mode',
                      ),
                  }),
            ...(style['isolation'] === undefined
                ? {}
                : {
                      isolation: DesignValues.choice(
                          style['isolation'],
                          Object.values(DesignIsolation),
                          'SVG isolation',
                      ),
                  }),
        };
    }
    public static opacity(source: string | undefined): number {
        return Math.max(0, Math.min(1, DesignSvgNumbers.length(source ?? '1', 1)));
    }
    public static cap(source: string): NonNullable<DesignStroke['cap']> {
        if (source !== 'butt' && source !== 'round' && source !== 'square') {
            throw new DesignSvgInputError('Unsupported SVG stroke-linecap.');
        }
        return source;
    }
    public static join(source: string): NonNullable<DesignStroke['join']> {
        if (source !== 'miter' && source !== 'round' && source !== 'bevel') {
            throw new DesignSvgInputError('Unsupported SVG stroke-linejoin.');
        }
        return source;
    }
    public static validate(
        style: Readonly<Record<string, string>>,
        root: boolean = false,
        filters: boolean = false,
    ): void {
        if (
            !root &&
            (style['transform-origin'] !== undefined || style['transform-box'] !== undefined)
        ) {
            throw new DesignSvgInputError(
                'SVG descendant transform origins require native reference-box conversion.',
            );
        }
        if (!filters && style['filter'] !== undefined && style['filter'] !== 'none') {
            throw new DesignSvgInputError('SVG filter requires native import conversion.');
        }
        if (
            style['stroke-dashoffset'] !== undefined &&
            DesignSvgNumbers.length(style['stroke-dashoffset'], 1) !== 0
        ) {
            throw new DesignSvgInputError('SVG dash offsets require native dash-phase support.');
        }
        if (
            style['vector-effect'] !== undefined &&
            !['none', 'non-scaling-stroke'].includes(style['vector-effect'])
        ) {
            throw new DesignSvgInputError('Unsupported SVG vector-effect.');
        }
        if (style['paint-order'] !== undefined && style['paint-order'] !== 'normal') {
            throw new DesignSvgInputError('SVG custom paint-order requires separate paint layers.');
        }
        this.compositing(style);
    }
}
