// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import { DesignScene } from '../src/design/DesignScene.js';
import { DesignTextStyles } from '../src/design/DesignTextStyles.js';
import { DesignTokenEdits } from '../src/design/DesignTokenEdits.js';
import { DesignRecolorEdits } from '../src/design/DesignRecolorEdits.js';
import { DesignSelectionIndex } from '../src/design/DesignSelectionIndex.js';
import { DesignClipboardCapture } from '../src/design/DesignClipboardSnapshot.js';
import { DesignTransfer } from '../src/design/DesignTransfer.js';
import { DesignTextMetrics } from '../src/design/DesignTextMetrics.js';
import { DesignScaleMetrics } from '../src/design/DesignScaleMetrics.js';
import { DesignFreeze } from '../src/design/DesignFreeze.js';
import { DesignBuiltinFonts } from '../src/design/DesignBuiltinFonts.js';
import { DesignTextOutline } from '../src/design/DesignTextOutline.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import type {
    DesignDocument,
    DesignNode,
    DesignPaint,
    DesignText,
} from '../src/design/DesignTypes.js';

function fixture(): DesignDocument {
    const node: DesignNode = DesignDefaults.node('caption', 'text');
    if (node.text === null) {
        throw new Error('Missing text default');
    }
    const fills: readonly DesignPaint[] = [
        { ...DesignDefaults.paint('#000000'), tokenId: 'brand' },
        {
            ...DesignDefaults.paint(),
            kind: 'radial',
            opacity: 0.6,
            stops: [
                { offset: 0, color: '#112233' },
                { offset: 1, color: '#AABBCC' },
            ],
        },
    ];
    return DesignCodec.document({
        ...DesignDefaults.document('source'),
        pages: [{ id: 'page-1', name: 'Page', background: '#FFFFFF', roots: [node.id] }],
        tokens: [{ id: 'brand', name: 'Brand', category: 'color', value: '#CC3366' }],
        nodes: [
            {
                ...node,
                width: 300,
                height: 100,
                text: DesignTextStyles.apply(
                    {
                        ...node.text,
                        content: 'AV Dogs 🐕',
                    },
                    0,
                    2,
                    { fills },
                ),
            },
        ],
    });
}

function caption(document: DesignDocument): DesignText {
    const text: DesignText | null | undefined = document.nodes[0]?.text;
    if (text == null) {
        throw new Error('Missing caption');
    }
    return text;
}

test('range tokens resolve, recolor, detach and undo without rewriting source or unrelated paints', (): void => {
    const source: DesignDocument = fixture();
    const before: string = JSON.stringify(source);
    expect(DesignTokenEdits.references(source, 'brand')).toBe(1);
    expect(DesignScene.page(source, 'page-1').nodes[0]?.text?.runs[0]?.fills?.[0]?.color).toBe(
        '#CC3366',
    );
    const index: DesignSelectionIndex = new DesignSelectionIndex(source, 'page-1', ['caption']);
    expect(DesignRecolorEdits.groups(index)).toEqual(
        expect.arrayContaining([
            { color: '#CC3366', layers: 1 },
            { color: '#112233', layers: 1 },
        ]),
    );
    const recolored: readonly DesignNode[] = DesignRecolorEdits.replace(
        index,
        '#CC3366',
        '#00AA66',
    );
    expect(recolored[0]?.text?.runs[0]?.fills?.[0]).toMatchObject({
        tokenId: null,
        color: '#00AA66',
    });
    expect(recolored[0]?.text?.runs[0]?.fills?.[1]).toEqual(caption(source).runs[0]?.fills?.[1]);
    expect(recolored[0]?.text?.content).toBe(caption(source).content);
    const detached: ReturnType<typeof DesignEdits.apply> = DesignEdits.apply(source, [
        { op: 'token', id: 'brand', changes: null },
    ]);
    expect(caption(detached.document).runs[0]?.fills?.[0]).toMatchObject({
        tokenId: null,
        color: '#CC3366',
    });
    expect(caption(detached.document).content).toBe(caption(source).content);
    expect(DesignEdits.restore(detached.document, detached.changes).document).toEqual(source);
    expect(JSON.stringify(source)).toBe(before);
});

test('copy-time capture and cross-document reuse preserve range paints and remap their token dependencies', (): void => {
    const source: DesignDocument = fixture();
    const metrics: DesignTextMetrics = new DesignTextMetrics();
    const snapshot: ReturnType<typeof DesignClipboardCapture.create> =
        DesignClipboardCapture.create(source, 'page-1', ['caption'], metrics);
    expect(snapshot.document.tokens).toEqual(source.tokens);
    const result: ReturnType<typeof DesignTransfer.apply> = DesignTransfer.apply(
        snapshot.document,
        DesignDefaults.document('target'),
        {
            id: 'target',
            expectedRevision: '1',
            commandId: 'copy',
            sourceId: 'source',
            sourceRevision: '1',
            sourcePageId: 'page-1',
            selection: ['caption'],
            pageId: 'page-1',
            parentId: null,
            x: 10,
            y: 20,
        },
        (key: string): string => key.replaceAll(':', '-'),
        metrics,
    );
    expect(result.document.tokens).toMatchObject([{ id: 'token-brand', value: '#CC3366' }]);
    expect(caption(result.document).content).toBe(caption(source).content);
    expect(caption(result.document).runs[0]?.fills?.[0]?.tokenId).toBe('token-brand');
    expect(
        DesignScene.page(result.document, 'page-1').nodes[0]?.text?.runs[0]?.fills?.[0]?.color,
    ).toBe('#CC3366');
    expect(caption(result.document).runs[0]?.fills?.[1]).toEqual(
        caption(source).runs[0]?.fills?.[1],
    );
});

test('range stacks survive immutable snapshots and uniform text scaling without shifting source intervals', (): void => {
    const source: DesignDocument = fixture();
    const scaled: DesignText = DesignScaleMetrics.text(caption(source), 2);
    expect(scaled.runs[0]).toMatchObject({ start: 0, end: 2, size: caption(source).size * 2 });
    expect(scaled.runs[0]?.fills).toEqual(caption(source).runs[0]?.fills);
    expect(scaled.content).toBe(caption(source).content);
    const frozen: DesignDocument = DesignFreeze.document(source);
    const paints: readonly DesignPaint[] | null | undefined = caption(frozen).runs[0]?.fills;
    expect(Object.isFrozen(paints)).toBe(true);
    expect(Object.isFrozen(paints?.[1]?.stops[0])).toBe(true);
});

test('intentional outlining retains the range stack on editable glyph paths and undoes exactly', async (): Promise<void> => {
    const source: DesignDocument = fixture();
    const fonts: Awaited<ReturnType<typeof DesignBuiltinFonts.engine>> =
        await DesignBuiltinFonts.engine();
    const plan: ReturnType<typeof DesignTextOutline.plan> = DesignTextOutline.plan(
        source,
        'page-1',
        ['caption'],
        fonts,
        (key: string): string => key.replaceAll(':', '-'),
    );
    const result: ReturnType<typeof DesignEdits.apply> = DesignEdits.apply(source, plan.operations);
    const vectors: readonly DesignNode[] = result.document.nodes.filter(
        (node: DesignNode): boolean => node.kind === 'path',
    );
    expect(vectors.length).toBeGreaterThan(1);
    expect(
        vectors.some(
            (node: DesignNode): boolean =>
                JSON.stringify(node.style.fills) === JSON.stringify(caption(source).runs[0]?.fills),
        ),
    ).toBe(true);
    expect(DesignEdits.restore(result.document, result.changes).document).toEqual(source);
});
