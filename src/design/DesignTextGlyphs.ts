// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignFontEngine } from './DesignFontEngine.js';
import type { DesignFontPaintClip, DesignFontPaintGlyph } from './DesignFontRun.js';
import type { DesignTextSegment, DesignTextSpanStyle } from './DesignTextLayout.js';
import type { DesignPathCommand } from './DesignTypes.js';

/** Whole glyphs share a path; only a ligature crossing a paint boundary requires a separate clipped path. */
export interface DesignTextPathPiece {
    readonly path: readonly DesignPathCommand[];
    readonly clip?: DesignFontPaintClip;
}

/** Prepared and ordinary text share physical fallback faces without inheriting another slice's paint. */
export class DesignTextGlyphs {
    /** Source remains local to the prepared run; output contains bounded glyph and paint geometry only. */
    public static *paint(
        segment: DesignTextSegment,
        fonts: DesignFontEngine,
        baseline: number,
        tracking: number,
    ): IterableIterator<DesignFontPaintGlyph> {
        const prepared: DesignTextSegment['prepared'] = segment.prepared;
        if (prepared === undefined) {
            yield* fonts.glyphs(segment.style, segment.text, segment.x, baseline, tracking);
            return;
        }
        const styles: Map<DesignTextSpanStyle, DesignTextSpanStyle> = new Map();
        for (const glyph of prepared.run.paint(
            prepared.start,
            prepared.end,
            prepared.x,
            baseline,
        )) {
            if (glyph.style === undefined) {
                yield glyph;
                continue;
            }
            let style: DesignTextSpanStyle | undefined = styles.get(glyph.style);
            if (style === undefined) {
                style = {
                    ...glyph.style,
                    rich: segment.style.rich,
                    color: segment.style.color,
                    underline: segment.style.underline,
                };
                styles.set(glyph.style, style);
            }
            yield { ...glyph, style };
        }
    }

    /** Every segment retains the existing 10,000-command outline budget, including clipped ligatures. */
    public static *paths(
        segment: DesignTextSegment,
        fonts: DesignFontEngine,
        baseline: number,
        tracking: number,
    ): IterableIterator<DesignTextPathPiece> {
        let path: DesignPathCommand[] = [];
        let count: number = 0;
        for (const glyph of this.paint(segment, fonts, baseline, tracking)) {
            const commands: readonly DesignPathCommand[] = fonts.glyphPath(
                glyph.style ?? segment.style,
                glyph.glyphId,
                glyph.x,
                glyph.y,
            );
            count += commands.length;
            if (count > 10000) {
                throw new Error('Text outline exceeds its vector command budget.');
            }
            if (glyph.clip === undefined) {
                path.push(...commands);
            } else {
                if (path.length > 0) {
                    yield { path };
                }
                path = [];
                yield { path: commands, clip: glyph.clip };
            }
        }
        if (path.length > 0) {
            yield { path };
        }
    }
}
