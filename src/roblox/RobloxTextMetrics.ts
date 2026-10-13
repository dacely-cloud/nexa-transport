// SPDX-License-Identifier: Apache-2.0

/** Font units measured by the same fontdue font used for native GUI drawing. */
export interface RobloxTextMetrics {
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
            Reflect.ownKeys(raw).length !== 7 ||
            raw['format'] !== 'nexa.roblox.text-metrics' ||
            raw['version'] !== 1
        ) {
            throw new Error('Invalid native GUI text metrics');
        }
        return {
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
        if (
            !Number.isFinite(size) ||
            size < 1 ||
            size > 100 ||
            (wrapWidth !== null && (!Number.isFinite(wrapWidth) || wrapWidth < 0)) ||
            text.length > 131072 ||
            !text.isWellFormed()
        ) {
            throw new Error('Invalid GUI text measurement dimensions');
        }
        if (text.length === 0) {
            return { width: 0, height: 0, lines: 0 };
        }
        const scale: number = Math.fround(Math.fround(size) / metrics.unitsPerEm);
        const limit: number | null = wrapWidth === null ? null : Math.fround(wrapWidth);
        let width: number = 0;
        let lines: number = 0;
        for (const paragraph of this.#paragraphs(text)) {
            const characters: readonly string[] = Array.from(paragraph);
            if (characters.length === 0) {
                lines += 1;
            }
            let start: number = 0;
            while (start < characters.length) {
                let end: number = start;
                let used: number = 0;
                let breakAt: number = start;
                while (end < characters.length) {
                    const character: string | undefined = characters[end];
                    const previous: string | undefined =
                        end > start ? characters[end - 1] : undefined;
                    if (character === undefined) {
                        throw new Error('Missing GUI text character');
                    }
                    const next: number = this.#advance(metrics, used, previous, character, scale);
                    if (limit !== null && next > limit && end > start) {
                        break;
                    }
                    used = next;
                    end += 1;
                    if (this.#whitespace(character)) {
                        breakAt = end;
                    }
                }
                if (end < characters.length && breakAt > start) {
                    end = breakAt;
                }
                used = 0;
                for (let index: number = start; index < end; index += 1) {
                    const character: string | undefined = characters[index];
                    if (character === undefined) {
                        throw new Error('Missing GUI text character');
                    }
                    used = this.#advance(
                        metrics,
                        used,
                        index > start ? characters[index - 1] : undefined,
                        character,
                        scale,
                    );
                }
                width = Math.max(width, used);
                lines += 1;
                start = end;
                if (lines > 32768) {
                    throw new Error('GUI text exceeds the line budget');
                }
            }
            if (lines > 32768) {
                throw new Error('GUI text exceeds the line budget');
            }
        }
        return {
            width,
            height: Math.fround(Math.fround(metrics.lineHeight * scale) * lines),
            lines,
        };
    }

    static #advance(
        metrics: RobloxTextMetrics,
        used: number,
        previous: string | undefined,
        character: string,
        scale: number,
    ): number {
        const advance: number | undefined = metrics.advances[character];
        const kern: number | undefined =
            previous === undefined ? 0 : metrics.kerning[previous + character];
        if (advance === undefined || kern === undefined) {
            throw new Error('GUI text metrics do not cover this text');
        }
        return Math.fround(
            Math.fround(used + Math.fround(kern * scale)) + Math.fround(advance * scale),
        );
    }
    static #paragraphs(text: string): readonly string[] {
        return text.replace(/\r\n?/gu, '\n').split('\n');
    }
    static #whitespace(character: string): boolean {
        // Rust char::is_whitespace uses Unicode White_Space, excluding JavaScript's BOM.
        const code: number = character.codePointAt(0) ?? -1;
        return (
            (code >= 9 && code <= 13) ||
            code === 32 ||
            code === 133 ||
            /^[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]$/u.test(character)
        );
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
