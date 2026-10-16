// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Physical face changes share one run-wide allocation budget rather than multiplying per-face limits. */
export class DesignFontShapeBudget {
    #glyphs: number = 100000;
    #carets: number = 100000;

    /** Ordinary measurement and glyph streaming do not request ligature caret data. */
    public constructor(public readonly collectCarets: boolean = false) {}

    /** Check the aggregate before allocating the next physical run's shaped glyph records. */
    public glyphs(count: number): void {
        if (!Number.isInteger(count) || count < 0 || count > this.#glyphs) {
            throw new Error('Text exceeds the shaping glyph budget.');
        }
        this.#glyphs -= count;
    }

    /** Shared caret arrays are charged once before native scratch or JavaScript output allocation. */
    public carets(count: number): void {
        if (!Number.isInteger(count) || count < 0 || count > this.#carets) {
            throw new Error('Prepared text exceeds the ligature caret data budget.');
        }
        this.#carets -= count;
    }
}
