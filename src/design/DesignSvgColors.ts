// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** CSS named-color values are fixed facts from https://www.w3.org/TR/css-color-4/#named-colors. */
const names: Readonly<Record<string, string>> = Object.freeze({
    aliceblue: '#F0F8FF',
    antiquewhite: '#FAEBD7',
    aqua: '#00FFFF',
    aquamarine: '#7FFFD4',
    azure: '#F0FFFF',
    beige: '#F5F5DC',
    bisque: '#FFE4C4',
    black: '#000000',
    blanchedalmond: '#FFEBCD',
    blue: '#0000FF',
    blueviolet: '#8A2BE2',
    brown: '#A52A2A',
    burlywood: '#DEB887',
    cadetblue: '#5F9EA0',
    chartreuse: '#7FFF00',
    chocolate: '#D2691E',
    coral: '#FF7F50',
    cornflowerblue: '#6495ED',
    cornsilk: '#FFF8DC',
    crimson: '#DC143C',
    cyan: '#00FFFF',
    darkblue: '#00008B',
    darkcyan: '#008B8B',
    darkgoldenrod: '#B8860B',
    darkgray: '#A9A9A9',
    darkgreen: '#006400',
    darkgrey: '#A9A9A9',
    darkkhaki: '#BDB76B',
    darkmagenta: '#8B008B',
    darkolivegreen: '#556B2F',
    darkorange: '#FF8C00',
    darkorchid: '#9932CC',
    darkred: '#8B0000',
    darksalmon: '#E9967A',
    darkseagreen: '#8FBC8F',
    darkslateblue: '#483D8B',
    darkslategray: '#2F4F4F',
    darkslategrey: '#2F4F4F',
    darkturquoise: '#00CED1',
    darkviolet: '#9400D3',
    deeppink: '#FF1493',
    deepskyblue: '#00BFFF',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1E90FF',
    firebrick: '#B22222',
    floralwhite: '#FFFAF0',
    forestgreen: '#228B22',
    fuchsia: '#FF00FF',
    gainsboro: '#DCDCDC',
    ghostwhite: '#F8F8FF',
    gold: '#FFD700',
    goldenrod: '#DAA520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#ADFF2F',
    grey: '#808080',
    honeydew: '#F0FFF0',
    hotpink: '#FF69B4',
    indianred: '#CD5C5C',
    indigo: '#4B0082',
    ivory: '#FFFFF0',
    khaki: '#F0E68C',
    lavender: '#E6E6FA',
    lavenderblush: '#FFF0F5',
    lawngreen: '#7CFC00',
    lemonchiffon: '#FFFACD',
    lightblue: '#ADD8E6',
    lightcoral: '#F08080',
    lightcyan: '#E0FFFF',
    lightgoldenrodyellow: '#FAFAD2',
    lightgray: '#D3D3D3',
    lightgreen: '#90EE90',
    lightgrey: '#D3D3D3',
    lightpink: '#FFB6C1',
    lightsalmon: '#FFA07A',
    lightseagreen: '#20B2AA',
    lightskyblue: '#87CEFA',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#B0C4DE',
    lightyellow: '#FFFFE0',
    lime: '#00FF00',
    limegreen: '#32CD32',
    linen: '#FAF0E6',
    magenta: '#FF00FF',
    maroon: '#800000',
    mediumaquamarine: '#66CDAA',
    mediumblue: '#0000CD',
    mediumorchid: '#BA55D3',
    mediumpurple: '#9370DB',
    mediumseagreen: '#3CB371',
    mediumslateblue: '#7B68EE',
    mediumspringgreen: '#00FA9A',
    mediumturquoise: '#48D1CC',
    mediumvioletred: '#C71585',
    midnightblue: '#191970',
    mintcream: '#F5FFFA',
    mistyrose: '#FFE4E1',
    moccasin: '#FFE4B5',
    navajowhite: '#FFDEAD',
    navy: '#000080',
    oldlace: '#FDF5E6',
    olive: '#808000',
    olivedrab: '#6B8E23',
    orange: '#FFA500',
    orangered: '#FF4500',
    orchid: '#DA70D6',
    palegoldenrod: '#EEE8AA',
    palegreen: '#98FB98',
    paleturquoise: '#AFEEEE',
    palevioletred: '#DB7093',
    papayawhip: '#FFEFD5',
    peachpuff: '#FFDAB9',
    peru: '#CD853F',
    pink: '#FFC0CB',
    plum: '#DDA0DD',
    powderblue: '#B0E0E6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#FF0000',
    rosybrown: '#BC8F8F',
    royalblue: '#4169E1',
    saddlebrown: '#8B4513',
    salmon: '#FA8072',
    sandybrown: '#F4A460',
    seagreen: '#2E8B57',
    seashell: '#FFF5EE',
    sienna: '#A0522D',
    silver: '#C0C0C0',
    skyblue: '#87CEEB',
    slateblue: '#6A5ACD',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#FFFAFA',
    springgreen: '#00FF7F',
    steelblue: '#4682B4',
    tan: '#D2B48C',
    teal: '#008080',
    thistle: '#D8BFD8',
    tomato: '#FF6347',
    turquoise: '#40E0D0',
    violet: '#EE82EE',
    wheat: '#F5DEB3',
    white: '#FFFFFF',
    whitesmoke: '#F5F5F5',
    yellow: '#FFFF00',
    yellowgreen: '#9ACD32',
    transparent: '#00000000',
});

