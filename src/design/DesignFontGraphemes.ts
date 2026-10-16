// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Logical offsets retain invisible source graphemes without assigning them typographic advance. */
export interface DesignFontBoundary {
    readonly offset: number;
    readonly advance: number;
}

/** Caret components count visible graphemes while retaining every original UTF-16 boundary. */
export class DesignFontGraphemes {
    static readonly #segmenter: Intl.Segmenter = new Intl.Segmenter('und', {
        granularity: 'grapheme',
    });
    static readonly #ignored: RegExp = /^\p{Default_Ignorable_Code_Point}+$/u;

    /** A base plus variation selector or joiner remains one component; isolated default ignorables add none. */
    public static count(content: string): number {
        let result: number = 0;
        for (const part of this.#segmenter.segment(content)) {
            if (!this.#ignored.test(part.segment)) {
                result++;
            }
        }
        return result;
    }

    /** Repeated advance ordinals keep both sides of an invisible grapheme at the same caret. */
    public static boundaries(content: string): readonly DesignFontBoundary[] {
        const result: DesignFontBoundary[] = [{ offset: 0, advance: 0 }];
        let advance: number = 0;
        for (const part of this.#segmenter.segment(content)) {
            if (!this.#ignored.test(part.segment)) {
                advance++;
            }
            result.push({ offset: part.index + part.segment.length, advance });
        }
        return result;
    }
}
