// SPDX-License-Identifier: Apache-2.0

import { DesignFontEngine, type DesignFontSource } from './DesignFontEngine.js';

/** Inter's original regular and italic variable fonts are available without network or host access. */
export class DesignBuiltinFonts {
    static #engine: Promise<DesignFontEngine> | null = null;

    /** Private workspace fonts are added to a fresh engine and never leak into the shared built-in cache. */
    public static async engine(
        sources: readonly DesignFontSource[] = [],
    ): Promise<DesignFontEngine> {
        if (
            sources.some(
                (source: DesignFontSource): boolean =>
                    source.binding === undefined &&
                    ['inter', 'noto emoji'].includes(source.family.toLowerCase()),
            )
        ) {
            return this.#create(sources);
        }
        this.#engine ??= this.#create([]);
        const bundled: DesignFontEngine = await this.#engine;
        return sources.length === 0 ? bundled : bundled.with(sources);
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
        return engine;
    }
}
