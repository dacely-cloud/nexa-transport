// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignText, DesignTextRun } from './DesignTypes.js';
import type { DesignFontBinding } from './DesignFontTypes.js';
import { DesignFontBindings } from './DesignFontBindings.js';

/** Resolved style of a contiguous rich-text range. */
export interface DesignTextSpanStyle {
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
}
/** Measured line positions are shared by the GPU text raster and SVG export. */
export interface DesignTextLine {
    readonly y: number;
    readonly height: number;
    readonly width: number;
    readonly segments: readonly DesignTextSegment[];
}
interface Span {
    readonly text: string;
    readonly style: DesignTextSpanStyle;
}

/** Complete shaped spans determine word wrapping; oversized words break only at Unicode grapheme boundaries. */
export class DesignTextLayout {
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
    ): readonly DesignTextLine[] {
        const base: DesignTextSpanStyle = DesignFontBindings.base(text, color);
        const styles: readonly DesignTextSpanStyle[] = text.runs.map(
            (run: DesignTextRun): DesignTextSpanStyle => DesignFontBindings.run(text, run),
        );
        const lines: DesignTextLine[] = [];
        let spans: readonly Span[] = [];
        let y: number = 0;
        let runIndex: number = 0;
        const measured: (parts: readonly Span[]) => number = (parts: readonly Span[]): number =>
            this.#widths(parts, text.letterSpacing, measure).reduce(
                (sum: number, advance: number): number => sum + advance,
                0,
            ) +
            Math.max(0, parts.length - 1) * text.letterSpacing;
        const fits: (parts: readonly Span[]) => boolean = (parts: readonly Span[]): boolean =>
            measured(parts) <= width + 0.001;
        const flush: () => void = (): void => {
            const widths: readonly number[] = this.#widths(spans, text.letterSpacing, measure);
            const lineWidth: number =
                widths.reduce((sum: number, value: number): number => sum + value, 0) +
                Math.max(0, spans.length - 1) * text.letterSpacing;
            const lineHeight: number =
                Math.max(text.size, ...spans.map((span: Span): number => span.style.size)) *
                text.lineHeight;
            let x: number =
                text.align === 'center'
                    ? (width - lineWidth) / 2
                    : text.align === 'end'
                      ? width - lineWidth
                      : 0;
            const segments: readonly DesignTextSegment[] = spans.map(
                (span: Span, index: number): DesignTextSegment => {
                    const advance: number = widths[index] ?? 0;
                    const segment: DesignTextSegment = {
                        text: span.text,
                        style: span.style,
                        x,
                        width: advance,
                    };
                    x += advance + text.letterSpacing;
                    return segment;
                },
            );
            lines.push({ y, height: lineHeight, width: Math.max(0, lineWidth), segments });
            y += lineHeight;
            spans = [];
        };
        if (
            height > 0 &&
            (height === Infinity || text.content.length <= 4096) &&
            !/[\r\n]/u.test(text.content)
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
                    complete.push({ text: text.content.slice(offset, run.start), style: base });
                }
                complete.push({ text: text.content.slice(run.start, run.end), style });
                offset = run.end;
            }
            if (offset < text.content.length) {
                complete.push({ text: text.content.slice(offset), style: base });
            }
            if (fits(complete)) {
                spans = complete;
                flush();
                return lines;
            }
        }
        for (const token of text.content.matchAll(/\r\n|[\r\n]|[^\S\r\n]+|[^\s]+/gu)) {
            if (y >= height) {
                break;
            }
            const content: string = token[0];
            if (content === '\n' || content === '\r' || content === '\r\n') {
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
                result[result.length - 1] = { style: last.style, text: last.text + span.text };
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

    static #widths(
        spans: readonly Span[],
        tracking: number,
        measure: (style: DesignTextSpanStyle, content: string) => number,
    ): readonly number[] {
        return spans.map((span: Span): number =>
            Math.max(
                0,
                measure(span.style, span.text) +
                    Math.max(0, Array.from(this.#graphemes.segment(span.text)).length - 1) *
                        tracking,
            ),
        );
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
