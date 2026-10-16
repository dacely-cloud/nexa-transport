// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi, type MockInstance } from 'vitest';
import { DesignBuiltinFonts } from '../src/design/DesignBuiltinFonts.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignFontBindings } from '../src/design/DesignFontBindings.js';
import type { DesignFontEngine } from '../src/design/DesignFontEngine.js';
import type { DesignFontRun, DesignFontRunStyle } from '../src/design/DesignFontRun.js';
import { DesignHarfBuzz } from '../src/design/DesignHarfBuzz.js';
import type { DesignFontGlyph, DesignGlyphBounds } from '../src/design/DesignFontGlyphTypes.js';

function style(rtl: boolean = false): DesignFontRunStyle {
    const node: ReturnType<typeof DesignDefaults.node> = DesignDefaults.node('caption', 'text');
    if (node.text === null) {
        throw new Error('Missing text template');
    }
    return {
        ...DesignFontBindings.base(node.text, '#000000'),
        size: 32,
        direction: rtl ? 'rtl' : 'ltr',
    };
}
afterEach((): void => {
    vi.restoreAllMocks();
});

test('prepared Arabic paint ranges retain joined glyphs and physical source positions without shaping again', async (): Promise<void> => {
    const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
    const selected: DesignFontRunStyle = style(true);
    const content = 'العربية' as const;
    const original: readonly DesignFontGlyph[] = [...engine.glyphs(selected, content, 7, 50, 0)];
    const isolated: readonly DesignFontGlyph[] = [
        ...engine.glyphs(selected, content.slice(0, 3), 7, 50, 0),
        ...engine.glyphs(selected, content.slice(3), 7, 50, 0),
    ];
    expect(original.map((glyph: DesignFontGlyph): number => glyph.glyphId)).not.toEqual(
        isolated.map((glyph: DesignFontGlyph): number => glyph.glyphId),
    );
    const run: DesignFontRun = engine.run(selected, content);
    expect(run.width).toBeCloseTo(engine.measure(selected, content), 8);
    expect(Object.isFrozen(run.style)).toBe(true);
    const shaper: MockInstance<typeof DesignHarfBuzz.shape> = vi.spyOn(DesignHarfBuzz, 'shape');
    expect([...run.glyphs(7, 50)]).toEqual(original);
    expect(run.slice(0, 3).width + run.slice(3, content.length).width).toBeCloseTo(run.width, 8);
    expect(run.slice(0, 3).x).toBeGreaterThan(run.slice(3, content.length).x);
    expect(run.caret(0)).toBeCloseTo(run.width, 8);
    expect(run.caret(content.length)).toBe(0);
    expect([...run.glyphs(7, 50)]).toEqual(original);
    expect(shaper).not.toHaveBeenCalled();
    expect((): string => JSON.stringify({ runs: [run] })).toThrow('stay local');
});

test.each([false, true])(
    'prepared ranges span original fallback faces and preserve combining and emoji boundaries, rtl=%s',
    async (rtl: boolean): Promise<void> => {
        const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
        const selected: DesignFontRunStyle = style(rtl);
        const content = 'AV שָׁ 👨‍👩‍👧‍👦 العربية' as const;
        const run: DesignFontRun = engine.run(selected, content);
        expect(run.width).toBeCloseTo(engine.measure(selected, content), 8);
        expect([...run.glyphs(0, 40)]).toEqual([...engine.glyphs(selected, content, 0, 40, 0)]);
        const offsets: readonly number[] = [
            ...Array.from(
                new Intl.Segmenter('und', { granularity: 'grapheme' }).segment(content),
                (entry: Intl.SegmentData): number => entry.index,
            ),
            content.length,
        ];
        let sum: number = 0;
        for (let index: number = 1; index < offsets.length; index++) {
            const start: number | undefined = offsets[index - 1];
            const end: number | undefined = offsets[index];
            if (start === undefined || end === undefined) {
                throw new Error('Missing grapheme range');
            }
            sum += run.slice(start, end).width;
        }
        expect(sum).toBeCloseTo(run.width, 8);
        expect((): number => run.caret(4)).toThrow('grapheme boundary');
        expect((): number => run.caret(content.indexOf('👨') + 1)).toThrow('grapheme boundary');
    },
);

test('tracked width excludes the final interval while prepared glyph placement and viewport rejection stay exact', async (): Promise<void> => {
    const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
    const selected: DesignFontRunStyle = style();
    const run: DesignFontRun = engine.run(selected, 'AV', 3);
    expect(run.width).toBeCloseTo(engine.measure(selected, 'AV') + 3, 8);
    expect(run.slice(0, 1).width + run.slice(1, 2).width).toBeCloseTo(run.width, 8);
    const window: DesignGlyphBounds = { x: 25, y: 0, width: 8, height: 60 };
    expect([...run.glyphs(0, 40, window)]).toEqual([
        ...engine.glyphs(selected, 'AV', 0, 40, 3, window),
    ]);
    expect([...run.glyphs(0, 40, { x: 1000, y: 1000, width: 10, height: 10 })]).toEqual([]);
    expect(engine.run(selected, '', 3).width).toBe(0);
    expect(engine.run(selected, ' ', 3).width).toBeCloseTo(engine.measure(selected, ' '), 8);
    expect((): DesignFontRun => engine.run(selected, 'A', Infinity)).toThrow('finite');
    expect((): ReturnType<DesignFontRun['slice']> => run.slice(2, 1)).toThrow('reversed');
});

