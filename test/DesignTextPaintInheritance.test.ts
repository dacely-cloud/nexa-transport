// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignTextStyles } from '../src/design/DesignTextStyles.js';
import { DesignStyleCodec } from '../src/design/DesignStyleCodec.js';
import { DesignFontBindings } from '../src/design/DesignFontBindings.js';
import { DesignRecolorEdits } from '../src/design/DesignRecolorEdits.js';
import { DesignSelectionIndex } from '../src/design/DesignSelectionIndex.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignBuiltinFonts } from '../src/design/DesignBuiltinFonts.js';
import { DesignTextLayout, type DesignTextSpanStyle } from '../src/design/DesignTextLayout.js';
import { DesignTextShaping } from '../src/design/DesignTextShaping.js';
import { DesignTextGlyphs } from '../src/design/DesignTextGlyphs.js';
import type { DesignFontEngine } from '../src/design/DesignFontEngine.js';
import type { DesignFontPaintGlyph } from '../src/design/DesignFontRun.js';
import type { DesignDocument, DesignNode, DesignText } from '../src/design/DesignTypes.js';

function source(): DesignText {
    const text: DesignText | null = DesignDefaults.node('text', 'text').text;
    if (text === null) {
        throw new Error('Missing text template');
    }
    return { ...text, content: 'Alpha bravo' };
}

test('font and underline patches inherit the layer paint without manufacturing a solid override', (): void => {
    const original: DesignText = source();
    const bold: DesignText = DesignTextStyles.apply(original, 0, 5, { weight: 700 });
    expect(bold.content).toBe(original.content);
    expect(bold.runs).toHaveLength(1);
    expect(bold.runs[0]).toMatchObject({ start: 0, end: 5, weight: 700, color: null });
    const run: DesignText['runs'][number] | undefined = bold.runs[0];
    if (run === undefined) {
        throw new Error('Missing formatted range');
    }
    expect(DesignFontBindings.run(bold, run).rich).toBe(false);
    const decorated: DesignText = DesignTextStyles.apply(bold, 1, 4, { underline: true });
    expect(decorated.runs[1]).toMatchObject({ weight: 700, underline: true, color: null });
    expect(DesignTextStyles.apply(decorated, 1, 4, { underline: true })).toBe(decorated);
    expect(DesignStyleCodec.text(JSON.parse(JSON.stringify(decorated)))).toEqual(decorated);
    expect(DesignTextStyles.apply(original, 0, 5, { weight: original.weight })).toBe(original);
});

test('resetting a selected color restores inheritance while preserving surrounding explicit overrides', (): void => {
    const original: DesignText = DesignTextStyles.apply(source(), 0, 11, {
        color: '#FF0000',
        italic: true,
    });
    const reset: DesignText = DesignTextStyles.apply(original, 2, 8, { color: null });
    expect(reset.content).toBe(original.content);
    expect(reset.runs.map((run): string | null => run.color)).toEqual(['#FF0000', null, '#FF0000']);
    expect(reset.runs.every((run): boolean => run.italic)).toBe(true);
    expect(DesignTextStyles.ranges(reset, 0, 11)).toEqual(reset.runs);
    expect((): DesignText => DesignTextStyles.apply(reset, 2, 8, { color: '' })).toThrow();
});

test('selection recoloring changes the layer fill while keeping inherited rich ranges linked to that fill', (): void => {
    const template: DesignDocument = DesignDefaults.document('inherit', 'Inherited paint');
    const node: DesignNode = {
        ...DesignDefaults.node('text', 'text'),
        text: DesignTextStyles.apply(source(), 0, 5, { weight: 700 }),
        style: { ...DesignDefaults.style('text'), fills: [DesignDefaults.paint('#FF0000')] },
    };
    const document: DesignDocument = {
        ...template,
        nodes: [node],
        pages: template.pages.map((page): typeof page => ({ ...page, roots: ['text'] })),
    };
    expect(
        DesignRecolorEdits.groups(new DesignSelectionIndex(document, 'page-1', ['text'])),
    ).toEqual([{ color: '#FF0000', layers: 1 }]);
    const changed: DesignDocument = DesignEdits.apply(document, [
        {
            op: 'recolor',
            pageId: 'page-1',
            selection: ['text'],
            before: '#FF0000',
            after: '#00FF00',
        },
    ]).document;
    expect(changed.nodes[0]?.text).toEqual(node.text);
    expect(changed.nodes[0]?.text?.runs[0]?.color).toBeNull();
    expect(changed.nodes[0]?.style.fills[0]?.color).toBe('#00FF00');
});

test('RTL inherited decorations retain source ranges while painting the whole directional run once', async (): Promise<void> => {
    const fonts: DesignFontEngine = await DesignBuiltinFonts.engine();
    const text: DesignText = DesignTextStyles.apply(
        { ...source(), content: 'العربية', size: 48 },
        0,
        3,
        { underline: true },
    );
    const line: ReturnType<typeof DesignTextLayout.lines>[number] | undefined =
        DesignTextLayout.lines(
            text,
            '#FF0000',
            500,
            Infinity,
            (style: DesignTextSpanStyle, content: string): number => fonts.measure(style, content),
            DesignTextShaping.factory(fonts),
        )[0];
    const first: NonNullable<typeof line>['segments'][number] | undefined = line?.segments[0];
    if (line === undefined || first === undefined) {
        throw new Error('Missing RTL paint');
    }
    expect(line.segments.map((segment): boolean => segment.style.underline)).toEqual([false, true]);
    const glyphs: readonly DesignFontPaintGlyph[] = line.segments.flatMap(
        (segment): readonly DesignFontPaintGlyph[] => [
            ...DesignTextGlyphs.paint(segment, fonts, 60, 0),
        ],
    );
    expect(glyphs).toEqual([...fonts.glyphs(first.style, text.content, 0, 60, 0)]);
    expect(glyphs.every((glyph: DesignFontPaintGlyph): boolean => glyph.clip === undefined)).toBe(
        true,
    );
    expect(text.runs[0]).toMatchObject({ start: 0, end: 3, underline: true, color: null });
});
