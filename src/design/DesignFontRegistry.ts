// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { create, type Font, type FontCollection } from 'fontkit';
import { DesignFontContainer } from './DesignFontContainer.js';
import type { DesignFontSource, DesignFontWeightRange } from './DesignFontEngine.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import type { DesignFontBinding } from './DesignFontTypes.js';

interface RegisteredFont {
    readonly source: DesignFontSource;
    readonly face: Font;
}
/** The actual physical face and its exact binding travel together through mixed-face shaping. */
export interface DesignResolvedFace {
    readonly face: Font;
    readonly style: DesignTextSpanStyle;
}

/** Authorized immutable faces and bounded variable instances are shared without exposing filesystem access. */
export class DesignFontRegistry {
    readonly #fonts: RegisteredFont[] = [];
    readonly #variations: Map<string, Font> = new Map();

    /** Validates font containers before parser entry and rejects ambiguous family/style/binding identities. */
    public add(source: DesignFontSource): void {
        DesignFontContainer.inspect(source.bytes);
        const parsed: Font | FontCollection = create(source.bytes);
        if (
            !('layout' in parsed) ||
            !Number.isFinite(parsed.unitsPerEm) ||
            parsed.unitsPerEm < 1 ||
            parsed.unitsPerEm > 16384
        ) {
            throw new Error('Font has invalid outline metrics.');
        }
        if (
            (parsed.type === 'WOFF' || parsed.type === 'WOFF2') &&
            parsed.variationAxes['wght'] !== undefined
        ) {
            throw new Error(
                'Use the uncompressed TTF or OTF version of a variable workspace font. Compressed variable fonts are unsupported by this parser.',
            );
        }
        if (
            this.#fonts.some(
                (entry: RegisteredFont): boolean =>
                    entry.source.family.toLowerCase() === source.family.toLowerCase() &&
                    entry.source.italic === source.italic &&
                    entry.source.weight === source.weight &&
                    this.#sameBinding(entry.source.binding, source.binding),
            )
        ) {
            throw new Error('Duplicate font family, weight and italic binding.');
        }
        this.#fonts.push({ source, face: parsed });
    }

    /** A private extension retains only the caller's authorized sources and its own variation cache. */
    public with(sources: readonly DesignFontSource[]): DesignFontRegistry {
        const result: DesignFontRegistry = new DesignFontRegistry();
        result.#fonts.push(...this.#fonts);
        for (const source of sources) {
            result.add(source);
        }
        return result;
    }

    /** Resolves the authored face without silently replacing a missing private binding. */
    public resolve(style: DesignTextSpanStyle): DesignResolvedFace {
        const entry: RegisteredFont | undefined = this.#entry(style);
        if (entry === undefined) {
            throw new Error(
                `No matching ${style.family} font at weight ${style.weight}${style.italic ? ' italic' : ''}. Supply a matching workspace font.`,
            );
        }
        return { face: this.#face(entry, style.weight), style };
    }

    /** Only explicitly admitted fallback faces can supply a missing complete grapheme. */
    public fallback(style: DesignTextSpanStyle, grapheme: string): DesignResolvedFace | null {
        for (const entry of this.#fonts) {
            if (
                entry.source.fallback !== true ||
                !DesignFontRegistry.covers(entry.face, grapheme)
            ) {
                continue;
            }
            const axis: Font['variationAxes'][string] = entry.face.variationAxes['wght'];
            const weight: number =
                axis === undefined
                    ? entry.source.weight
                    : Math.max(axis.min, Math.min(axis.max, style.weight));
            const fallback: DesignTextSpanStyle = {
                ...style,
                font: entry.source.binding ?? null,
                family: entry.source.family,
                italic: entry.source.italic,
                weight,
            };
            return { face: this.#face(entry, weight), style: fallback };
        }
        return null;
    }

    /** Control/format characters keep their shaping context even when they have no standalone cmap entry. */
    public static covers(face: Font, content: string): boolean {
        for (const character of content) {
            const point: number | undefined = character.codePointAt(0);
            if (
                point !== undefined &&
                !/[\s\p{Cf}]/u.test(character) &&
                !face.hasGlyphForCodePoint(point)
            ) {
                return false;
            }
        }
        return true;
    }

    /** A family match retains the same actual weight-range checks as source registration and SVG embedding. */
    public supports(style: DesignTextSpanStyle): boolean {
        const entry: RegisteredFont | undefined = this.#entry(style);
        if (entry === undefined) {
            return false;
        }
        const axis: Font['variationAxes'][string] = entry.face.variationAxes['wght'];
        return axis === undefined || (style.weight >= axis.min && style.weight <= axis.max);
    }

    /** Static and variable bounds are validated before UI or fallback style selection uses them. */
    public weightRange(style: DesignTextSpanStyle): DesignFontWeightRange {
        const entry: RegisteredFont | undefined = this.#entry(style);
        if (entry === undefined) {
            throw new Error('No matching font binding.');
        }
        const axis: Font['variationAxes'][string] = entry.face.variationAxes['wght'];
        const minimum: number = axis?.min ?? entry.source.weight;
        const maximum: number = axis?.max ?? entry.source.weight;
        if (
            !Number.isFinite(minimum) ||
            !Number.isFinite(maximum) ||
            minimum < 1 ||
            maximum > 1000 ||
            minimum > maximum
        ) {
            throw new Error('Font has an invalid weight range.');
        }
        return { minimum, maximum };
    }

    #entry(style: DesignTextSpanStyle): RegisteredFont | undefined {
        return this.#fonts.find(
            (entry: RegisteredFont): boolean =>
                entry.source.family.toLowerCase() === style.family.toLowerCase() &&
                entry.source.italic === style.italic &&
                this.#sameBinding(entry.source.binding, style.font) &&
                (entry.face.variationAxes['wght'] !== undefined ||
                    entry.source.weight === style.weight),
        );
    }
    #sameBinding(
        a: DesignFontBinding | null | undefined,
        b: DesignFontBinding | null | undefined,
    ): boolean {
        return a == null ? b == null : b != null && a.id === b.id && a.sha256 === b.sha256;
    }
    #face(entry: RegisteredFont, weight: number): Font {
        const axis: Font['variationAxes'][string] = entry.face.variationAxes['wght'];
        if (axis === undefined) {
            return entry.face;
        }
        if (weight < axis.min || weight > axis.max) {
            throw new Error('Requested font weight is outside the supplied variable font range.');
        }
        const key: string = `${this.#fonts.indexOf(entry)}:${weight}`;
        let face: Font | undefined = this.#variations.get(key);
        if (face === undefined) {
            face = entry.face.getVariation({ wght: weight });
            if (this.#variations.size >= 64) {
                const oldest: string | undefined = this.#variations.keys().next().value;
                if (oldest !== undefined) {
                    this.#variations.delete(oldest);
                }
            }
            this.#variations.set(key, face);
        }
        return face;
    }
}