/** SVG colors become the existing validated hex paint representation. */
export class DesignSvgColors {
    public static parse(source: string, current: string = '#000000'): string {
        const value: string = source.trim().toLowerCase();
        if (value === 'currentcolor') {
            return current;
        }
        if (/^#[0-9a-f]{3,4}$/u.test(value)) {
            return (
                '#' +
                value
                    .slice(1)
                    .split('')
                    .map((char: string): string => char + char)
                    .join('')
                    .toUpperCase()
            );
        }
        if (/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/u.test(value)) {
            return value.toUpperCase();
        }
        if (Object.hasOwn(names, value)) {
            return names[value] ?? '#000000';
        }
        const match: RegExpMatchArray | null = /^(rgba?|hsla?)\((.*)\)$/u.exec(value);
        const kind: string | undefined = match?.[1];
        const raw: string | undefined = match?.[2];
        if (kind === undefined || raw === undefined) {
            throw new Error('Unsupported SVG color ' + source);
        }
        const parts: readonly string[] = raw.trim().split(/\s*[,/]\s*|\s+/u);
        if (parts.length !== 3 && parts.length !== 4) {
            throw new Error('Invalid SVG color ' + source);
        }
        const alpha: number = this.#channel(parts[3] ?? '1', 1);
        let rgb: readonly number[];
        if (kind.startsWith('rgb')) {
            rgb = parts.slice(0, 3).map((channel: string): number => this.#channel(channel, 255));
        } else {
            const hue: number = this.#hue(parts[0] ?? '0');
            const saturation: number = this.#percentage(parts[1] ?? '0');
            const lightness: number = this.#percentage(parts[2] ?? '0');
            const chroma: number = (1 - Math.abs(2 * lightness - 1)) * saturation;
            const x: number = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
            const m: number = lightness - chroma / 2;
            const section: readonly number[] =
                hue < 60
                    ? [chroma, x, 0]
                    : hue < 120
                      ? [x, chroma, 0]
                      : hue < 180
                        ? [0, chroma, x]
                        : hue < 240
                          ? [0, x, chroma]
                          : hue < 300
                            ? [x, 0, chroma]
                            : [chroma, 0, x];
            rgb = section.map((channel: number): number => (channel + m) * 255);
        }
        return (
            '#' +
            [...rgb, ...(alpha < 1 ? [alpha * 255] : [])]
                .map((channel: number): string =>
                    Math.round(channel).toString(16).padStart(2, '0').toUpperCase(),
                )
                .join('')
        );
    }
    static #percentage(value: string): number {
        return this.#channel(value.endsWith('%') ? value : value + '%', 1);
    }
    static #channel(value: string, maximum: number): number {
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?%?$/u.test(value)) {
            throw new Error('Invalid SVG color channel.');
        }
        const percent: boolean = value.endsWith('%');
        const channel: number = Number(percent ? value.slice(0, -1) : value);
        if (value === '' || !Number.isFinite(channel)) {
            throw new Error('Invalid SVG color channel.');
        }
        return Math.max(0, Math.min(maximum, percent ? (channel * maximum) / 100 : channel));
    }
    static #hue(source: string): number {
        const match: RegExpMatchArray | null =
            /^([+-]?(?:\d+\.?\d*|\.\d+))(deg|grad|rad|turn)?$/u.exec(source);
        const value: number = Number(match?.[1]);
        const unit: string = match?.[2] ?? 'deg';
        if (match === null || !Number.isFinite(value)) {
            throw new Error('Invalid SVG hue.');
        }
        const angle: number =
            value *
            (unit === 'turn' ? 360 : unit === 'rad' ? 180 / Math.PI : unit === 'grad' ? 0.9 : 1);
        return ((angle % 360) + 360) % 360;
    }
}
