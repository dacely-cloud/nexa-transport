// SPDX-License-Identifier: Apache-2.0

import { RobloxTextLineLayout } from './RobloxTextLines';

/** Font units measured by the same fontdue font used for native GUI drawing. */
export interface RobloxTextMetrics {
    /** Original bundled font identity; absent for older scenes or a host-configured override. */
    readonly fontUri?: string;
    readonly format: 'nexa.roblox.text-metrics';
    readonly version: 1;
    readonly unitsPerEm: number;
    readonly ascent: number;
    readonly lineHeight: number;
    readonly advances: Readonly<Record<string, number>>;
    readonly kerning: Readonly<Record<string, number>>;
}
/** Bounded request for the actual glyphs and adjacent pairs used by a scene. */
export interface RobloxTextMetricRequest {
    readonly characters: string;
    readonly pairs: readonly string[];
}
/** Intrinsic text bounds before GUI alignment, transforms and clipping. */
export interface RobloxTextBounds {
    readonly width: number;
    readonly height: number;
    readonly lines: number;
}

/** Portable measured text layout; missing glyph data is an error, never a width estimate. */
export class RobloxTextMeasurement {
    /** Default original LegacyArial face from the pinned Roblox resource family. */
    public static readonly legacyFontUri: string = 'rbxasset://fonts/Arimo-Regular.ttf';
    /** Builds one deduplicated font request, resetting kerning at paragraph boundaries. */
    public static request(texts: readonly string[]): RobloxTextMetricRequest {
        const characters: Set<string> = new Set();
        const pairs: Set<string> = new Set();
        let count: number = 0;
        for (const text of texts) {
            if (text.length > 1048576 || !text.isWellFormed()) {
                throw new Error('Invalid or oversized GUI text');
            }
            count += text.length;
            if (count > 1048576) {
                throw new Error('GUI text exceeds the measurement input budget');
            }
            for (const paragraph of this.#paragraphs(text)) {
                let previous: string | null = null;
                for (const character of paragraph) {
                    characters.add(character);
                    if (previous !== null) {
                        pairs.add(previous + character);
                    }
                    if (characters.size > 8192 || pairs.size > 32768) {
                        throw new Error('GUI text exceeds the glyph/pair budget');
                    }
                    previous = character;
                }
            }
        }
        return { characters: [...characters].join(''), pairs: [...pairs] };
    }

    /** Validates external metrics before they enter shared layout code. */
    public static decode(raw: unknown): RobloxTextMetrics {
        if (
            !this.#record(raw) ||
            Reflect.ownKeys(raw).length !== (raw['fontUri'] === undefined ? 7 : 8) ||
            raw['format'] !== 'nexa.roblox.text-metrics' ||
            raw['version'] !== 1
        ) {
            throw new Error('Invalid native GUI text metrics');
        }
        if (raw['fontUri'] !== undefined && raw['fontUri'] !== this.legacyFontUri) {
            throw new Error('Invalid native GUI font resource identity');
        }
        return {
            ...(raw['fontUri'] === undefined ? {} : { fontUri: this.legacyFontUri }),
            format: 'nexa.roblox.text-metrics',
            version: 1,
            unitsPerEm: this.#number(raw['unitsPerEm'], 1, 65536),
            ascent: this.#number(raw['ascent'], -65536, 65536),
            lineHeight: this.#number(raw['lineHeight'], 1, 131072),
            advances: this.#table(raw['advances'], 1, 8192),
            kerning: this.#table(raw['kerning'], 2, 32768),
        };
    }

    /** Matches native paragraph wrapping and f32 advance accumulation at the requested size. */
    public static measure(
        metrics: RobloxTextMetrics,
        text: string,
        size: number,
        wrapWidth: number | null,
    ): RobloxTextBounds {
        return RobloxTextLineLayout.measure(metrics, text, size, wrapWidth);
    }

    static #paragraphs(text: string): readonly string[] {
        return text.replace(/\r\n?/gu, '\n').split('\n');
    }
    static #record(raw: unknown): raw is Readonly<Record<string, unknown>> {
        if (
            raw === null ||
            typeof raw !== 'object' ||
            Array.isArray(raw) ||
            (Object.getPrototypeOf(raw) !== Object.prototype && Object.getPrototypeOf(raw) !== null)
        ) {
            return false;
        }
        for (const key of Reflect.ownKeys(raw)) {
            const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                raw,
                key,
            );
            if (
                typeof key !== 'string' ||
                descriptor?.get !== undefined ||
                descriptor?.set !== undefined
            ) {
                return false;
            }
        }
        return true;
    }
    static #number(raw: unknown, min: number, max: number): number {
        if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < min || raw > max) {
            throw new Error('Invalid GUI font metric');
        }
        return Math.fround(raw);
    }
    static #table(raw: unknown, length: number, maximum: number): Readonly<Record<string, number>> {
        if (!this.#record(raw) || Object.keys(raw).length > maximum) {
            throw new Error('Invalid GUI glyph/pair metric table');
        }
        const result: Record<string, number> = {};
        for (const [key, value] of Object.entries(raw)) {
            if (Array.from(key).length !== length || !key.isWellFormed()) {
                throw new Error('Invalid GUI glyph/pair metric key');
            }
            result[key] = this.#number(value, length === 1 ? 0 : -131072, 131072);
        }
        return Object.freeze(result);
    }
}
