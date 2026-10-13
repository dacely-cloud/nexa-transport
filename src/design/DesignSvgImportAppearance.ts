// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import type { DesignStroke } from './DesignTypes.js';

/** Shared appearance validation prevents an imported element from silently losing authored effects. */
export class DesignSvgImportAppearance {
    public static opacity(source: string | undefined): number {
        return Math.max(0, Math.min(1, DesignSvgNumbers.length(source ?? '1', 1)));
    }
    public static cap(source: string): NonNullable<DesignStroke['cap']> {
        if (source !== 'butt' && source !== 'round' && source !== 'square') {
            throw new Error('Unsupported SVG stroke-linecap.');
        }
        return source;
    }
    public static join(source: string): NonNullable<DesignStroke['join']> {
        if (source !== 'miter' && source !== 'round' && source !== 'bevel') {
            throw new Error('Unsupported SVG stroke-linejoin.');
        }
        return source;
    }
    public static validate(style: Readonly<Record<string, string>>, root: boolean = false): void {
        if (
            !root &&
            (style['transform-origin'] !== undefined || style['transform-box'] !== undefined)
        ) {
            throw new Error(
                'SVG descendant transform origins require native reference-box conversion.',
            );
        }
        for (const property of ['filter']) {
            if (style[property] !== undefined && style[property] !== 'none') {
                throw new Error('SVG ' + property + ' requires native import conversion.');
            }
        }
        if (
            style['stroke-dashoffset'] !== undefined &&
            DesignSvgNumbers.length(style['stroke-dashoffset'], 1) !== 0
        ) {
            throw new Error('SVG dash offsets require native dash-phase support.');
        }
        if (
            style['vector-effect'] !== undefined &&
            !['none', 'non-scaling-stroke'].includes(style['vector-effect'])
        ) {
            throw new Error('Unsupported SVG vector-effect.');
        }
        if (style['paint-order'] !== undefined && style['paint-order'] !== 'normal') {
            throw new Error('SVG custom paint-order requires separate paint layers.');
        }
        if (style['mix-blend-mode'] !== undefined && style['mix-blend-mode'] !== 'normal') {
            throw new Error('SVG blend modes require native blend support.');
        }
    }
}
