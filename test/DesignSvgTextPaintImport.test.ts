// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import {
    DesignSvgImportLayers,
    type DesignSvgLayerImport,
} from '../src/design/DesignSvgImportLayers.js';
import type { DesignNode } from '../src/design/DesignTypes.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignSvg } from '../src/design/DesignSvg.js';
import { DesignSvgGeometry } from '../src/design/DesignSvgGeometry.js';
import type { DesignTextSpanStyle } from '../src/design/DesignTextLayout.js';
import { DesignBuiltinFonts } from '../src/design/DesignBuiltinFonts.js';
import { DesignTextShaping } from '../src/design/DesignTextShaping.js';

const definitions: string =
    '<defs><linearGradient id="paint"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient><linearGradient id="other"><stop stop-color="green"/><stop offset="1" stop-color="yellow"/></linearGradient></defs>';

async function labels(body: string): Promise<readonly DesignNode[]> {
    const imported: DesignSvgLayerImport = await DesignSvgImportLayers.parse(
        '<svg width="400" height="240" font-family="Inter">' + definitions + body + '</svg>',
        'Painted text',
        (key: string): string => key.replaceAll(':', '-'),
    );
    return imported.nodes.filter((node: DesignNode): boolean => node.kind === 'text');
}

test('a shared gradient remains editable across typography and solid color spans', async (): Promise<void> => {
    const node: DesignNode | undefined = (
        await labels(
            '<text x="20" y="70" font-size="32" fill="url(#paint)">A <tspan font-weight="700">bold</tspan> <tspan fill="white" fill-opacity=".5">word</tspan></text>',
        )
    )[0];
    expect(node?.style.fills[0]).toMatchObject({
        kind: 'linear',
        stops: [{ color: '#FF0000' }, { color: '#0000FF' }],
    });
    expect(node?.text).toMatchObject({
        content: 'A bold word',
        runs: [
            { start: 2, end: 6, weight: 700, color: null },
            { start: 7, end: 11, color: '#FFFFFF80' },
        ],
    });
    expect(node?.path).toEqual([]);
});

test('a gradient on a child span retains one logical label and explicit surrounding solid colors', async (): Promise<void> => {
    const node: DesignNode | undefined = (
        await labels(
            '<text x="20" y="70" font-size="32" fill="black">A<tspan fill="url(#paint)">ffi</tspan>Z</text>',
        )
    )[0];
    expect(node?.text?.content).toBe('AffiZ');
    expect(node?.style.fills[0]?.kind).toBe('linear');
    expect(node?.text?.runs).toMatchObject([
        { start: 0, end: 1, color: '#000000' },
        { start: 4, end: 5, color: '#000000' },
    ]);
});

test('solid span opacity is independent of its inherited gradient fill opacity', async (): Promise<void> => {
    const node: DesignNode | undefined = (
        await labels(
            '<text fill="url(#paint)" fill-opacity=".25">A<tspan fill="white" fill-opacity="1">B</tspan></text>',
        )
    )[0];
    expect(node?.style.fills[0]).toMatchObject({
        kind: 'linear',
        opacity: 1,
        stops: [{ color: '#FF000040' }, { color: '#0000FF40' }],
    });
    expect(node?.text?.runs).toMatchObject([{ start: 1, end: 2, color: '#FFFFFF' }]);
});

test('a visible solid child of fill-none text remains editable and visible', async (): Promise<void> => {
    const node: DesignNode | undefined = (
        await labels('<text fill="none">A<tspan fill="white">B</tspan>Z</text>')
    )[0];
    expect(node?.style.fills[0]?.color).toBe('#FFFFFF');
    expect(node?.text?.runs).toMatchObject([
        { start: 0, end: 1, color: '#00000000' },
        { start: 2, end: 3, color: '#00000000' },
    ]);
});

test('positioned chunks share the entire text element gradient bounds', async (): Promise<void> => {
    const nodes: readonly DesignNode[] = await labels(
        '<text fill="url(#paint)" font-size="32"><tspan x="20" y="60">AAAA</tspan><tspan x="200" y="120">AAAA</tspan></text>',
    );
    expect(nodes).toHaveLength(2);
    const first: DesignNode | undefined = nodes[0];
    const second: DesignNode | undefined = nodes[1];
    if (first === undefined || second === undefined) {
        throw new Error('Missing chunks');
    }
    expect(first.style.fills[0]?.gradient?.endX).toBeGreaterThan(2);
    expect(second.style.fills[0]?.gradient?.startX).toBeLessThan(-1);
    expect(first.text?.content).toBe('AAAA');
    expect(second.text?.content).toBe('AAAA');
});

test('different gradient ranges reject atomically instead of replacing editable source with paths', async (): Promise<void> => {
    await expect(
        labels('<text fill="url(#paint)">A<tspan fill="url(#other)">B</tspan></text>'),
    ).rejects.toThrow('multiple gradient');
    await expect(
        labels('<text fill="url(#paint)">A<tspan fill-opacity=".5">B</tspan></text>'),
    ).rejects.toThrow('multiple gradient');
});

