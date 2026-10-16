// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignText } from './DesignTypes.js';
import type { DesignTextRunFactory } from './DesignTextShaping.js';
import type { DesignSize, DesignTextMeasurer } from './DesignLayoutTypes.js';
import {
    DesignTextLayout,
    type DesignTextLine,
    type DesignTextSpanStyle,
} from './DesignTextLayout.js';

/** Intrinsic dimensions use the same rich spans, wrapping, tracking and line heights as rendered text. */
export class DesignShapedTextMetrics implements DesignTextMeasurer {
    /** The platform supplies complete font advances without introducing DOM or filesystem dependencies. */
    public constructor(
        public readonly span: (style: DesignTextSpanStyle, content: string) => number,
        public readonly prepare: DesignTextRunFactory | null = null,
    ) {}

    /** Measures all lines, including blank lines and rich spans larger than the base type size. */
    public measure(text: DesignText, maximumWidth: number): DesignSize {
        const cache: Map<DesignTextSpanStyle, Map<string, number>> = new Map();
        let cached: number = 0;
        const lines: readonly DesignTextLine[] = DesignTextLayout.lines(
            text,
            '#000000',
            Math.max(1, maximumWidth),
            Infinity,
            (style: DesignTextSpanStyle, content: string): number => {
                const entries: Map<string, number> | undefined = cache.get(style);
                const previous: number | undefined = entries?.get(content);
                if (previous !== undefined) {
                    return previous;
                }
                const width: number = this.span(style, content);
                if (!Number.isFinite(width) || width < 0) {
                    throw new Error('Font returned an invalid text advance.');
                }
                if (cached < 512) {
                    const values: Map<string, number> = entries ?? new Map<string, number>();
                    values.set(content, width);
                    cache.set(style, values);
                    cached++;
                }
                return width;
            },
            this.prepare,
        );
        let width: number = 0;
        let height: number = 0;
        for (const line of lines) {
            width = Math.max(width, line.width);
            height = Math.max(height, line.y + line.height);
        }
        return { width: Math.max(0.01, width), height: Math.max(0.01, height) };
    }
}
