// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { Font, GlyphRun, GlyphPosition } from 'fontkit';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import { DesignFontRegistry, type DesignResolvedFace } from './DesignFontRegistry.js';

/** One contiguous physical-face run retains contextual shaping rather than shaping individual characters. */
export interface DesignShapedFace extends DesignResolvedFace {
    readonly run: GlyphRun;
}

/** Whole-grapheme fallback preserves joined emoji and leaves primary-face kerning/ligatures unchanged. */
export class DesignFontShaper {
    static readonly #segmenter: Intl.Segmenter = new Intl.Segmenter('und', {
        granularity: 'grapheme',
    });

    /** A covered string keeps its original one-run path; missing characters split only at grapheme boundaries. */
    public static spans(
        registry: DesignFontRegistry,
        style: DesignTextSpanStyle,
        content: string,
        tracking: number,
    ): readonly DesignShapedFace[] {
        if (content.length > 100000) {
            throw new Error('Text exceeds the shaping budget.');
        }
        const primary: DesignResolvedFace = registry.resolve(style);
        if (DesignFontRegistry.covers(primary.face, content)) {
            return [{ ...primary, run: this.#shape(primary.face, content, tracking) }];
        }
        const runs: DesignShapedFace[] = [];
        const cached: Map<string, DesignResolvedFace> = new Map();
        let current: DesignResolvedFace = primary;
        let pieces: string[] = [];
        const finish: () => void = (): void => {
            if (pieces.length > 0) {
                runs.push({
                    ...current,
                    run: this.#shape(current.face, pieces.join(''), tracking),
                });
            }
            pieces = [];
        };
        for (const grapheme of this.#segmenter.segment(content)) {
            let resolved: DesignResolvedFace | undefined = cached.get(grapheme.segment);
            if (resolved === undefined) {
                resolved = DesignFontRegistry.covers(primary.face, grapheme.segment)
                    ? primary
                    : (registry.fallback(style, grapheme.segment) ?? primary);
                if (cached.size < 256) {
                    cached.set(grapheme.segment, resolved);
                }
            }
            if (resolved.face !== current.face) {
                finish();
                current = resolved;
            }
            pieces.push(grapheme.segment);
        }
        finish();
        return runs;
    }

    static #shape(face: Font, content: string, tracking: number): GlyphRun {
        const run: GlyphRun = face.layout(
            content,
            tracking === 0 ? {} : { liga: false, clig: false },
        );
        if (
            run.glyphs.length > 100000 ||
            run.glyphs.length !== run.positions.length ||
            run.positions.some(
                (position: GlyphPosition): boolean =>
                    ![
                        position.xAdvance,
                        position.yAdvance,
                        position.xOffset,
                        position.yOffset,
                    ].every(Number.isFinite),
            )
        ) {
            throw new Error('Font returned invalid or oversized shaping data.');
        }
        return run;
    }
}
