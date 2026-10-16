// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { Glyph, GlyphPosition } from 'fontkit';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import type { DesignShapedFace } from './DesignFontShaper.js';
import type { DesignShapedGlyph } from './DesignHarfBuzz.js';
import type { DesignFontGlyph, DesignGlyphBounds } from './DesignFontGlyphTypes.js';
import { DesignFontGlyphGeometry } from './DesignFontGlyphGeometry.js';

/** Prepared and ordinary runs share exact glyph placement and bounded pre-outline window rejection. */
export class DesignFontPlacement {
    /** Consumes already-shaped faces without calling the shaper again or allocating off-window outlines. */
    public static *glyphs(
        spans: readonly DesignShapedFace[],
        style: DesignTextSpanStyle,
        x: number,
        baseline: number,
        tracking: number,
        window: DesignGlyphBounds | null,
    ): IterableIterator<DesignFontGlyph> {
        let penX: number = x;
        let penY: number = baseline;
        let runOffset: number = 0;
        for (const span of spans) {
            const scale: number = style.size / span.face.unitsPerEm;
            for (let index: number = 0; index < span.glyphs.length; index++) {
                const shaped: DesignShapedGlyph | undefined = span.glyphs[index];
                if (shaped === undefined) {
                    throw new Error('Font returned mismatched glyph positions.');
                }
                const glyph: Glyph = shaped.glyph;
                const position: GlyphPosition = shaped.position;
                if (glyph.id === 0 && /[^\s\p{Cf}]/u.test(shaped.source)) {
                    throw new Error(
                        'Font does not contain a requested character. Supply its matching workspace font.',
                    );
                }
                const bounds: DesignGlyphBounds | null = DesignFontGlyphGeometry.bounds(
                    glyph,
                    position,
                    penX,
                    penY,
                    scale,
                );
                if (bounds === null) {
                    if (/[^\s\p{Cf}\p{Mn}]/u.test(shaped.source)) {
                        throw new Error('This glyph has no editable vector outline.');
                    }
                } else if (window === null || DesignFontGlyphGeometry.intersects(bounds, window)) {
                    yield {
                        ...(span.style === style ? {} : { style: span.style }),
                        index: runOffset + index,
                        bounds,
                        glyphId: glyph.id,
                        x: penX + position.xOffset * scale,
                        y: penY - position.yOffset * scale,
                    };
                }
                penX +=
                    position.xAdvance * scale +
                    (shaped.mark || (bounds === null && position.xAdvance === 0) ? 0 : tracking);
                penY -= position.yAdvance * scale;
            }
            runOffset += span.glyphs.length;
        }
    }
}
