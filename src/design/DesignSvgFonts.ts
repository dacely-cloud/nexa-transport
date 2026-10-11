// SPDX-License-Identifier: Apache-2.0

import {
    DesignSvgLimits,
    type DesignSvgResult,
    type DesignSvgSelection,
} from './DesignSvgTypes.js';
import type { DesignBox, DesignText, DesignTextRun } from './DesignTypes.js';
import { DesignSvgGeometry } from './DesignSvgGeometry.js';
import { DesignFontBindings } from './DesignFontBindings.js';
import {
    DesignFontEngine,
    type DesignFontSource,
    type DesignFontWeightRange,
} from './DesignFontEngine.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';

/** Explicit exports embed only selected faces; ordinary scene transfers contain no font bytes. */
export class DesignSvgFonts {
    public static async embed(
        result: DesignSvgResult,
        selection: DesignSvgSelection,
        sources: readonly DesignFontSource[] = [],
    ): Promise<DesignSvgResult> {
        const used: ReadonlySet<boolean> = this.#used(selection);
        const privateCss: string = this.#private(result.svg.length, selection, sources);
        if (used.size === 0 && privateCss === '') {
            return result;
        }
        const { DesignInterBytes }: typeof import('./DesignInterBytes.js') =
            await import('./DesignInterBytes.js');
        const { DesignInterLicense }: typeof import('./DesignInterLicense.js') =
            await import('./DesignInterLicense.js');
        const css: string = [...used]
            .map(
                (italic: boolean): string =>
                    `@font-face{font-family:Inter;font-style:${italic ? 'italic' : 'normal'};font-weight:100 900;font-variation-settings:'opsz' 14;src:url(data:font/woff2;base64,${DesignInterBytes.encoded(italic)}) format('woff2');}`,
            )
            .join('');
        const svg: string = result.svg.replace(
            '<defs>',
            `${used.size === 0 ? '' : `<metadata>${DesignSvgGeometry.escape(DesignInterLicense.text)}</metadata>`}<defs><style>${css}${privateCss}</style>`,
        );
        if (svg.length > DesignSvgLimits.characters) {
            throw new Error('Export individual frames to stay within the SVG content budget.');
        }
        return { ...result, svg };
    }
    /** Native file exports use real Inter shaping and the portable fallback for other system families. */
    public static inter(selection: DesignSvgSelection): boolean {
        return this.#used(selection).size > 0;
    }
    static #used(selection: DesignSvgSelection): ReadonlySet<boolean> {
        const ids: ReadonlySet<string> = new Set(
            selection.boxes.map((box: DesignBox): string => box.id),
        );
        const used: Set<boolean> = new Set();
        for (const node of selection.scene.nodes) {
            if (!ids.has(node.id) || node.text === null || node.text.content === '') {
                continue;
            }
            if (node.text.font == null && node.text.family.toLowerCase() === 'inter') {
                used.add(node.text.italic);
            }
            for (const run of node.text.runs) {
                if (
                    DesignFontBindings.resolve(node.text, run) === null &&
                    run.family.toLowerCase() === 'inter'
                ) {
                    used.add(run.italic);
                }
            }
        }
        return used;
    }
    static #private(
        initialCharacters: number,
        selection: DesignSvgSelection,
        sources: readonly DesignFontSource[],
    ): string {
        const ids: ReadonlySet<string> = new Set(
            selection.boxes.map((box: DesignBox): string => box.id),
        );
        const needed: Map<string, DesignTextSpanStyle> = new Map();
        for (const node of selection.scene.nodes) {
            const text: DesignText | null = node.text;
            if (!ids.has(node.id) || text === null || text.content === '') {
                continue;
            }
            const styles: readonly DesignTextSpanStyle[] = [
                DesignFontBindings.base(text, '#000000'),
                ...text.runs.map((run: DesignTextRun): DesignTextSpanStyle =>
                    DesignFontBindings.run(text, run),
                ),
            ];
            for (const style of styles) {
                if (style.font != null) {
                    needed.set(style.font.id + ':' + style.font.sha256, style);
                }
            }
        }
        const css: string[] = [];
        let characters: number = initialCharacters;
        for (const style of needed.values()) {
            const source: DesignFontSource | undefined = sources.find(
                (entry: DesignFontSource): boolean =>
                    entry.binding?.id === style.font?.id &&
                    entry.binding?.sha256 === style.font?.sha256,
            );
            if (source === undefined) {
                throw new Error('A saved font is missing from the explicit SVG export.');
            }
            characters += Math.ceil(source.bytes.length / 3) * 4 + 512;
            if (characters > DesignSvgLimits.characters) {
                throw new Error(
                    'Export individual frames to keep embedded fonts within the SVG content budget.',
                );
            }
            const engine: DesignFontEngine = new DesignFontEngine();
            engine.add(source);
            if (!engine.supports(style)) {
                throw new Error('Export font does not match the saved text style.');
            }
            const range: DesignFontWeightRange = engine.weightRange(style);
            const signature: number = new DataView(
                source.bytes.buffer,
                source.bytes.byteOffset,
                source.bytes.byteLength,
            ).getUint32(0);
            const format: string =
                signature === 0x774f4632
                    ? 'woff2'
                    : signature === 0x774f4646
                      ? 'woff'
                      : signature === 0x4f54544f
                        ? 'opentype'
                        : 'truetype';
            const mime: string =
                format === 'truetype' ? 'ttf' : format === 'opentype' ? 'otf' : format;
            css.push(
                `@font-face{font-family:'${DesignFontBindings.family(style.family, style.font)}';font-style:${source.italic ? 'italic' : 'normal'};font-weight:${range.minimum} ${range.maximum};src:url(data:font/${mime};base64,${this.#base64(source.bytes)}) format('${format}');}`,
            );
        }
        return css.join('');
    }
    /** Three-byte-aligned blocks avoid intermediate padding and bound function argument counts. */
    static #base64(bytes: Uint8Array): string {
        const parts: string[] = [];
        for (let offset: number = 0; offset < bytes.length; offset += 32766) {
            parts.push(btoa(String.fromCharCode(...bytes.subarray(offset, offset + 32766))));
        }
        return parts.join('');
    }
}
