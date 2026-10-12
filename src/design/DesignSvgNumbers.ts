// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** SVG lexical numbers retain signs, scientific notation and adjacent signed coordinates. */
export class DesignSvgNumbers {
    public static readonly token: RegExp = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/u;
    /** Accepts comma-wsp separators but never ignores trailing garbage. */
    public static list(source: string, maximum: number = 10000): readonly number[] {
        const values: number[] = [];
        let offset: number = 0;
        let comma: boolean = false;
        while (offset < source.length) {
            const char: string = source[offset] ?? '';
            if (/\s/u.test(char)) {
                offset++;
                continue;
            }
            if (char === ',') {
                if (values.length === 0 || comma) {
                    throw new Error('Invalid SVG number separator.');
                }
                comma = true;
                offset++;
                continue;
            }
            const match: RegExpMatchArray | null = this.token.exec(source.slice(offset));
            const raw: string | undefined = match?.[0];
            if (raw === undefined) {
                throw new Error('Invalid SVG number near ' + source.slice(offset, offset + 20));
            }
            const value: number = Number(raw);
            if (!Number.isFinite(value) || Math.abs(value) > 100000000) {
                throw new Error('SVG number is outside the supported range.');
            }
            values.push(value);
            if (values.length > maximum) {
                throw new Error('SVG exceeds its numeric coordinate budget.');
            }
            offset += raw.length;
            comma = false;
        }
        if (comma) {
            throw new Error('Trailing SVG number separator.');
        }
        return values;
    }
    /** Absolute CSS lengths use SVG's 96 dpi conversion. Percentages need the caller's current viewport. */
    public static length(source: string, reference: number, fallback: number = 0): number {
        if (source.trim() === '') {
            return fallback;
        }
        const value: string = source.trim();
        const match: RegExpMatchArray | null = this.token.exec(value);
        const raw: string | undefined = match?.[0];
        if (raw === undefined) {
            throw new Error('Invalid SVG length ' + source);
        }
        const unit: string = value.slice(raw.length);
        const scales: Readonly<Record<string, number>> = {
            '': 1,
            px: 1,
            in: 96,
            cm: 96 / 2.54,
            mm: 96 / 25.4,
            q: 96 / 101.6,
            pt: 96 / 72,
            pc: 16,
            '%': reference / 100,
        };
        const scale: number | undefined = scales[unit];
        const result: number = Number(raw) * (scale ?? 0);
        if (scale === undefined || !Number.isFinite(result) || Math.abs(result) > 1000000) {
            throw new Error('Unsupported SVG length ' + source);
        }
        return result;
    }
}
