// SPDX-License-Identifier: Apache-2.0

import { DesignFontEngine, type DesignFontSource } from './DesignFontEngine.js';

/** Inter's original regular and italic variable fonts are available without network or host access. */
export class DesignBuiltinFonts {
    static #engine: Promise<DesignFontEngine> | null = null;

    /** Private workspace fonts are added to a fresh engine and never leak into the shared built-in cache. */
    public static async engine(
        sources: readonly DesignFontSource[] = [],
    ): Promise<DesignFontEngine> {
        if (sources.length > 0) {
            return this.#create(sources);
        }
        this.#engine ??= this.#create([]);
        return this.#engine;
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
        return engine;
    }
}
