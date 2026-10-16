// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import { expect, test, vi } from 'vitest';
import { DesignBuiltinFonts } from '../src/design/DesignBuiltinFonts.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import type { DesignFontEngine } from '../src/design/DesignFontEngine.js';
import type {
    DesignFontRun,
    DesignFontRunStyle,
    DesignFontPaintGlyph,
} from '../src/design/DesignFontRun.js';
import {
    DesignTextLayout,
    type DesignTextLine,
    type DesignTextSegment,
    type DesignTextSpanStyle,
} from '../src/design/DesignTextLayout.js';
import { DesignTextShaping, type DesignTextRunFactory } from '../src/design/DesignTextShaping.js';
import type { DesignLogicalTextSpan } from '../src/design/DesignTextBidi.js';
import type { DesignText, DesignTextRun } from '../src/design/DesignTypes.js';

function text(content: string, split: number): DesignText {
    const template: DesignText | null = DesignDefaults.node('text', 'text').text;
    if (template === null) {
        throw new Error('Missing text template');
    }
    const run: DesignTextRun = {
        start: 0,
        end: split,
        family: template.family,
        size: 48,
        weight: template.weight,
        italic: false,
        color: '#FF0000',
        underline: true,
    };
    return { ...template, size: 48, content, runs: [run] };
}

function factory(engine: DesignFontEngine): DesignTextRunFactory {
    return (style: DesignFontRunStyle, content: string, tracking: number): DesignFontRun =>
        engine.run(style, content, tracking);
}

function lines(
    engine: DesignFontEngine,
    source: DesignText,
    width: number = 1000,
): readonly DesignTextLine[] {
    return DesignTextLayout.lines(
        source,
        '#0000FF',
        width,
        Infinity,
        (style: DesignTextSpanStyle, content: string): number => engine.measure(style, content),
        factory(engine),
    );
}

test.each(['العربية', 'AVATAR'])(
    'paint-only boundaries retain whole-word advances and original source for %s',
    async (content: string): Promise<void> => {
        const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
        const source: DesignText = text(content, 3);
        const before: string = JSON.stringify(source);
        const line: DesignTextLine | undefined = lines(engine, source)[0];
        const base: DesignTextLine | undefined = lines(engine, { ...source, runs: [] })[0];
        if (line === undefined || base === undefined) {
            throw new Error('Missing line');
        }
        expect(line.width).toBeCloseTo(base.width, 8);
        expect(line.segments).toHaveLength(2);
        expect(line.segments[0]?.prepared?.run).toBe(line.segments[1]?.prepared?.run);
        expect(line.segments[0]?.width ?? 0).toBeGreaterThan(0);
        expect(
            line.segments.reduce(
                (sum: number, segment: DesignTextSegment): number => sum + segment.width,
                0,
            ),
        ).toBeCloseTo(line.width, 8);
        expect(JSON.stringify(source)).toBe(before);
        expect((): string => JSON.stringify(line)).toThrow('stay local');
    },
);

test('wrapping shapes actual line fragments and counts tracking once across paint boundaries', async (): Promise<void> => {
    const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
    const source: DesignText = { ...text('AVATAR AVATAR AVATAR', 9), letterSpacing: 2 };
    const measured: readonly DesignTextLine[] = lines(engine, source, 240);
    const plain: readonly DesignTextLine[] = lines(engine, { ...source, runs: [] }, 240);
    expect(measured.map((line: DesignTextLine): number => line.width)).toEqual(
        plain.map((line: DesignTextLine): number => line.width),
    );
    expect(measured.length).toBeGreaterThan(1);
    for (const line of measured) {
        const content: string = line.segments
            .map((segment: DesignTextSegment): string => segment.text)
            .join('');
        for (const segment of line.segments) {
            if (segment.prepared !== undefined) {
                expect(segment.prepared.run.content).toBe(content);
            }
        }
    }
});

test('font metrics, binding identity and nonadjacent source prevent paint grouping', (): void => {
    const style: DesignFontRunStyle = {
        rich: false,
        family: 'Inter',
        size: 20,
        weight: 400,
        italic: false,
        color: '#000000',
        underline: false,
        direction: 'ltr',
    };
    const cases: readonly DesignTextSpanStyle[] = [
        { ...style, size: 21 },
        { ...style, weight: 700 },
        { ...style, italic: true },
        { ...style, direction: 'rtl' },
        { ...style, family: 'Other' },
        { ...style, font: { id: 'private', sha256: 'a'.repeat(64) } },
    ];
    for (const other of cases) {
        const prepare: ReturnType<typeof vi.fn<DesignTextRunFactory>> = vi.fn((): null => null);
        DesignTextShaping.line(
            [
                { start: 0, text: 'A', style },
                { start: 1, text: 'V', style: other },
            ],
            0,
            (): number => 10,
            prepare,
        );
        expect(prepare).not.toHaveBeenCalled();
    }
    const prepare: ReturnType<typeof vi.fn<DesignTextRunFactory>> = vi.fn((): null => null);
    const spans: readonly DesignLogicalTextSpan[] = [
        { start: 0, text: 'A', style },
        { start: 4, text: 'V', style },
    ];
    DesignTextShaping.line(spans, 0, (): number => 10, prepare);
    expect(prepare).not.toHaveBeenCalled();
});

