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

/** Directional runs own their SVG paragraph base so trailing spaces cannot move to the wrong edge. */
export class DesignSvgText {
    /** Ordinary Latin exports keep one text element; resolved visual runs retain editable logical characters. */
    public static render(
        lines: readonly DesignTextLine[],
        text: DesignText,
        attributes: string,
        clipId: string,
        richFill: boolean,
    ): string {
        const directional: boolean = lines.some((line: DesignTextLine): boolean =>
            line.segments.some(
                (segment: DesignTextSegment): boolean => segment.style.direction !== undefined,
            ),
        );
        const elements: string = lines
            .map((line: DesignTextLine): string =>
                line.segments
                    .map((segment: DesignTextSegment): string => {
                        const x: number =
                            segment.x +
                            (directional && segment.style.direction === 'rtl' ? segment.width : 0);
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

    static #style(segment: DesignTextSegment, richFill: boolean): string {
        const family: string = DesignSvgGeometry.escape(
            JSON.stringify(DesignFontBindings.family(segment.style.family, segment.style.font)) +
                ',"Noto Sans Arabic","Noto Sans Hebrew","Noto Emoji"',
        );
        return `${segment.style.rich && richFill ? `fill="${segment.style.color}"` : ''} font-family="${family}" font-size="${segment.style.size}" font-weight="${segment.style.weight}" font-style="${segment.style.italic ? 'italic' : 'normal'}" text-decoration="${segment.style.underline ? 'underline' : 'none'}"`;
    }
}