test.each(['start', 'middle', 'end'])(
    'RTL text preserves source and its %s anchor with an inherited gradient',
    async (anchor: string): Promise<void> => {
        const node: DesignNode | undefined = (
            await labels(
                '<text x="300" y="70" direction="rtl" text-anchor="' +
                    anchor +
                    '" font-size="32" fill="url(#paint)">العربية</text>',
            )
        )[0];
        if (node === undefined) {
            throw new Error('Missing RTL label');
        }
        expect(node.text).toMatchObject({ content: 'العربية', direction: 'rtl', runs: [] });
        expect(node.style.fills[0]?.kind).toBe('linear');
        expect(
            node.x + node.width * (anchor === 'start' ? 1 : anchor === 'middle' ? 0.5 : 0),
        ).toBeCloseTo(300, 8);
    },
);

test('ordinary native gradient text exports reimport with editable source and identical paint geometry', async (): Promise<void> => {
    const node: DesignNode | undefined = (
        await labels(
            '<text x="20" y="70" font-size="32" fill="url(#paint)">A <tspan font-weight="700">bold</tspan> word</text>',
        )
    )[0];
    if (node === undefined) {
        throw new Error('Missing gradient label');
    }
    const base: ReturnType<typeof DesignDefaults.document> = DesignDefaults.document('roundtrip');
    const document: typeof base = {
        ...base,
        nodes: [{ ...node, parentId: null }],
        pages: base.pages.map((page): typeof page => ({ ...page, roots: [node.id] })),
    };
    const fonts: Awaited<ReturnType<typeof DesignBuiltinFonts.engine>> =
        await DesignBuiltinFonts.engine();
    const scene: ReturnType<DesignLayoutEngine['solve']> = new DesignLayoutEngine(
        document,
        'page-1',
    ).solve();
    const selection: ReturnType<typeof DesignSvgGeometry.select> = DesignSvgGeometry.select(scene, [
        node.id,
    ]);
    const exported: ReturnType<typeof DesignSvg.render> = DesignSvg.render(
        selection,
        new Map(),
        (style: DesignTextSpanStyle, content: string): number => fonts.measure(style, content),
        null,
        DesignTextShaping.factory(fonts),
    );
    const imported: DesignSvgLayerImport = await DesignSvgImportLayers.parse(
        exported.svg,
        'Reimport',
        (key: string): string => key.replaceAll(':', '-'),
    );
    const text: readonly DesignNode[] = imported.nodes.filter(
        (value: DesignNode): boolean => value.kind === 'text',
    );
    expect(text.map((value: DesignNode): string => value.text?.content ?? '').join('')).toBe(
        node.text?.content,
    );
    expect(
        text.every((value: DesignNode): boolean => value.style.fills[0]?.kind === 'linear'),
    ).toBe(true);
    const reimported: typeof document = {
        ...base,
        nodes: imported.nodes,
        pages: base.pages.map((page): typeof page => ({ ...page, roots: [imported.rootId] })),
    };
    const result: ReturnType<DesignLayoutEngine['solve']> = new DesignLayoutEngine(
        reimported,
        'page-1',
    ).solve();
    const originalGradient:
        NonNullable<DesignNode['style']['fills'][number]['gradient']> | undefined =
        node.style.fills[0]?.gradient ?? undefined;
    if (originalGradient === undefined) {
        throw new Error('Missing original paint geometry');
    }
    for (const label of text) {
        const box: (typeof scene.boxes)[number] | undefined = result.boxes.find(
            (value): boolean => value.id === label.id,
        );
        const gradient: typeof originalGradient | undefined =
            label.style.fills[0]?.gradient ?? undefined;
        if (box === undefined || gradient === undefined) {
            throw new Error('Missing imported gradient geometry');
        }
        expect(box.x + gradient.startX * box.width).toBeCloseTo(
            node.x + originalGradient.startX * node.width - selection.x,
            5,
        );
        expect(box.y + gradient.startY * box.height).toBeCloseTo(
            node.y + originalGradient.startY * node.height - selection.y,
            5,
        );
        expect(box.x + gradient.endX * box.width).toBeCloseTo(
            node.x + originalGradient.endX * node.width - selection.x,
            5,
        );
        expect(box.y + gradient.endY * box.height).toBeCloseTo(
            node.y + originalGradient.endY * node.height - selection.y,
            5,
        );
    }
});

test('a bidi override that would reverse Latin source rejects rather than inserting hidden source controls', async (): Promise<void> => {
    await expect(
        labels('<text direction="rtl" unicode-bidi="bidi-override">Latin</text>'),
    ).rejects.toThrow('logical ordering');
    await expect(
        labels('<text direction="ltr">A<tspan direction="rtl">العربية</tspan>Z</text>'),
    ).rejects.toThrow('inline direction');
});
