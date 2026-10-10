// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignText, DesignTextRun } from './DesignTypes.js';

/** Resolved style of a contiguous rich-text range. */
export interface DesignTextSpanStyle {
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
interface Glyph {
    readonly text: string;
    readonly style: DesignTextSpanStyle;
    readonly width: number;
}
interface Span {
    text: string;
    readonly style: DesignTextSpanStyle;
}

/** Portable word wrapping accepts an accurate browser font measurer or a deterministic native fallback. */
export class DesignTextLayout {
    /** Sorted, validated UTF-16 run ranges are traversed once, including supplementary Unicode characters. */
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
        const base: DesignTextSpanStyle = {
            rich: false,
            family: text.family,
            size: text.size,
            weight: text.weight,
            italic: text.italic,
            color,
            underline: false,
        };
        const styles: readonly DesignTextSpanStyle[] = text.runs.map(
            (run: DesignTextRun): DesignTextSpanStyle => ({
                rich: true,
                family: run.family,
                size: run.size,
                weight: run.weight,
                italic: run.italic,
                color: run.color,
                underline: run.underline,
            }),
        );
        const lines: DesignTextLine[] = [];
        let glyphs: Glyph[] = [];
        let used: number = 0;
        let y: number = 0;
        let offset: number = 0;
        let runIndex: number = 0;
        const flush: () => void = (): void => {
            const spans: Span[] = [];
            for (const glyph of glyphs) {
                const last: Span | undefined = spans.at(-1);
                if (last?.style === glyph.style) {
                    last.text += glyph.text;
                } else {
                    spans.push({ text: glyph.text, style: glyph.style });
                }
            }
            const widths: number[] = spans.map((span: Span): number =>
                Math.max(
                    0,
                    measure(span.style, span.text) +
                        Math.max(0, Array.from(span.text).length - 1) * text.letterSpacing,
                ),
            );
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
            const segments: DesignTextSegment[] = spans.map(
                (span: Span, index: number): DesignTextSegment => {
                    const measured: number = widths[index] ?? 0;
                    const segment: DesignTextSegment = {
                        text: span.text,
                        style: span.style,
                        x,
                        width: measured,
                    };
                    x += measured + text.letterSpacing;
                    return segment;
                },
            );
            lines.push({ y, height: lineHeight, width: lineWidth, segments });
            y += lineHeight;
            glyphs = [];
            used = 0;
        };
        for (const character of text.content) {
            while (text.runs[runIndex] !== undefined && (text.runs[runIndex]?.end ?? 0) <= offset) {
                runIndex++;
            }
            const run: DesignTextRun | undefined = text.runs[runIndex];
            const style: DesignTextSpanStyle =
                run !== undefined && run.start <= offset ? (styles[runIndex] ?? base) : base;
            offset += character.length;
            if (character === '\n') {
                flush();
                if (y >= height) {
                    break;
                }
                continue;
            }
            const advance: number = Math.max(0, measure(style, character) + text.letterSpacing);
            while (glyphs.length > 0 && used + advance > width) {
                const breakAt: number = glyphs.findLastIndex((glyph: Glyph): boolean =>
                    /\s/u.test(glyph.text),
                );
                if (breakAt >= 0 && breakAt < glyphs.length - 1) {
                    const remainder: Glyph[] = glyphs.slice(breakAt + 1);
                    glyphs = glyphs.slice(0, breakAt);
                    flush();
                    glyphs = remainder;
                    used = remainder.reduce(
                        (sum: number, glyph: Glyph): number => sum + glyph.width,
                        0,
                    );
                } else {
                    flush();
                }
                if (y >= height) {
                    break;
                }
            }
            if (y >= height) {
                break;
            }
            glyphs.push({ text: character, style, width: advance });
            used += advance;
        }
        if (y < height) {
            flush();
        }
        return lines;
    }
    /** Native fallback matches the model's portable font-width assumptions; the browser supplies actual metrics. */
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
