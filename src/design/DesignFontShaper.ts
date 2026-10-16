// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import { DesignFontRegistry, type DesignResolvedFace } from './DesignFontRegistry.js';
import { DesignHarfBuzz, type DesignShapedGlyph } from './DesignHarfBuzz.js';
import { DesignFontShapeBudget } from './DesignFontShapeBudget.js';
import { DesignUnicodeScripts } from './DesignUnicodeScripts.js';

/** One physical face and script retain contextual shaping across complete grapheme clusters. */
export interface DesignShapedFace extends DesignResolvedFace {
    readonly glyphs: readonly DesignShapedGlyph[];
    readonly start: number;
}
interface Grapheme {
    readonly text: string;
    readonly script: string | null;
}

/** Whole-grapheme fallback and script itemization feed the same shaper on the server and browser. */
export class DesignFontShaper {
    static readonly #segmenter: Intl.Segmenter = new Intl.Segmenter('und', {
        granularity: 'grapheme',
    });

    /** Logical source slices remain intact; resolved RTL face/script runs are emitted in visual order. */
    public static spans(
        registry: DesignFontRegistry,
        style: DesignTextSpanStyle,
        content: string,
        tracking: number,
        carets: boolean = false,
    ): readonly DesignShapedFace[] {
        if (content.length > 100000) {
            throw new Error('Text exceeds the shaping budget.');
        }
        const budget: DesignFontShapeBudget = new DesignFontShapeBudget(carets);
        const primary: DesignResolvedFace = registry.resolve(style);
        if (/^\p{ASCII}*$/u.test(content) && DesignFontRegistry.covers(primary.face, content)) {
            return [
                {
                    ...primary,
                    start: 0,
                    glyphs: DesignHarfBuzz.shape(primary, content, 'Latn', tracking, budget),
                },
            ];
        }
        const graphemes: readonly Grapheme[] = Array.from(
            this.#segmenter.segment(content),
            (grapheme: Intl.SegmentData): Grapheme => {
                let script: string | null = null;
                for (const character of grapheme.segment) {
                    const point: number | undefined = character.codePointAt(0);
                    script = point === undefined ? null : DesignUnicodeScripts.script(point);
                    if (script !== null) {
                        break;
                    }
                }
                return { text: grapheme.segment, script };
            },
        );
        const runs: DesignShapedFace[] = [];
        const cached: Map<string, DesignResolvedFace> = new Map();
        let current: DesignResolvedFace = primary;
        let script: string =
            graphemes.find((grapheme: Grapheme): boolean => grapheme.script !== null)?.script ??
            'Zyyy';
        let pieces: string[] = [];
        let start: number = 0;
        let offset: number = 0;
        const finish: () => void = (): void => {
            if (pieces.length > 0) {
                runs.push({
                    ...current,
                    start,
                    glyphs: DesignHarfBuzz.shape(
                        current,
                        pieces.join(''),
                        script,
                        tracking,
                        budget,
                    ),
                });
            }
            pieces = [];
        };
        for (const grapheme of graphemes) {
            let resolved: DesignResolvedFace | undefined = cached.get(grapheme.text);
            if (resolved === undefined) {
                resolved = DesignFontRegistry.covers(primary.face, grapheme.text)
                    ? primary
                    : (registry.fallback(style, grapheme.text) ?? primary);
                if (cached.size < 256) {
                    cached.set(grapheme.text, resolved);
                }
            }
            const next: string = grapheme.script ?? script;
            if (resolved.face !== current.face || next !== script) {
                finish();
                current = resolved;
                script = next;
                start = offset;
            }
            pieces.push(grapheme.text);
            offset += grapheme.text.length;
        }
        finish();
        return style.direction === 'rtl' ? runs.reverse() : runs;
    }
}
