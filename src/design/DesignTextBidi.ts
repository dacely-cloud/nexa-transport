// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignBidiParagraph } from './DesignBidiParagraph.js';
import { DesignTextDirection, type DesignResolvedTextDirection } from './DesignTextDirection.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import { DesignTextBreaks } from './DesignTextBreaks.js';

/** UTF-16 source positions survive wrapping and rich styling without reversing authored characters. */
export interface DesignLogicalTextSpan {
    readonly start: number;
    readonly text: string;
    readonly style: DesignTextSpanStyle;
}
interface Paragraph {
    readonly start: number;
    readonly end: number;
    readonly bidi: DesignBidiParagraph;
}

/** Paragraph context is retained across soft wraps; only the visible style slices are reordered. */
export class DesignTextBidi {
    /** Canvas receives an explicit directional override for an already resolved visual run. */
    public static paint(
        content: string,
        direction: DesignResolvedTextDirection | undefined,
    ): string {
        return direction === undefined
            ? content
            : (direction === DesignTextDirection.Rtl ? '\u202e' : '\u202d') + content + '\u202c';
    }
    readonly #paragraphs: readonly Paragraph[];
    readonly #styles: WeakMap<
        DesignTextSpanStyle,
        ReadonlyMap<DesignResolvedTextDirection, DesignTextSpanStyle>
    > = new WeakMap();

    public constructor(content: string, direction: DesignTextDirection = DesignTextDirection.Auto) {
        if (content.length > 100000) {
            throw new Error('Text exceeds the bidirectional layout budget.');
        }
        if (direction !== DesignTextDirection.Rtl && /^\p{ASCII}*$/u.test(content)) {
            this.#paragraphs = [];
            return;
        }
        const paragraphs: Paragraph[] = [];
        let start: number = 0;
        for (const separator of DesignTextBreaks.paragraphs(content).matchAll(
            /\r\n|[\r\n\u0085\u2029]/gu,
        )) {
            paragraphs.push({
                start,
                end: separator.index,
                bidi: new DesignBidiParagraph(content.slice(start, separator.index), direction),
            });
            start = separator.index + separator[0].length;
        }
        paragraphs.push({
            start,
            end: content.length,
            bidi: new DesignBidiParagraph(content.slice(start), direction),
        });
        this.#paragraphs = paragraphs;
    }

    /** Characters within each run stay logical for contextual shaping, including joining controls. */
    public visual(spans: readonly DesignLogicalTextSpan[]): readonly DesignLogicalTextSpan[] {
        const first: DesignLogicalTextSpan | undefined = spans[0];
        const last: DesignLogicalTextSpan | undefined = spans.at(-1);
        if (this.#paragraphs.length === 0 || first === undefined || last === undefined) {
            return spans;
        }
        let low: number = 0;
        let high: number = this.#paragraphs.length;
        while (low + 1 < high) {
            const middle: number = Math.floor((low + high) / 2);
            if ((this.#paragraphs[middle]?.start ?? Infinity) <= first.start) {
                low = middle;
            } else {
                high = middle;
            }
        }
        const paragraph: Paragraph | undefined = this.#paragraphs[low];
        const end: number = last.start + last.text.length;
        if (paragraph === undefined || first.start < paragraph.start || end > paragraph.end) {
            throw new Error('A visual line cannot cross paragraph boundaries.');
        }
        const result: DesignLogicalTextSpan[] = [];
        for (const run of paragraph.bidi.runs(
            first.start - paragraph.start,
            end - paragraph.start,
        )) {
            const start: number = paragraph.start + run.start;
            const stop: number = paragraph.start + run.end;
            let left: number = 0;
            let right: number = spans.length;
            while (left < right) {
                const middle: number = Math.floor((left + right) / 2);
                const span: DesignLogicalTextSpan | undefined = spans[middle];
                if (span !== undefined && span.start + span.text.length <= start) {
                    left = middle + 1;
                } else {
                    right = middle;
                }
            }
            const pieces: DesignLogicalTextSpan[] = [];
            for (let index: number = left; index < spans.length; index++) {
                const span: DesignLogicalTextSpan | undefined = spans[index];
                if (span === undefined || span.start >= stop) {
                    break;
                }
                const offset: number = Math.max(start, span.start);
                const text: string = span.text
                    .slice(offset - span.start, stop - span.start)
                    .replace(/\p{Bidi_Control}/gu, '');
                if (text !== '') {
                    pieces.push({
                        start: offset,
                        text,
                        style: this.#style(span.style, run.direction),
                    });
                }
            }
            if (run.direction === DesignTextDirection.Rtl) {
                pieces.reverse();
            }
            result.push(...pieces);
        }
        return result;
    }

    #style(
        source: DesignTextSpanStyle,
        direction: DesignResolvedTextDirection,
    ): DesignTextSpanStyle {
        let styles: ReadonlyMap<DesignResolvedTextDirection, DesignTextSpanStyle> | undefined =
            this.#styles.get(source);
        if (styles === undefined) {
            styles = new Map([
                [DesignTextDirection.Ltr, { ...source, direction: DesignTextDirection.Ltr }],
                [DesignTextDirection.Rtl, { ...source, direction: DesignTextDirection.Rtl }],
            ]);
            this.#styles.set(source, styles);
        }
        const style: DesignTextSpanStyle | undefined = styles.get(direction);
        if (style === undefined) {
            throw new Error('Missing resolved text direction.');
        }
        return style;
    }
}
