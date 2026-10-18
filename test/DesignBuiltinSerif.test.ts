// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { createHash } from 'node:crypto';
import { create, type Font, type FontCollection } from 'fontkit';
import { expect, test } from 'vitest';
import { DesignBuiltinFonts } from '../src/design/DesignBuiltinFonts.js';
import { DesignSourceSerifBytes } from '../src/design/DesignSourceSerifBytes.js';
import type { DesignFontEngine } from '../src/design/DesignFontEngine.js';
import type { DesignTextSpanStyle } from '../src/design/DesignTextLayout.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import type { DesignDocument, DesignNode } from '../src/design/DesignTypes.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignSvgGeometry } from '../src/design/DesignSvgGeometry.js';
import { DesignSvg } from '../src/design/DesignSvg.js';
import { DesignSvgFonts } from '../src/design/DesignSvgFonts.js';
import {
    DesignSvgImportLayers,
    type DesignSvgLayerImport,
} from '../src/design/DesignSvgImportLayers.js';
import type { DesignSvgSelection, DesignSvgResult } from '../src/design/DesignSvgTypes.js';
import { DesignShapedTextMetrics } from '../src/design/DesignShapedTextMetrics.js';
import { DesignTextShaping } from '../src/design/DesignTextShaping.js';

interface SerifReference {
    readonly weight: number;
    readonly roman: number;
    readonly italic: number;
}

/** The upstream release defines the real variable range and optical-size default. */
class SerifFixture {
    /** Independent system HarfBuzz 8.3.0, ot font functions, opsz=20, scale=1000, text="Quiet weekends.". */
    public static readonly reference: readonly SerifReference[] = [
        { weight: 200, roman: 7309, italic: 6557 },
        { weight: 400, roman: 7334, italic: 6651 },
        { weight: 650, roman: 7496, italic: 7082 },
        { weight: 900, roman: 7650, italic: 7451 },
    ];

    public static style(italic: boolean, weight: number = 400): DesignTextSpanStyle {
        return {
            family: 'Source Serif 4',
            size: 32,
            weight,
            italic,
            color: '#123729',
            underline: false,
            rich: false,
        };
    }

    public static face(italic: boolean): Font {
        const parsed: Font | FontCollection = create(DesignSourceSerifBytes.read(italic));
        if (!('layout' in parsed)) {
            throw new Error('Expected the original standalone variable font');
        }
        return parsed;
    }
}

test('the shared serif uses exact upstream originals and real roman, italic and variable-weight shaping', async (): Promise<void> => {
    const expected: readonly string[] = [
        '14d360ee1b76655da9276628b229e11671bc1f5d1083636144db6677d452cf55',
        '6a059a64838978d54e8fab71ed86b0d82e948c0e12b2664d0c15166326dcff82',
    ];
    const engine: DesignFontEngine = await DesignBuiltinFonts.engine([], ['Source Serif 4']);
    for (const [index, italic] of [false, true].entries()) {
        expect(createHash('sha256').update(DesignSourceSerifBytes.read(italic)).digest('hex')).toBe(
            expected[index],
        );
        const face: Font = SerifFixture.face(italic);
        expect(face.variationAxes['wght']).toMatchObject({ min: 200, max: 900, default: 400 });
        expect(face.variationAxes['opsz']?.default).toBe(20);
        expect(face.unitsPerEm).toBe(1000);
        for (const reference of SerifFixture.reference) {
            const style: DesignTextSpanStyle = SerifFixture.style(italic, reference.weight);
            expect(engine.supports(style)).toBe(true);
            expect(engine.weightRange(style)).toEqual({ minimum: 200, maximum: 900 });
            expect(engine.variationDefault(style, 'opsz')).toBe(20);
            expect(engine.variationDefault(style, 'wdth')).toBeNull();
            expect(engine.variationDefault(style, 'constructor')).toBeNull();
            const advances: number = italic ? reference.italic : reference.roman;
            expect(engine.measure(style, 'Quiet weekends.')).toBeCloseTo(
                (advances / 1000) * style.size,
                8,
            );
        }
        expect(engine.supports(SerifFixture.style(italic, 199))).toBe(false);
        expect(engine.supports(SerifFixture.style(italic, 901))).toBe(false);
        expect(
            engine.supports({
                ...SerifFixture.style(italic),
                font: { id: 'private', sha256: 'a'.repeat(64) },
            }),
        ).toBe(false);
    }
});

test('requesting serif faces does not change the default public engine or silently provide unrelated system fonts', async (): Promise<void> => {
    const before: DesignFontEngine = await DesignBuiltinFonts.engine();
    expect(before.supports(SerifFixture.style(false))).toBe(false);
    await DesignBuiltinFonts.engine([], ['Source Serif 4']);
    const after: DesignFontEngine = await DesignBuiltinFonts.engine();
    expect(after).toBe(before);
    expect(after.supports(SerifFixture.style(false))).toBe(false);
    const extended: DesignFontEngine = await DesignBuiltinFonts.engine([], ['Source Serif 4']);
    expect(extended.supports({ ...SerifFixture.style(false), family: 'Georgia' })).toBe(false);
    expect(extended.supports({ ...SerifFixture.style(false), family: 'Inter' })).toBe(true);
});

test.each([false, true])(
    'serif-only exports embed one original face and reimport editable text without a private font upload, italic=%s',
    async (italic: boolean): Promise<void> => {
        const engine: DesignFontEngine = await DesignBuiltinFonts.engine([], ['Source Serif 4']);
        const metrics: DesignShapedTextMetrics = new DesignShapedTextMetrics(
            (style: DesignTextSpanStyle, content: string): number => engine.measure(style, content),
            DesignTextShaping.factory(engine),
        );
        const template: DesignNode = DesignDefaults.node('title', 'text');
        if (template.text === null) {
            throw new Error('Missing text template');
        }
        const title: DesignNode = {
            ...template,
            width: 600,
            height: 100,
            text: {
                ...template.text,
                content: 'Quiet weekends.',
                family: 'Source Serif 4',
                size: 32,
                weight: 650,
                italic,
            },
        };
        const base: DesignDocument = DesignDefaults.document('serif');
        const document: DesignDocument = {
            ...base,
            nodes: [title],
            pages: [{ id: 'page-1', name: 'Type', roots: ['title'], background: '#FFFFFF' }],
        };
        const selection: DesignSvgSelection = DesignSvgGeometry.select(
            new DesignLayoutEngine(document, 'page-1', metrics).solve(),
            ['title'],
        );
        const rendered: DesignSvgResult = DesignSvg.render(
            selection,
            new Map(),
            metrics.span,
            null,
            metrics.prepare,
        );
        const exported: DesignSvgResult = await DesignSvgFonts.embed(rendered, selection);
        expect(exported.svg.match(/data:font\/ttf;base64,/gu)).toHaveLength(1);
        expect(exported.svg.includes('data:font/woff2')).toBe(false);
        expect(exported.svg.includes('Copyright 2014 - 2023 Adobe')).toBe(true);
        const restored: DesignSvgLayerImport = await DesignSvgImportLayers.parse(
            exported.svg,
            'Restored serif',
            (key: string): string => key.replaceAll(':', '-'),
        );
        const text: DesignNode | undefined = restored.nodes.find(
            (node: DesignNode): boolean => node.text?.content === 'Quiet weekends.',
        );
        expect(text?.text).toMatchObject({
            family: 'Source Serif 4',
            size: 32,
            weight: 650,
            italic,
        });
        expect(text?.text?.font).toBeUndefined();
    },
);
