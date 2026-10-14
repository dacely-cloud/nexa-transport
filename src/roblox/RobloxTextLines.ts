// SPDX-License-Identifier: Apache-2.0

import type { RobloxTextMetrics, RobloxTextBounds } from './RobloxTextMetrics';

/** One valid UTF-8 insertion position and its kerning-adjusted glyph origin. */
export interface RobloxTextBoundary {
    readonly byte: number;
    readonly x: number;
}
/** Wrapped line retains original byte offsets rather than normalized-string positions. */
export interface RobloxMeasuredTextLine {
    readonly text: string;
    readonly width: number;
    readonly startByte: number;
    readonly endByte: number;
    readonly boundaries: readonly RobloxTextBoundary[];
}
interface Paragraph {
    readonly text: string;
    readonly startByte: number;
}
interface LayoutResult {
    readonly lines: readonly RobloxMeasuredTextLine[];
    readonly width: number;
    readonly count: number;
}

/** Shared font-unit line layout is suitable for text bounds, caret positions and selection geometry. */
export class RobloxTextLineLayout {
    public static layout(
        metrics: RobloxTextMetrics,
        text: string,
        size: number,
        wrapWidth: number | null,
    ): readonly RobloxMeasuredTextLine[] {
        return this.#run(metrics, text, size, wrapWidth, true).lines;
    }
    /** Intrinsic sizing shares wrapping without allocating a boundary object for every glyph. */
    public static measure(
        metrics: RobloxTextMetrics,
        text: string,
        size: number,
        wrapWidth: number | null,
    ): RobloxTextBounds {
        const result: LayoutResult = this.#run(metrics, text, size, wrapWidth, false);
        if (text.length === 0 || size === 0) {
            return { width: 0, height: 0, lines: 0 };
        }
        const scale: number = Math.fround(Math.fround(size) / metrics.unitsPerEm);
        return {
            width: result.width,
            height: Math.fround(Math.fround(metrics.lineHeight * scale) * result.count),
            lines: result.count,
        };
    }
    static #run(
        metrics: RobloxTextMetrics,
        text: string,
        size: number,
        wrapWidth: number | null,
        retain: boolean,
    ): LayoutResult {
        if (
            !Number.isFinite(size) ||
            size < 0 ||
            size > 4096 ||
            (wrapWidth !== null && (!Number.isFinite(wrapWidth) || wrapWidth < 0)) ||
            text.length > 131072 ||
            !text.isWellFormed()
        ) {
            throw new Error('Invalid GUI text measurement dimensions');
        }
        const scale: number = Math.fround(Math.fround(size) / metrics.unitsPerEm);
        const limit: number | null = wrapWidth === null ? null : Math.fround(wrapWidth);
        const lines: RobloxMeasuredTextLine[] = [];
        let width: number = 0;
        let count: number = 0;
        for (const paragraph of this.#paragraphs(text, retain)) {
            const characters: readonly string[] = Array.from(paragraph.text);
            let byte: number = paragraph.startByte;
            let start: number = 0;
            if (characters.length === 0) {
                count += 1;
                if (retain) {
                    lines.push({
                        text: '',
                        width: 0,
                        startByte: byte,
                        endByte: byte,
                        boundaries: [{ byte, x: 0 }],
                    });
                }
            }
            while (start < characters.length) {
                let end: number = start;
                let used: number = 0;
                let breakAt: number = start;
                while (end < characters.length) {
                    const character: string | undefined = characters[end];
                    if (character === undefined) {
                        throw new Error('Missing GUI text character');
                    }
                    const next: number = this.#advance(
                        metrics,
                        used,
                        end > start ? characters[end - 1] : undefined,
                        character,
                        scale,
                    );
                    if (limit !== null && next > limit && end > start) {
                        break;
                    }
                    used = next;
                    end += 1;
                    if (this.#whitespace(character)) {
                        breakAt = end;
                    }
                }
                if (end < characters.length && breakAt > start) {
                    end = breakAt;
                }
                const startByte: number = byte;
                const boundaries: RobloxTextBoundary[] = retain ? [{ byte, x: 0 }] : [];
                used = 0;
                for (let index: number = start; index < end; index++) {
                    const character: string | undefined = characters[index];
                    if (character === undefined) {
                        throw new Error('Missing GUI text character');
                    }
                    if (retain && index > start && scale !== 0) {
                        const previous: string | undefined = characters[index - 1];
                        const boundary: RobloxTextBoundary | undefined =
                            boundaries[boundaries.length - 1];
                        const kern: number | undefined =
                            previous === undefined
                                ? undefined
                                : metrics.kerning[previous + character];
                        if (boundary === undefined || kern === undefined) {
                            throw new Error('GUI text metrics do not cover this text');
                        }
                        boundaries[boundaries.length - 1] = {
                            byte: boundary.byte,
                            x: Math.fround(used + Math.fround(kern * scale)),
                        };
                    }
                    used = this.#advance(
                        metrics,
                        used,
                        index > start ? characters[index - 1] : undefined,
                        character,
                        scale,
                    );
                    if (retain) {
                        byte += this.#bytes(character);
                        boundaries.push({ byte, x: used });
                    }
                }
                width = Math.max(width, used);
                count += 1;
                if (retain) {
                    lines.push({
                        text: characters.slice(start, end).join(''),
                        width: used,
                        startByte,
                        endByte: byte,
                        boundaries,
                    });
                }
                if (count > 32768) {
                    throw new Error('GUI text exceeds the line budget');
                }
                start = end;
            }
            if (count > 32768) {
                throw new Error('GUI text exceeds the line budget');
            }
        }
        return { lines, width, count };
    }

    static #advance(
        metrics: RobloxTextMetrics,
        used: number,
        previous: string | undefined,
        character: string,
        scale: number,
    ): number {
        if (scale === 0) {
            return 0;
        }
        const advance: number | undefined = metrics.advances[character];
        const kern: number | undefined =
            previous === undefined ? 0 : metrics.kerning[previous + character];
        if (advance === undefined || kern === undefined) {
            throw new Error('GUI text metrics do not cover this text');
        }
        return Math.fround(
            Math.fround(used + Math.fround(kern * scale)) + Math.fround(advance * scale),
        );
    }
    static #bytes(character: string): number {
        const code: number | undefined = character.codePointAt(0);
        if (code === undefined) {
            throw new Error('Missing GUI text character');
        }
        return code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
    }
    static #paragraphs(text: string, retain: boolean): readonly Paragraph[] {
        const paragraphs: Paragraph[] = [];
        let start: number = 0;
        let byte: number = 0;
        const encoder: TextEncoder = new TextEncoder();
        for (const match of text.matchAll(/\r\n?|\n/gu)) {
            const paragraph: string = text.slice(start, match.index);
            paragraphs.push({ text: paragraph, startByte: byte });
            if (retain) {
                byte += encoder.encode(paragraph).length + match[0].length;
            }
            start = match.index + match[0].length;
        }
        paragraphs.push({ text: text.slice(start), startByte: byte });
        return paragraphs;
    }
    static #whitespace(character: string): boolean {
        const code: number = character.codePointAt(0) ?? -1;
        return (
            (code >= 9 && code <= 13) ||
            code === 32 ||
            code === 133 ||
            /^[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]$/u.test(character)
        );
    }
}
