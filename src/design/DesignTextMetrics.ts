// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignText } from './DesignTypes.js';
import type { DesignSize, DesignTextMeasurer } from './DesignLayoutTypes.js';

/** Portable deterministic fallback; browser or native font engines can supply accurate metrics. */
export class DesignTextMetrics implements DesignTextMeasurer {
    /** Estimates multiline text with word wrapping and tracking without depending on a browser. */
    public measure(text: DesignText, maximumWidth: number): DesignSize {
        const width: number = Math.max(1, maximumWidth);
        let widest: number = 0;
        let lines: number = 0;
        for (const paragraph of text.content.split('\n')) {
            let current: number = 0;
            for (const part of paragraph.split(/(\s+)/u)) {
                const length: number = Array.from(part).reduce(
                    (sum: number, character: string): number =>
                        sum +
                        text.size *
                            (/\s/u.test(character)
                                ? 0.32
                                : /[il.,'!|]/u.test(character)
                                  ? 0.28
                                  : /[MW@]/u.test(character)
                                    ? 0.9
                                    : 0.56) +
                        text.letterSpacing,
                    0,
                );
                if (current > 0 && current + length > width && part.trim() !== '') {
                    widest = Math.max(widest, current);
                    lines++;
                    current = 0;
                }
                current += Math.max(0, length);
                if (current > width) {
                    const wrapped: number = Math.ceil(current / width) - 1;
                    widest = Math.max(widest, width);
                    lines += wrapped;
                    current -= wrapped * width;
                }
            }
            widest = Math.max(widest, current);
            lines++;
        }
        return {
            width: Math.max(0.01, widest),
            height: Math.max(1, lines) * text.size * text.lineHeight,
        };
    }
}
