// SPDX-License-Identifier: Apache-2.0

import type { DesignFontEngine, DesignFontMetrics } from './DesignFontEngine.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';

export const DesignSvgBaseline = {
    Auto: 'auto',
    Alphabetic: 'alphabetic',
    Middle: 'middle',
    Central: 'central',
    Before: 'text-before-edge',
    After: 'text-after-edge',
    Hanging: 'hanging',
    Ideographic: 'ideographic',
    Mathematical: 'mathematical',
} as const;
export type DesignSvgBaseline = (typeof DesignSvgBaseline)[keyof typeof DesignSvgBaseline];

/** Horizontal SVG labels use the admitted face's metrics and the browser's synthetic baseline positions. */
export class DesignSvgTextBaseline {
    public static readonly values: readonly string[] = Object.values(DesignSvgBaseline);

    /** Converts the authored baseline's y position into the ordinary alphabetic glyph origin. */
    public static offset(
        value: string,
        style: DesignTextSpanStyle,
        fonts: DesignFontEngine,
    ): number {
        if (value === DesignSvgBaseline.Auto || value === DesignSvgBaseline.Alphabetic) {
            return 0;
        }
        const metrics: DesignFontMetrics = fonts.metrics(style);
        const ascent: number = Math.round(metrics.ascent);
        const descent: number = Math.round(metrics.descent);
        switch (value) {
            case DesignSvgBaseline.Middle:
                return fonts.xHeight(style) / 2;
            case DesignSvgBaseline.Central:
                return (ascent - descent) / 2;
            case DesignSvgBaseline.Before:
                return ascent;
            case DesignSvgBaseline.After:
            case DesignSvgBaseline.Ideographic:
                return -descent;
            case DesignSvgBaseline.Hanging:
                return Math.round(ascent * 0.8 * 64) / 64;
            case DesignSvgBaseline.Mathematical:
                return ascent / 2;
            default:
                throw new Error('Unsupported SVG dominant-baseline.');
        }
    }
}
