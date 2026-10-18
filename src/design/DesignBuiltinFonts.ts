// SPDX-License-Identifier: Apache-2.0

import { DesignFontEngine, type DesignFontSource } from './DesignFontEngine.js';
import { DesignBuiltinFontCatalog } from './DesignBuiltinFontCatalog.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';

/** Inter's original regular and italic variable fonts are available without network or host access. */
export class DesignBuiltinFonts {
    static #engine: Promise<DesignFontEngine> | null = null;
    static #serif: Promise<DesignFontEngine> | null = null;

    /** Private workspace fonts are added to a fresh engine and never leak into the shared built-in cache. */
    public static async engine(
        sources: readonly DesignFontSource[] = [],
        families: readonly string[] = [],
    ): Promise<DesignFontEngine> {
        if (
            sources.some(
                (source: DesignFontSource): boolean =>
                    source.binding === undefined &&
                    (DesignBuiltinFontCatalog.find(source.family) !== null ||
                        ['noto emoji', 'noto sans arabic', 'noto sans hebrew'].includes(
                            source.family.toLowerCase(),
                        )),
            )
        ) {
            const fresh: DesignFontEngine = await this.#create(sources);
            return this.extend(fresh, [], families);
        }
        this.#engine ??= this.#create([]);
        const regular: DesignFontEngine = await this.#engine;
        const bundled: DesignFontEngine = DesignBuiltinFontCatalog.serif(families)
            ? await (this.#serif ??= this.extend(regular, [], ['Source Serif 4']))
            : regular;
        if (sources.length === 0) {
            return bundled;
        }
        const result: DesignFontEngine = bundled.with(sources);
        await result.prepare();
        return result;
    }

    /** A transient command can add an optional public face without dropping its authorized private fonts. */
    public static async extend(
        base: DesignFontEngine,
        sources: readonly DesignFontSource[] = [],
        families: readonly string[] = [],
    ): Promise<DesignFontEngine> {
        const added: DesignFontSource[] = [...sources];
        if (DesignBuiltinFontCatalog.serif(families)) {
            const { DesignSourceSerifBytes }: typeof import('./DesignSourceSerifBytes.js') =
                await import('./DesignSourceSerifBytes.js');
            for (const italic of [false, true]) {
                const style: DesignTextSpanStyle = {
                    family: 'Source Serif 4',
                    size: 16,
                    weight: 400,
                    italic,
                    color: '#000000',
                    underline: false,
                    rich: false,
                };
                if (
                    !base.supports(style) &&
                    !sources.some(
                        (source: DesignFontSource): boolean =>
                            source.binding === undefined &&
                            source.family.toLowerCase() === 'source serif 4' &&
                            source.italic === italic &&
                            source.weight === 400,
                    )
                ) {
                    added.push({
                        family: 'Source Serif 4',
                        weight: 400,
                        italic,
                        bytes: DesignSourceSerifBytes.read(italic),
                    });
                }
            }
        }
        if (added.length === 0) {
            return base;
        }
        const result: DesignFontEngine = base.with(added);
        await result.prepare();
        return result;
    }

    /** The original public fallback font also registers the browser's ordinary text and caret rendering. */
    public static async emojiBytes(): Promise<Uint8Array<ArrayBuffer>> {
        const { DesignEmojiBytes }: typeof import('./DesignEmojiBytes.js') =
            await import('./DesignEmojiBytes.js');
        return DesignEmojiBytes.read();
    }

    static async #create(sources: readonly DesignFontSource[]): Promise<DesignFontEngine> {
        const { DesignInterOutlineBytes }: typeof import('./DesignInterOutlineBytes.js') =
            await import('./DesignInterOutlineBytes.js');
        const engine: DesignFontEngine = new DesignFontEngine();
        for (const source of sources) {
            engine.add(source);
        }
        for (const italic of [false, true]) {
            if (
                !sources.some(
                    (source: DesignFontSource): boolean =>
                        source.family.toLowerCase() === 'inter' &&
                        source.binding === undefined &&
                        source.italic === italic &&
                        source.weight === 400,
                )
            ) {
                engine.add({
                    family: 'Inter',
                    italic,
                    weight: 400,
                    bytes: DesignInterOutlineBytes.read(italic),
                });
            }
        }
        const { DesignEmojiBytes }: typeof import('./DesignEmojiBytes.js') =
            await import('./DesignEmojiBytes.js');
        if (
            !sources.some(
                (source: DesignFontSource): boolean =>
                    source.family.toLowerCase() === 'noto emoji' &&
                    source.binding === undefined &&
                    !source.italic &&
                    source.weight === 400,
            )
        ) {
            engine.add({
                family: 'Noto Emoji',
                italic: false,
                weight: 400,
                fallback: true,
                bytes: DesignEmojiBytes.read(),
            });
        }
        const {
            DesignScriptFont,
            DesignScriptFontBytes,
        }: typeof import('./DesignScriptFontBytes.js') = await import('./DesignScriptFontBytes.js');
        for (const family of Object.values(DesignScriptFont)) {
            if (
                !sources.some(
                    (source: DesignFontSource): boolean =>
                        source.family.toLowerCase() === family.toLowerCase() &&
                        source.binding === undefined &&
                        !source.italic &&
                        source.weight === 400,
                )
            ) {
                engine.add({
                    family,
                    italic: false,
                    weight: 400,
                    fallback: true,
                    bytes: DesignScriptFontBytes.read(family),
                });
            }
        }
        await engine.prepare();
        return engine;
    }
}
