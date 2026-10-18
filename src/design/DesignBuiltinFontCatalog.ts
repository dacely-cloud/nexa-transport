// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Available main text faces use the same originals on the server and in the editor. */
export interface DesignBuiltinFont {
    readonly family: string;
    readonly minimumWeight: number;
    readonly maximumWeight: number;
    readonly italics: readonly boolean[];
    readonly opticalSize: number;
}

/** Metadata discovery never imports or transmits font bytes. */
export class DesignBuiltinFontCatalog {
    /** Portable font choices are explicit; a browser's local fallback is not a saved font source. */
    public static readonly instruction: string =
        'Built-ins: Inter (100–900) and Source Serif 4 (200–900), both normal and italic. Set family, weight and italic with font:null. Other families need matching imported font files and their saved bindings; local system names alone cannot produce portable previews.';

    /** Main authoring families; script and emoji fallback faces remain available separately. */
    public static readonly fonts: readonly DesignBuiltinFont[] = Object.freeze([
        Object.freeze({
            family: 'Inter',
            minimumWeight: 100,
            maximumWeight: 900,
            italics: Object.freeze([false, true]),
            opticalSize: 14,
        }),
        Object.freeze({
            family: 'Source Serif 4',
            minimumWeight: 200,
            maximumWeight: 900,
            italics: Object.freeze([false, true]),
            opticalSize: 20,
        }),
    ]);

    /** Case-insensitive family matching follows the shared font registry. */
    public static find(family: string): DesignBuiltinFont | null {
        return (
            this.fonts.find(
                (font: DesignBuiltinFont): boolean =>
                    font.family.toLowerCase() === family.toLowerCase(),
            ) ?? null
        );
    }

    /** Loading the optional serif is driven by actual authored styles. */
    public static serif(families: readonly string[]): boolean {
        return families.some(
            (family: string): boolean => family.toLowerCase() === 'source serif 4',
        );
    }
}