test.each([false, true])(
    'source slices split one ffi ligature at font carets without reshaping, rtl=%s',
    async (rtl: boolean): Promise<void> => {
        const engine: DesignFontEngine = await DesignBuiltinFonts.engine([
            {
                family: 'Nexa Caret Fixture',
                weight: 400,
                italic: false,
                bytes: readFileSync(
                    new URL('./fixtures/design-font-runs/NexaCaretFixture.woff2', import.meta.url),
                ),
            },
        ]);
        const selected: DesignFontRunStyle = {
            rich: false,
            family: 'Nexa Caret Fixture',
            size: 48,
            weight: 400,
            italic: false,
            color: '#000000',
            underline: false,
            direction: rtl ? 'rtl' : 'ltr',
        };
        const run: DesignFontRun = engine.run(selected, rtl ? 'iff' : 'ffi');
        const whole: readonly DesignFontPaintGlyph[] = [...run.paint(0, 3, 10, 60)];
        expect(whole).toHaveLength(1);
        expect(whole[0]?.clip).toBeUndefined();
        const intervals: readonly number[] = rtl ? [3, 2, 1, 0] : [0, 1, 2, 3];
        const cuts: readonly number[] = [
            10,
            10 + (200 * 48) / 2048,
            10 + (1200 * 48) / 2048,
            10 + (1980 * 48) / 2048,
        ];
        for (let index: number = 0; index < 3; index++) {
            const a: number = intervals[index] ?? 0;
            const b: number = intervals[index + 1] ?? 0;
            const glyph: DesignFontPaintGlyph | undefined = [
                ...run.paint(Math.min(a, b), Math.max(a, b), 10, 60),
            ][0];
            expect(glyph?.glyphId).toBe(whole[0]?.glyphId);
            expect(glyph?.x).toBe(whole[0]?.x);
            expect(glyph?.clip).toEqual({
                left: index === 0 ? null : cuts[index],
                right: index === 2 ? null : cuts[index + 1],
            });
        }
    },
);

test('complete italic glyph clusters preserve overhang and invisible source never clips an exterior edge', async (): Promise<void> => {
    const engine: DesignFontEngine = await DesignBuiltinFonts.engine();
    const style: DesignFontRunStyle = {
        rich: false,
        family: 'Inter',
        size: 48,
        weight: 400,
        italic: true,
        color: '#000000',
        underline: false,
        direction: 'ltr',
    };
    const run: DesignFontRun = engine.run(style, 'jA', -2);
    const glyphs: readonly DesignFontPaintGlyph[] = [...run.glyphs(20, 60)];
    expect(glyphs[0]?.bounds.x ?? 20).toBeLessThan(20);
    expect([...run.paint(0, 1, 20, 60)]).toEqual(glyphs.slice(0, 1));
    expect([...run.paint(1, 2, 20, 60)]).toEqual(glyphs.slice(1));
    const hidden: DesignFontRun = engine.run(style, '\u200BjA\u200B');
    expect([...hidden.paint(0, 1, 20, 60)]).toEqual([]);
    expect([...hidden.paint(1, 3, 20, 60)]).toEqual([...hidden.glyphs(20, 60)]);
    const overlapping: DesignFontRun = engine.run(style, 'AA', -engine.measure(style, 'AA'));
    expect(overlapping.width).toBe(0);
    expect([...overlapping.paint(0, 2, 20, 60)]).toEqual([...overlapping.glyphs(20, 60)]);
});

test('tracking selects the same physical ligature policy before and after a paint-only change', async (): Promise<void> => {
    const engine: DesignFontEngine = await DesignBuiltinFonts.engine([
        {
            family: 'Nexa Caret Fixture',
            weight: 400,
            italic: false,
            bytes: readFileSync(
                new URL('./fixtures/design-font-runs/NexaCaretFixture.woff2', import.meta.url),
            ),
        },
    ]);
    const template: DesignText = text('ffi', 1);
    const source: DesignText = {
        ...template,
        family: 'Nexa Caret Fixture',
        letterSpacing: 2,
        runs: template.runs.map((run: DesignTextRun): DesignTextRun => ({
            ...run,
            family: 'Nexa Caret Fixture',
        })),
    };
    const painted: readonly DesignTextLine[] = lines(engine, source);
    const plain: readonly DesignTextLine[] = lines(engine, { ...source, runs: [] });
    expect(painted[0]?.width).toBe(plain[0]?.width);
    expect(lines(engine, source, 51)).toHaveLength(
        lines(engine, { ...source, runs: [] }, 51).length,
    );
});
