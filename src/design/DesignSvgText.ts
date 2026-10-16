// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignText } from './DesignTypes.js';
import {
    DesignTextLayout,
    type DesignTextLine,
    type DesignTextSegment,
} from './DesignTextLayout.js';
import { DesignFontBindings } from './DesignFontBindings.js';
import { DesignSvgGeometry } from './DesignSvgGeometry.js';
import type { DesignSvgTextPaint, DesignSvgTextSlice } from './DesignSvgTextPaint.js';

/** Directional runs own their SVG paragraph base so trailing spaces cannot move to the wrong edge. */
export class DesignSvgText {
    /** Ordinary Latin exports keep one text element; resolved visual runs retain editable logical characters. */
    public static render(
        lines: readonly DesignTextLine[],
        text: DesignText,
        attributes: string,
        clipId: string,
        richFill: boolean,
        paint: DesignSvgTextPaint | null = null,
    ): string {
        const prepared: boolean = lines.some((line: DesignTextLine): boolean =>
            line.segments.some(
                (segment: DesignTextSegment): boolean => segment.prepared !== undefined,
            ),
        );
        const directional: boolean =
            prepared ||
            lines.some((line: DesignTextLine): boolean =>
                line.segments.some(
                    (segment: DesignTextSegment): boolean => segment.style.direction !== undefined,
                ),
            );
        const elements: string = lines
            .map((line: DesignTextLine): string =>
                line.segments.some(
                    (segment: DesignTextSegment): boolean => segment.prepared !== undefined,
                )
                    ? this.#prepared(line, text, richFill, paint)
                    : line.segments
                          .map((segment: DesignTextSegment): string => {
                              const x: number =
                                  segment.x +
                                  (directional && segment.style.direction === 'rtl'
                                      ? segment.width
                                      : 0);
                              const coordinates: string = `x="${x}" y="${DesignTextLayout.baseline(line, text.lineHeight)}"`;
                              const style: string = this.#style(segment, richFill);
                              const content: string = DesignSvgGeometry.escape(segment.text);
                              return directional
                                  ? `<text xml:space="preserve" letter-spacing="${text.letterSpacing}" direction="${segment.style.direction ?? 'ltr'}" unicode-bidi="bidi-override" text-anchor="start" ${coordinates} ${style}>${content}</text>`
                                  : `<tspan ${coordinates} ${style}>${content}</tspan>`;
                          })
                          .join(''),
            )
            .join('');
        return directional
            ? `<g clip-path="url(#${clipId})" ${attributes}>${elements}</g>`
            : `<g clip-path="url(#${clipId})"><text xml:space="preserve" letter-spacing="${text.letterSpacing}" ${attributes}>${elements}</text></g>`;
    }

    static #prepared(
        line: DesignTextLine,
        text: DesignText,
        richFill: boolean,
        paint: DesignSvgTextPaint | null,
    ): string {
        const elements: string[] = [];
        for (let index: number = 0; index < line.segments.length;) {
            const segment: DesignTextSegment | undefined = line.segments[index];
            if (segment === undefined) {
                throw new Error('Missing editable text span.');
            }
            const prepared: DesignTextSegment['prepared'] = segment.prepared;
            const spans: DesignTextSegment[] = [segment];
            index++;
            if (prepared !== undefined) {
                while (
                    index < line.segments.length &&
                    line.segments[index]?.prepared?.run === prepared.run
                ) {
                    const next: DesignTextSegment | undefined = line.segments[index++];
                    if (next !== undefined) {
                        spans.push(next);
                    }
                }
                spans.sort(
                    (a: DesignTextSegment, b: DesignTextSegment): number =>
                        (a.prepared?.start ?? 0) - (b.prepared?.start ?? 0),
                );
            }
            const rtl: boolean = segment.style.direction === 'rtl';
            const x: number =
                prepared === undefined
                    ? segment.x + (rtl ? segment.width : 0)
                    : prepared.x + (rtl ? prepared.run.width : 0);
            const slices: readonly DesignSvgTextSlice[] =
                richFill && prepared !== undefined && paint !== null
                    ? paint.slices(spans, prepared.run)
                    : spans.map((span: DesignTextSegment): DesignSvgTextSlice => ({
                          text: span.text,
                          style: span.style,
                          fill: null,
                      }));
            const content: string = slices
                .map(
                    (slice: DesignSvgTextSlice): string =>
                        `<tspan ${slice.fill !== null ? `fill="${slice.fill}"` : slice.style.rich && richFill ? `fill="${slice.style.color}"` : ''}>${DesignSvgGeometry.escape(slice.text)}</tspan>`,
                )
                .join('');
            elements.push(
                `<text xml:space="preserve" letter-spacing="${text.letterSpacing}" direction="${rtl ? 'rtl' : 'ltr'}" unicode-bidi="bidi-override" text-anchor="start" x="${x}" y="${DesignTextLayout.baseline(line, text.lineHeight)}" ${this.#style(segment, false, false)}>${content}</text>`,
            );
            if (richFill) {
                for (const span of spans) {
                    if (span.style.underline && span.width > 0) {
                        elements.push(
                            `<rect x="${span.x}" y="${DesignTextLayout.baseline(line, text.lineHeight) + Math.max(1, span.style.size / 12)}" width="${span.width}" height="${Math.max(1, span.style.size / 16)}" ${span.style.rich ? `fill="${span.style.color}"` : ''}/>`,
                        );
                    }
                }
            }
        }
        return elements.join('');
    }

    static #style(
        segment: DesignTextSegment,
        richFill: boolean,
        decoration: boolean = true,
    ): string {
        const family: string = DesignSvgGeometry.escape(
            JSON.stringify(DesignFontBindings.family(segment.style.family, segment.style.font)) +
                ',"Noto Sans Arabic","Noto Sans Hebrew","Noto Emoji"',
        );
        return `${segment.style.rich && richFill ? `fill="${segment.style.color}"` : ''} font-family="${family}" font-size="${segment.style.size}" font-weight="${segment.style.weight}" font-style="${segment.style.italic ? 'italic' : 'normal'}"${decoration ? ` text-decoration="${segment.style.underline ? 'underline' : 'none'}"` : ''}`;
    }
}
