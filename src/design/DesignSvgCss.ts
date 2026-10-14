// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgColors } from './DesignSvgColors.js';
import type { DesignSvgElement } from './DesignSvgXml.js';

/** One inert author declaration; important flags participate in the normal CSS cascade. */
export interface DesignSvgDeclaration {
    readonly property: string;
    readonly value: string;
    readonly important: boolean;
}
interface SvgCssRule {
    readonly selector: string;
    readonly specificity: number;
    readonly declarations: readonly DesignSvgDeclaration[];
}
interface SvgCssValue {
    readonly value: string;
    readonly rank: number;
}

/** Presentation attributes and embedded author styles resolve without executing or loading CSS. */
export class DesignSvgCss {
    #rules: SvgCssRule[] = [];
    #comparisons: number = 0;
    public static readonly inherited: ReadonlySet<string> = new Set([
        'color',
        'fill',
        'fill-rule',
        'fill-opacity',
        'stroke',
        'stroke-opacity',
        'stroke-width',
        'stroke-linecap',
        'stroke-linejoin',
        'stroke-miterlimit',
        'stroke-dasharray',
        'stroke-dashoffset',
        'visibility',
        'font-family',
        'font-size',
        'font-weight',
        'font-style',
        'text-anchor',
        'letter-spacing',
        'word-spacing',
        'dominant-baseline',
        'text-decoration',
        'white-space',
        'direction',
        'unicode-bidi',
        'writing-mode',
        'font-variant',
        'font-stretch',
        'font-kerning',
        'clip-rule',
    ]);
    public static readonly properties: ReadonlySet<string> = new Set([
        ...this.inherited,
        'opacity',
        'display',
        'transform',
        'transform-origin',
        'transform-box',
        'clip-path',
        'mask',
        'mask-type',
        'mask-mode',
        'filter',
        'stop-color',
        'stop-opacity',
        'overflow',
        'vector-effect',
        'paint-order',
        'mix-blend-mode',
        'isolation',
        'x',
        'y',
        'width',
        'height',
        'rx',
        'ry',
        'cx',
        'cy',
        'r',
        'd',
        'dx',
        'dy',
        'alignment-baseline',
        'baseline-shift',
    ]);
    /** Styles may precede or follow their target elements; collect the complete author sheet first. */
    public constructor(root: DesignSvgElement) {
        const visit: (element: DesignSvgElement) => void = (element: DesignSvgElement): void => {
            if (element.name === 'style') {
                this.#sheet(
                    element.children
                        .map((child): string => (typeof child === 'string' ? child : ''))
                        .join(''),
                );
            }
            for (const child of element.children) {
                if (typeof child !== 'string') {
                    visit(child);
                }
            }
        };
        visit(root);
    }
    /** Noninherited properties reset at each element; explicit inherit works for every supported property. */
    public resolve(
        element: DesignSvgElement,
        ancestors: readonly DesignSvgElement[],
        parent: Readonly<Record<string, string>>,
    ): Readonly<Record<string, string>> {
        const values: Map<string, SvgCssValue> = new Map();
        for (const [property, value] of Object.entries(element.attributes)) {
            if (DesignSvgCss.properties.has(property)) {
                values.set(property, { value, rank: 0 });
            }
        }
        const apply: (
            declarations: readonly DesignSvgDeclaration[],
            specificity: number,
        ) => void = (declarations: readonly DesignSvgDeclaration[], specificity: number): void => {
            for (const declaration of declarations) {
                const rank: number = specificity + (declaration.important ? 1000000000 : 0);
                if (rank >= (values.get(declaration.property)?.rank ?? -1)) {
                    values.set(declaration.property, { value: declaration.value, rank });
                }
            }
        };
        for (const rule of this.#rules) {
            if (this.#matches(rule.selector, element, ancestors)) {
                apply(rule.declarations, rule.specificity);
            }
        }
        apply(DesignSvgCss.declarations(element.attributes['style'] ?? ''), 100000000);
        const output: Record<string, string> = {};
        for (const [property, value] of Object.entries(parent)) {
            if (DesignSvgCss.inherited.has(property)) {
                output[property] = value;
            }
        }
        for (const [property, entry] of values) {
            if (
                entry.value === 'inherit' ||
                (entry.value === 'unset' && DesignSvgCss.inherited.has(property))
            ) {
                const inherited: string | undefined = parent[property];
                if (inherited === undefined) {
                    delete output[property];
                } else {
                    output[property] = inherited;
                }
            } else if (entry.value === 'initial' || entry.value === 'unset') {
                delete output[property];
            } else {
                output[property] = entry.value;
            }
        }
        output['color'] = DesignSvgColors.parse(
            output['color'] ?? '#000000',
            parent['color'] ?? '#000000',
        );
        return output;
    }
    /** Semicolons inside quoted font names or functional values do not split declarations. */
    public static declarations(
        source: string,
        allowed: ReadonlySet<string> = this.properties,
    ): readonly DesignSvgDeclaration[] {
        const output: DesignSvgDeclaration[] = [];
        let start: number = 0;
        let depth: number = 0;
        let quote: string = '';
        const append: (raw: string) => void = (raw: string): void => {
            if (raw.trim() === '') {
                return;
            }
            const match: RegExpMatchArray | null = /^\s*([a-zA-Z-]+)\s*:\s*([\s\S]*?)\s*$/u.exec(
                raw,
            );
            const property: string = match?.[1]?.toLowerCase() ?? '';
            const value: string = match?.[2] ?? '';
            if (!allowed.has(property) || value.length === 0) {
                throw new Error('Unsupported SVG style property ' + property);
            }
            const important: boolean = /\s*!important\s*$/iu.test(value);
            output.push({
                property,
                value: important ? value.replace(/\s*!important\s*$/iu, '') : value,
                important,
            });
            if (output.length > 128) {
                throw new Error('SVG style declaration budget exceeded.');
            }
        };
        for (let index: number = 0; index <= source.length; index++) {
            const char: string = source[index] ?? ';';
            if (quote !== '') {
                if (char === '\\') {
                    index++;
                } else if (char === quote) {
                    quote = '';
                }
            } else if (char === '"' || char === "'") {
                quote = char;
            } else if (char === '(') {
                depth++;
            } else if (char === ')') {
                if (--depth < 0) {
                    throw new Error('Unbalanced SVG style value.');
                }
            } else if (char === ';' && depth === 0) {
                append(source.slice(start, index));
                start = index + 1;
            }
        }
        if (quote !== '' || depth !== 0) {
            throw new Error('Unclosed SVG style value.');
        }
        return output;
    }
    /** Font admission and ordinary selectors share the same inert comment handling. */
    public static clean(source: string): string {
        if (/\/\*(?:(?!\*\/)[\s\S])*$/u.test(source)) {
            throw new Error('Unclosed SVG CSS comment.');
        }
        return source.replace(/\/\*[\s\S]*?\*\//gu, '').trim();
    }
    #sheet(source: string): void {
        let rest: string = DesignSvgCss.clean(source);
        while (rest.length > 0) {
            const match: RegExpMatchArray | null = /^([^{}]+)\{([^{}]*)\}/u.exec(rest);
            const selectors: string | undefined = match?.[1];
            const body: string | undefined = match?.[2];
            if (match === null || selectors === undefined || body === undefined) {
                throw new Error('Unsupported SVG stylesheet syntax.');
            }
            const declarations: readonly DesignSvgDeclaration[] = DesignSvgCss.declarations(body);
            for (const value of selectors.split(',')) {
                const selector: string = value.trim();
                if (!/^(?:[A-Za-z_*]|[.#])[A-Za-z0-9_.#* >-]*$/u.test(selector)) {
                    throw new Error('Unsupported SVG CSS selector ' + selector);
                }
                const tokens: readonly string[] = selector
                    .replace(/\s*>\s*/gu, ' > ')
                    .split(/\s+/u);
                if (tokens.length > 64 || tokens[0] === '>' || tokens.at(-1) === '>') {
                    throw new Error('Invalid SVG CSS selector.');
                }
                const ids: number = selector.match(/#/gu)?.length ?? 0;
                const classes: number = selector.match(/\./gu)?.length ?? 0;
                const tags: number = tokens.filter((token: string): boolean =>
                    /^[A-Za-z_]/u.test(token),
                ).length;
                this.#rules.push({
                    selector,
                    specificity: ids * 10000 + classes * 100 + tags,
                    declarations,
                });
                if (this.#rules.length > 2000) {
                    throw new Error('SVG stylesheet exceeds its rule budget.');
                }
            }
            rest = rest.slice(match[0].length).trimStart();
        }
    }
    #matches(
        selector: string,
        element: DesignSvgElement,
        ancestors: readonly DesignSvgElement[],
    ): boolean {
        const tokens: readonly string[] = selector.replace(/\s*>\s*/gu, ' > ').split(/\s+/u);
        const chain: readonly DesignSvgElement[] = [...ancestors, element];
        const memo: Map<number, boolean> = new Map();
        const match: (index: number, depth: number) => boolean = (
            index: number,
            depth: number,
        ): boolean => {
            if (index < 0 || depth < 0) {
                return false;
            }
            const key: number = index * chain.length + depth;
            const cached: boolean | undefined = memo.get(key);
            if (cached !== undefined) {
                return cached;
            }
            if (++this.#comparisons > 10000000) {
                throw new Error('SVG CSS matching exceeds its import budget.');
            }
            const target: DesignSvgElement | undefined = chain[depth];
            const token: string | undefined = tokens[index];
            let matches: boolean = false;
            if (
                target !== undefined &&
                token !== undefined &&
                token !== '>' &&
                this.#simple(token, target)
            ) {
                if (index === 0) {
                    matches = true;
                } else if (tokens[index - 1] === '>') {
                    matches = match(index - 2, depth - 1);
                } else {
                    for (let parent: number = depth - 1; parent >= 0; parent--) {
                        if (match(index - 1, parent)) {
                            matches = true;
                            break;
                        }
                    }
                }
            }
            memo.set(key, matches);
            return matches;
        };
        return match(tokens.length - 1, chain.length - 1);
    }
    #simple(selector: string, element: DesignSvgElement): boolean {
        const parts: readonly string[] =
            selector.match(/^[A-Za-z_][A-Za-z0-9_-]*|^\*|[.#][A-Za-z0-9_-]+/gu) ?? [];
        if (parts.join('') !== selector) {
            return false;
        }
        const classes: ReadonlySet<string> = new Set(
            (element.attributes['class'] ?? '').trim().split(/\s+/u),
        );
        return parts.every(
            (part: string): boolean =>
                part === '*' ||
                (part.startsWith('.')
                    ? classes.has(part.slice(1))
                    : part.startsWith('#')
                      ? element.attributes['id'] === part.slice(1)
                      : element.name === part),
        );
    }
}
