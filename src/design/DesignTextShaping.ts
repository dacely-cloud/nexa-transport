// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignTextFills } from './DesignTextFills.js';
import type {
    DesignFontRun,
    DesignFontRunStyle,
    DesignFontSourceCluster,
} from './DesignFontRun.js';
import type { DesignLogicalTextSpan } from './DesignTextBidi.js';
import type { DesignFontEngine } from './DesignFontEngine.js';
import type { DesignTextSegment, DesignTextSpanStyle } from './DesignTextLayout.js';

/** Platforms resolve only admitted fonts; unsupported system families retain their existing measurement. */
export type DesignTextRunFactory = (
    style: DesignFontRunStyle,
    content: string,
    tracking: number,
) => DesignFontRun | null;

/** A paint slice retains its complete shaping context locally, never as a wire source projection. */
export interface DesignTextPreparedPaint {
    readonly run: DesignFontRun;
    readonly start: number;
    readonly end: number;
    readonly x: number;
    /** Equal adjacent paint draws once; null leaves this source slice's decorations only. */
    readonly paintRange?: DesignFontSourceCluster | null;
}

/** Visual positions are relative to the line's eventual physical alignment. */
export interface DesignTextShapedLine {
    readonly width: number;
    readonly segments: readonly DesignTextSegment[];
}

/** Metric changes split shaping; paint-only changes retain contextual glyphs across logical adjacent spans. */
export class DesignTextShaping {
    /** Compare ranges of one layer; inherited paint remains distinct from an explicit solid override. */
    public static samePaint(a: DesignTextSpanStyle, b: DesignTextSpanStyle): boolean {
        return (
            a.rich === b.rich &&
            (!a.rich || (a.color === b.color && DesignTextFills.same(a.fills, b.fills)))
        );
    }
    /** Unsupported unbound system families retain the platform's existing fallback measurement. */
    public static factory(fonts: DesignFontEngine): DesignTextRunFactory {
        return (
            style: DesignFontRunStyle,
            content: string,
            tracking: number,
        ): DesignFontRun | null =>
            fonts.supports(style) ? fonts.run(style, content, tracking) : null;
    }
    static readonly #graphemes: Intl.Segmenter = new Intl.Segmenter('und', {
        granularity: 'grapheme',
    });

    /** Bidi has already resolved visual order; each group reconstructs logical source before shaping. */
    public static line(
        visual: readonly DesignLogicalTextSpan[],
        tracking: number,
        measure: (style: DesignTextSpanStyle, content: string) => number,
        factory: DesignTextRunFactory | null,
    ): DesignTextShapedLine {
        const segments: DesignTextSegment[] = [];
        let x: number = 0;
        for (let index: number = 0; index < visual.length;) {
            let end: number = index + 1;
            while (
                factory !== null &&
                end < visual.length &&
                this.#adjacent(visual[end - 1], visual[end])
            ) {
                end++;
            }
            const spans: readonly DesignLogicalTextSpan[] = visual.slice(index, end);
            const first: DesignLogicalTextSpan | undefined = spans[0];
            if (first === undefined) {
                throw new Error('Missing visual text span.');
            }
            const logical: readonly DesignLogicalTextSpan[] =
                first.style.direction === 'rtl' ? [...spans].reverse() : spans;
            const origin: number = logical[0]?.start ?? 0;
            const run: DesignFontRun | null =
                (spans.length > 1 || tracking !== 0) && factory !== null
                    ? factory(
                          { ...first.style, direction: first.style.direction ?? 'ltr' },
                          logical.map((span: DesignLogicalTextSpan): string => span.text).join(''),
                          tracking,
                      )
                    : null;
            const prepared: boolean =
                run !== null &&
                spans.every(
                    (span: DesignLogicalTextSpan): boolean =>
                        run.boundary(span.start - origin) &&
                        run.boundary(span.start - origin + span.text.length),
                );
            if (prepared && run !== null) {
                for (const span of spans) {
                    const start: number = span.start - origin;
                    const end: number = start + span.text.length;
                    const interval: ReturnType<DesignFontRun['slice']> = run.slice(start, end);
                    segments.push({
                        text: span.text,
                        style: span.style,
                        x: x + interval.x,
                        width: interval.width,
                        prepared: { run, start, end, x },
                    });
                }
                x += run.width + tracking;
            } else {
                for (const span of spans) {
                    const width: number = Math.max(
                        0,
                        measure(span.style, span.text) +
                            Math.max(0, Array.from(this.#graphemes.segment(span.text)).length - 1) *
                                tracking,
                    );
                    segments.push({ text: span.text, style: span.style, x, width });
                    x += width + tracking;
                }
            }
            index = end;
        }
        if (factory !== null) {
            this.#paint(segments);
        }
        return { width: Math.max(0, x - (segments.length > 0 ? tracking : 0)), segments };
    }

    static #paint(segments: DesignTextSegment[]): void {
        for (let index: number = 0; index < segments.length;) {
            const first: DesignTextSegment | undefined = segments[index];
            const prepared: DesignTextPreparedPaint | undefined = first?.prepared;
            if (first === undefined || prepared === undefined) {
                index++;
                continue;
            }
            let end: number = index + 1;
            while (end < segments.length) {
                const next: DesignTextSegment | undefined = segments[end];
                if (
                    next?.prepared?.run !== prepared.run ||
                    !this.samePaint(first.style, next.style)
                ) {
                    break;
                }
                end++;
            }
            const last: DesignTextPreparedPaint | undefined = segments[end - 1]?.prepared;
            if (end > index + 1 && last !== undefined) {
                const range: DesignFontSourceCluster = {
                    start: Math.min(prepared.start, last.start),
                    end: Math.max(prepared.end, last.end),
                };
                for (let slot: number = index; slot < end; slot++) {
                    const segment: DesignTextSegment | undefined = segments[slot];
                    if (segment?.prepared === undefined) {
                        throw new Error('Missing prepared text paint.');
                    }
                    segments[slot] = {
                        ...segment,
                        prepared: {
                            ...segment.prepared,
                            paintRange: slot === index ? range : null,
                        },
                    };
                }
            }
            index = end;
        }
    }

    static #adjacent(
        before: DesignLogicalTextSpan | undefined,
        after: DesignLogicalTextSpan | undefined,
    ): boolean {
        if (before === undefined || after === undefined) {
            return false;
        }
        const a: DesignTextSpanStyle = before.style;
        const b: DesignTextSpanStyle = after.style;
        const connected: boolean =
            a.direction === 'rtl'
                ? after.start + after.text.length === before.start
                : before.start + before.text.length === after.start;
        return (
            connected &&
            (a.direction ?? 'ltr') === (b.direction ?? 'ltr') &&
            a.family.toLowerCase() === b.family.toLowerCase() &&
            a.size === b.size &&
            a.weight === b.weight &&
            a.italic === b.italic &&
            (a.font?.id ?? null) === (b.font?.id ?? null) &&
            (a.font?.sha256 ?? null) === (b.font?.sha256 ?? null)
        );
    }
}
