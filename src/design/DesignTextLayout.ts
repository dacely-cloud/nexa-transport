// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignText, DesignTextRun } from './DesignTypes.js';
import type { DesignFontBinding } from './DesignFontTypes.js';
import { DesignFontBindings } from './DesignFontBindings.js';
import type { DesignResolvedTextDirection } from './DesignTextDirection.js';
import { DesignTextBidi, type DesignLogicalTextSpan } from './DesignTextBidi.js';
import { DesignTextBreaks } from './DesignTextBreaks.js';
import {
    DesignTextShaping,
    type DesignTextPreparedPaint,
    type DesignTextRunFactory,
    type DesignTextShapedLine,
} from './DesignTextShaping.js';

/** Resolved style of a contiguous rich-text range. */
export interface DesignTextSpanStyle {
    readonly direction?: DesignResolvedTextDirection;
    /** A bound style selects exactly the saved face instead of an available system family. */
    readonly font?: DesignFontBinding | null;
    readonly rich: boolean;
    readonly family: string;
    readonly size: number;
    readonly weight: number;
    readonly italic: boolean;
    readonly color: string;
    readonly underline: boolean;
}
/** One shaped text span, measured as a complete string rather than disconnected characters. */
export interface DesignTextSegment {
    readonly text: string;
    readonly style: DesignTextSpanStyle;
    readonly x: number;
    readonly width: number;
    readonly prepared?: DesignTextPreparedPaint;
}
/** Measured line positions are shared by the GPU text raster and SVG export. */
export interface DesignTextLine {
    readonly y: number;
    readonly height: number;
    readonly width: number;
    readonly segments: readonly DesignTextSegment[];
}
type Span = DesignLogicalTextSpan;

/** Complete shaped spans determine word wrapping; oversized words break only at Unicode grapheme boundaries. */
export class DesignTextLayout {
    /** Centers the em box in its line spacing; canvas, SVG and outlines share this baseline. */
    public static baseline(line: DesignTextLine, lineHeight: number): number {
        const size: number = line.height / lineHeight;
        return line.y + (line.height - size) / 2 + size * 0.82;
    }

