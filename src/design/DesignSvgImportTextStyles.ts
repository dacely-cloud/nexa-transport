// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgCss } from './DesignSvgCss.js';
import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgColors } from './DesignSvgColors.js';
import { DesignFontFamilyCodec } from './DesignFontFamilyCodec.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import { DesignSvgImportAppearance } from './DesignSvgImportAppearance.js';

/** Computed text properties keep inherited relative font sizes from being applied twice. */
export class DesignSvgImportTextStyles {
    #rootSize: number = 16;
    /** Resolves the same inert stylesheet used by shape import. */
    public constructor(public readonly css: DesignSvgCss) {}

    /** Root em units retain their computed SVG document size independently of label size. */
    public get rootSize(): number {
        return this.#rootSize;
    }

    /** Replays the actual import ancestry, including use shadow trees, without loading external CSS. */
    public resolve(
        element: DesignSvgElement,
        ancestors: readonly DesignSvgElement[],
    ): Readonly<Record<string, string>> {
        let parent: Readonly<Record<string, string>> = {};
        let rootSize: number = 16;
        for (let index: number = 0; index <= ancestors.length; index++) {
            const current: DesignSvgElement | undefined =
                index === ancestors.length ? element : ancestors[index];
            if (current === undefined) {
                throw new Error('Missing SVG text ancestor.');
            }
            const resolved: Readonly<Record<string, string>> = this.css.resolve(
                current,
                ancestors.slice(0, index),
                parent,
            );
            const size: number = DesignSvgImportTextStyles.length(
                resolved['font-size'] ?? '16',
                Number(parent['font-size'] ?? 16),
                rootSize,
            );
            if (index === 0) {
                rootSize = size;
            }
            const rawWeight: string = resolved['font-weight'] ?? 'normal';
            const inherited: number = Number(parent['font-weight'] ?? 400);
            const weight: number =
                rawWeight === 'normal'
                    ? 400
                    : rawWeight === 'bold'
                      ? 700
                      : rawWeight === 'bolder'
                        ? inherited < 350
                            ? 400
                            : inherited < 550
                              ? 700
                              : 900
                        : rawWeight === 'lighter'
                          ? inherited < 550
                              ? 100
                              : inherited < 750
                                ? 400
                                : 700
                          : Number(rawWeight);
            parent = {
                ...resolved,
                'font-size': size.toString(),
                'font-weight': weight.toString(),
            };
        }
        this.#rootSize = rootSize;
        return parent;
    }

    /** Font-relative lengths resolve before the authored text is transformed into design pixels. */
    public static length(source: string, size: number, rootSize: number = size): number {
        const value: string = source.trim();
        if (value.endsWith('rem')) {
            return DesignSvgNumbers.length(value.slice(0, -3), 1) * rootSize;
        }
        if (value.endsWith('em')) {
            return DesignSvgNumbers.length(value.slice(0, -2), 1) * size;
        }
        return DesignSvgNumbers.length(value, size);
    }

    /** Text coordinates and offsets resolve percentages against their viewport axis, not the font size. */
    public static position(
        source: string,
        size: number,
        rootSize: number,
        viewport: number,
    ): number {
        return source.trim().endsWith('%')
            ? DesignSvgNumbers.length(source, viewport)
            : this.length(source, size, rootSize);
    }

    /** Exact families are retained; missing faces fail at shaping rather than being silently substituted. */
    public static span(style: Readonly<Record<string, string>>): DesignTextSpanStyle {
        const families: readonly string[] = (style['font-family'] ?? 'serif').split(',');
        const first: string = (families[0] ?? '').trim();
        const family: string = DesignFontFamilyCodec.family(
            /^(['"]).*\1$/u.test(first) ? first.slice(1, -1) : first,
        );
        const italic: string = style['font-style'] ?? 'normal';
        if (!['normal', 'italic'].includes(italic)) {
            throw new Error('Unsupported SVG font-style.');
        }
        const fill: string = style['fill'] ?? '#000000';
        const color: string =
            fill === 'none'
                ? '#00000000'
                : DesignSvgColors.parse(fill, style['color'] ?? '#000000');
        const alpha: number = color.length === 9 ? Number.parseInt(color.slice(7), 16) / 255 : 1;
        const opacity: number = DesignSvgImportAppearance.opacity(style['fill-opacity']);
        return {
            rich: false,
            family,
            size: Number(style['font-size'] ?? 16),
            weight: Number(style['font-weight'] ?? 400),
            italic: italic === 'italic',
            color:
                alpha * opacity === 1
                    ? color
                    : color.slice(0, 7) +
                      Math.round(alpha * opacity * 255)
                          .toString(16)
                          .padStart(2, '0')
                          .toUpperCase(),
            underline: false,
        };
    }

    /** Features without a native editable text equivalent reject instead of changing a diagram's labels. */
    public static validate(
        element: DesignSvgElement,
        style: Readonly<Record<string, string>>,
    ): void {
        DesignSvgImportAppearance.validate(style);
        for (const name of [
            'rotate',
            'textLength',
            'lengthAdjust',
            'font-size-adjust',
            'font-feature-settings',
        ]) {
            if (element.attributes[name] !== undefined) {
                throw new Error('Unsupported SVG text attribute ' + name + '.');
            }
        }
        const choices: Readonly<Record<string, readonly string[]>> = {
            'dominant-baseline': ['auto', 'alphabetic'],
            'alignment-baseline': ['auto', 'baseline', 'alphabetic'],
            'baseline-shift': ['0', '0px', 'baseline'],
            direction: ['ltr'],
            'unicode-bidi': ['normal'],
            'writing-mode': ['horizontal-tb', 'lr-tb'],
            'font-variant': ['normal'],
            'font-stretch': ['normal', '100%'],
            'font-kerning': ['auto', 'normal'],
            'text-decoration': ['none'],
            'word-spacing': ['normal', '0', '0px'],
            'white-space': ['normal', 'nowrap'],
            stroke: ['none'],
        };
        for (const [property, allowed] of Object.entries(choices)) {
            const value: string | undefined = style[property] ?? element.attributes[property];
            if (value !== undefined && !allowed.includes(value)) {
                throw new Error('Unsupported SVG text ' + property + '.');
            }
        }
    }
}