test('whole-run cuts keep every Latin glyph and total width across potential ligatures', async (): Promise<void> => {
    const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
    const selected: DesignFontRunStyle = style();
    const run: DesignFontRun = engine.run(selected, 'office ffi');
    let width: number = 0;
    for (let index: number = 0; index < run.content.length; index++) {
        width += run.slice(index, index + 1).width;
    }
    expect(width).toBeCloseTo(run.width, 8);
    expect([...run.glyphs(0, 40)]).toEqual([...engine.glyphs(selected, run.content, 0, 40, 0)]);
});

test.each([false, true])(
    'explicit GDEF caret positions override equal ligature fractions, rtl=%s',
    async (rtl: boolean): Promise<void> => {
        const bytes: Uint8Array = readFileSync(
            new URL('./fixtures/design-font-runs/NexaCaretFixture.woff2', import.meta.url),
        );
        const engine: DesignFontEngine = await DesignBuiltinFonts.engine([
            { family: 'Nexa Caret Fixture', weight: 400, italic: false, bytes },
        ]);
        const selected: DesignFontRunStyle = { ...style(rtl), family: 'Nexa Caret Fixture' };
        const run: DesignFontRun = engine.run(selected, rtl ? 'iff' : 'ffi');
        expect([...run.glyphs(0, 40)]).toHaveLength(1);
        const hidden: DesignFontRun = engine.run(selected, rtl ? 'i\u00adff' : 'f\u00adfi');
        expect([...hidden.glyphs(0, 40)]).toHaveLength(1);
        expect(hidden.caret(1)).toBeCloseTo(run.caret(1), 8);
        expect(hidden.caret(2)).toBeCloseTo(run.caret(1), 8);
        expect(hidden.caret(3)).toBeCloseTo(run.caret(2), 8);
        expect(run.width).toBeCloseTo((1980 * 32) / 2048, 8);
        expect(run.caret(1)).toBeCloseTo(((rtl ? 1200 : 200) * 32) / 2048, 8);
        expect(run.caret(2)).toBeCloseTo(((rtl ? 200 : 1200) * 32) / 2048, 8);
        expect(run.slice(0, 1).width + run.slice(1, 2).width + run.slice(2, 3).width).toBeCloseTo(
            run.width,
            8,
        );
    },
);

test('physical script and fallback boundaries share the complete glyph budget', async (): Promise<void> => {
    const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
    const content: string = 'A'.repeat(60000) + 'العربية'.repeat(5000);
    expect(content.length).toBeLessThanOrEqual(100000);
    expect((): DesignFontRun => engine.run(style(), content)).toThrow('shaping glyph budget');
    expect(engine.run(style(), 'AV').width).toBeCloseTo(engine.measure(style(), 'AV'), 8);
});

test.each(['\u00ad', '\u200b', '\u2060'])(
    'invisible source %j preserves caret positions and consumes no paint interval',
    async (ignored: string): Promise<void> => {
        const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
        for (const rtl of [false, true]) {
            const selected: DesignFontRunStyle = style(rtl);
            const baseline: DesignFontRun = engine.run(selected, 'AB');
            const run: DesignFontRun = engine.run(selected, 'A' + ignored + 'B');
            expect(run.width).toBeCloseTo(baseline.width, 8);
            expect(run.caret(1)).toBeCloseTo(baseline.caret(1), 8);
            expect(run.caret(2)).toBeCloseTo(baseline.caret(1), 8);
            expect(run.slice(1, 2).width).toBe(0);
            expect([...run.glyphs(0, 40)]).toEqual([...baseline.glyphs(0, 40)]);
            const padded: DesignFontRun = engine.run(selected, ignored + 'AB' + ignored);
            expect(padded.caret(0)).toBeCloseTo(baseline.caret(0), 8);
            expect(padded.caret(1)).toBeCloseTo(baseline.caret(0), 8);
            expect(padded.caret(3)).toBeCloseTo(baseline.caret(2), 8);
            expect(padded.caret(4)).toBeCloseTo(baseline.caret(2), 8);
            const empty: DesignFontRun = engine.run(selected, ignored);
            expect(empty.slice(0, 1).width).toBe(0);
            expect([...empty.glyphs(0, 40)]).toEqual([]);
        }
    },
);

test('untyped callers must resolve paragraph direction before preparing a run', async (): Promise<void> => {
    const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
    const prepare: DesignFontEngine['run'] = engine.run.bind(engine);
    expect((): void => {
        Reflect.apply(prepare, undefined, [{ ...style(), direction: undefined }, 'العربية']);
    }).toThrow('resolved text direction');
});