    static readonly #graphemes: Intl.Segmenter = new Intl.Segmenter(undefined, {
        granularity: 'grapheme',
    });

    /** Validated UTF-16 rich ranges retain their styles across word wraps and explicit blank lines. */
    public static lines(
        text: DesignText,
        color: string,
        width: number,
        height: number,
        measure: (style: DesignTextSpanStyle, content: string) => number = (
            style: DesignTextSpanStyle,
            content: string,
        ): number => DesignTextLayout.estimate(style, content),
        prepare: DesignTextRunFactory | null = null,
    ): readonly DesignTextLine[] {
        const base: DesignTextSpanStyle = DesignFontBindings.base(text, color);
        const bidi: DesignTextBidi = new DesignTextBidi(text.content, text.direction);
        const tokenSource: string = DesignTextBreaks.paragraphs(text.content);
        const styles: readonly DesignTextSpanStyle[] = text.runs.map(
            (run: DesignTextRun): DesignTextSpanStyle => DesignFontBindings.run(text, run),
        );
        const lines: DesignTextLine[] = [];
        let spans: readonly Span[] = [];
        let y: number = 0;
        let runIndex: number = 0;
        const measured: (parts: readonly Span[]) => number = (parts: readonly Span[]): number => {
            return DesignTextShaping.line(bidi.visual(parts), text.letterSpacing, measure, prepare)
                .width;
        };
        const fits: (parts: readonly Span[]) => boolean = (parts: readonly Span[]): boolean =>
            measured(parts) <= width + 0.001;
        const flush: () => void = (): void => {
            const visual: readonly Span[] = bidi.visual(spans);
            const shaped: DesignTextShapedLine = DesignTextShaping.line(
                visual,
                text.letterSpacing,
                measure,
                prepare,
            );
            const lineWidth: number = shaped.width;
            const lineHeight: number =
                Math.max(text.size, ...spans.map((span: Span): number => span.style.size)) *
                text.lineHeight;
            const x: number =
                text.align === 'center'
                    ? (width - lineWidth) / 2
                    : text.align === 'end'
                      ? width - lineWidth
                      : 0;
            const segments: readonly DesignTextSegment[] = shaped.segments.map(
                (segment: DesignTextSegment): DesignTextSegment => ({
                    ...segment,
                    x: segment.x + x,
                    ...(segment.prepared === undefined
                        ? {}
                        : { prepared: { ...segment.prepared, x: segment.prepared.x + x } }),
                }),
            );
            lines.push({ y, height: lineHeight, width: Math.max(0, lineWidth), segments });
            y += lineHeight;
            spans = [];
        };
        if (
            height > 0 &&
            (height === Infinity || text.content.length <= 4096) &&
            !/[\r\n\u0085\u2028\u2029]/u.test(tokenSource)
        ) {
            const complete: Span[] = [];
            let offset: number = 0;
            for (let index: number = 0; index < text.runs.length; index++) {
                const run: DesignTextRun | undefined = text.runs[index];
                const style: DesignTextSpanStyle | undefined = styles[index];
                if (run === undefined || style === undefined) {
                    break;
                }
                if (run.start > offset) {
                    complete.push({
                        start: offset,
                        text: text.content.slice(offset, run.start),
                        style: base,
                    });
                }
                complete.push({
                    start: run.start,
                    text: text.content.slice(run.start, run.end),
                    style,
                });
                offset = run.end;
            }
            if (offset < text.content.length) {
                complete.push({ start: offset, text: text.content.slice(offset), style: base });
            }
            if (fits(complete)) {
                spans = complete;
                flush();
                return lines;
            }
        }
        for (const token of tokenSource.matchAll(
            /\r\n|[\r\n\u0085\u2028\u2029]|[^\S\r\n\u0085\u2028\u2029]+|[^\s\u0085]+/gu,
        )) {
            if (y >= height) {
                break;
            }
            const content: string = token[0];
            if (/^(?:\r\n|[\r\n\u0085\u2028\u2029])$/u.test(content)) {
                flush();
                continue;
            }
            const parts: Span[] = [];
            let offset: number = token.index;
            const end: number = offset + content.length;
            while (offset < end) {
                while ((text.runs[runIndex]?.end ?? Infinity) <= offset) {
                    runIndex++;
                }
                const run: DesignTextRun | undefined = text.runs[runIndex];
                const active: boolean = run !== undefined && run.start <= offset;
                const next: number = Math.min(
                    end,
                    active ? (run?.end ?? end) : (run?.start ?? end),
                );
                parts.push({
                    start: offset,
                    text: text.content.slice(offset, next),
                    style: active ? (styles[runIndex] ?? base) : base,
                });
                offset = next;
            }
            const candidate: readonly Span[] = this.#append(spans, parts);
            if (/^\s+$/u.test(content) || fits(candidate)) {
                spans = candidate;
                continue;
            }
            if (spans.length > 0) {
                spans = this.#trim(spans);
                flush();
                if (y >= height) {
                    break;
                }
            }
            if (fits(parts)) {
                spans = parts;
                continue;
            }
            const boundaries: number[] = Array.from(
                this.#graphemes.segment(content),
                (segment: Intl.SegmentData): number => segment.index,
            );
            boundaries.push(content.length);
            let first: number = 0;
            while (first < boundaries.length - 1 && y < height) {
                const start: number = boundaries[first] ?? 0;
                let low: number = 1;
                let high: number = 1;
                const remaining: number = boundaries.length - 1 - first;
                const prefix: (count: number) => readonly Span[] = (
                    count: number,
                ): readonly Span[] =>
                    this.#slice(parts, start, boundaries[first + count] ?? content.length);
                while (high < remaining && fits(prefix(high))) {
                    low = high;
                    high = Math.min(remaining, high * 2);
                }
                if (fits(prefix(high))) {
                    low = high;
                } else {
                    while (low + 1 < high) {
                        const middle: number = Math.floor((low + high) / 2);
                        if (fits(prefix(middle))) {
                            low = middle;
                        } else {
                            high = middle;
                        }
                    }
                }
                spans = prefix(low);
                first += low;
                if (first < boundaries.length - 1) {
                    flush();
                }
            }
        }
        if (y < height) {
            flush();
        }
        return lines;
    }

    static #append(before: readonly Span[], after: readonly Span[]): readonly Span[] {
        const result: Span[] = [...before];
        for (const span of after) {
            const last: Span | undefined = result.at(-1);
            if (last?.style === span.style) {
                result[result.length - 1] = {
                    start: last.start,
                    style: last.style,
                    text: last.text + span.text,
                };
            } else {
                result.push(span);
            }
        }
        return result;
    }

    static #slice(spans: readonly Span[], start: number, end: number): readonly Span[] {
        const result: Span[] = [];
        let offset: number = 0;
        for (const span of spans) {
            const stop: number = offset + span.text.length;
            if (stop > start && offset < end) {
                result.push({
                    start: span.start + Math.max(0, start - offset),
                    style: span.style,
                    text: span.text.slice(Math.max(0, start - offset), end - offset),
                });
            }
            offset = stop;
            if (offset >= end) {
                break;
            }
        }
        return result;
    }

    static #trim(spans: readonly Span[]): readonly Span[] {
        const result: Span[] = [...spans];
        while (result.length > 0) {
            const last: Span | undefined = result.at(-1);
            if (last === undefined) {
                break;
            }
            const text: string = last.text.trimEnd();
            if (text.length > 0) {
                result[result.length - 1] = { ...last, text };
                break;
            }
            result.pop();
        }
        return result;
    }

    /** Explicit estimate for fonts without a loaded platform face. */
    public static estimate(style: DesignTextSpanStyle, content: string): number {
        let width: number = 0;
        for (const character of content) {
            width +=
                style.size *
                (/\s/u.test(character)
                    ? 0.32
                    : /[il.,'!|]/u.test(character)
                      ? 0.28
                      : /[MW@]/u.test(character)
                        ? 0.9
                        : 0.56);
        }
        return width;
    }
}
