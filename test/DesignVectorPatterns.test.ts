// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignPatternSources } from '../src/design/DesignPatternSources.js';
import { DesignPatternReferences } from '../src/design/DesignPatternReferences.js';
import { DesignPatternGeometry } from '../src/design/DesignPatternGeometry.js';
import { DesignSvgGeometry } from '../src/design/DesignSvgGeometry.js';
import { DesignSvg } from '../src/design/DesignSvg.js';
import { DesignSvgFonts } from '../src/design/DesignSvgFonts.js';
import { DesignSvgSelections } from '../src/design/DesignSvgSelections.js';
import { DesignSelectionTree } from '../src/design/DesignSelectionTree.js';
import { DesignSelectionContext } from '../src/design/DesignSelectionContext.js';
import { DesignTransfer } from '../src/design/DesignTransfer.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import { DesignStyleCodec } from '../src/design/DesignStyleCodec.js';
import { DesignScaleMetrics } from '../src/design/DesignScaleMetrics.js';
import type { DesignDocument, DesignNode, DesignPaint } from '../src/design/DesignTypes.js';
import type { DesignSize } from '../src/design/DesignLayoutTypes.js';
import type { DesignSvgSelection } from '../src/design/DesignSvgTypes.js';
import type { DesignSelectionPlan } from '../src/design/DesignSelectionTypes.js';
import type { DesignEditResult, DesignOperation } from '../src/design/DesignOperationTypes.js';

function paint(id: string): DesignPaint {
    return { ...DesignDefaults.paint(), kind: 'pattern', patternId: id };
}
function fixture(): DesignDocument {
    const text: DesignNode = DesignDefaults.node('letter', 'text');
    if (text.text === null) {
        throw new Error('Missing text defaults');
    }
    const motif: DesignNode = {
        ...DesignDefaults.node('motif', 'component'),
        x: 400,
        y: 600,
        width: 16,
        height: 12,
        children: ['dot', text.id],
        style: { ...DesignDefaults.style('component'), fills: [] },
    };
    const target: DesignNode = {
        ...DesignDefaults.node('target', 'rectangle'),
        width: 160,
        height: 96,
        style: {
            ...DesignDefaults.style('rectangle'),
            fills: [paint(motif.id)],
            stroke: { paint: paint(motif.id), width: 2, dash: [] },
        },
    };
    return DesignCodec.document({
        ...DesignDefaults.document('vector-patterns'),
        pages: [
            { id: 'page-1', name: 'Canvas', background: '#FFFFFF', roots: [target.id] },
            { id: 'library', name: 'Patterns', background: '#FFFFFF', roots: [motif.id] },
        ],
        nodes: [
            target,
            motif,
            {
                ...DesignDefaults.node('dot', 'ellipse'),
                parentId: motif.id,
                width: 6,
                height: 6,
                style: {
                    ...DesignDefaults.style('ellipse'),
                    fills: [
                        {
                            ...DesignDefaults.paint(),
                            kind: 'linear',
                            stops: [
                                { offset: 0, color: '#FF0000' },
                                { offset: 1, color: '#0000FF' },
                            ],
                        },
                    ],
                },
            },
            {
                ...text,
                parentId: motif.id,
                x: 6,
                width: 10,
                height: 12,
                text: { ...text.text, content: 'V', size: 10 },
            },
        ],
    });
}
function selection(document: DesignDocument): DesignSvgSelection {
    return DesignPatternSources.prepare(
        document,
        DesignSvgGeometry.select(new DesignLayoutEngine(document, 'page-1').solve()),
    );
}

describe('editable vector pattern sources', (): void => {
    it('uses revision-pinned native source dimensions when unrelated library text remains deferred', (): void => {
        const document: DesignDocument = fixture();
        const scene: DesignSvgSelection = DesignSvgGeometry.select(
            new DesignLayoutEngine(document, 'page-1').solve(),
        );
        const selected: DesignSvgSelection = DesignPatternSources.prepare(
            document,
            scene,
            undefined,
            (id: string): DesignSize | null => (id === 'motif' ? { width: 32, height: 24 } : null),
        );
        expect(selected.patternSources?.[0]?.selection).toMatchObject({ width: 32, height: 24 });
        expect(DesignSvg.render(selected).svg).toContain('width="32" height="24"');
        expect(document).toEqual(fixture());
    });
    it('scales linked tile periods once when both the painted artwork and definition are selected', (): void => {
        const before: DesignDocument = fixture();
        const joined: DesignDocument = DesignCodec.document({
            ...before,
            pages: [{ ...before.pages[0], roots: ['target', 'motif'] }],
        });
        const targetOnly: DesignDocument = DesignEdits.apply(joined, [
            { op: 'scale', pageId: 'page-1', selection: ['target'], factor: 2 },
        ]).document;
        expect(
            targetOnly.nodes.find((node: DesignNode): boolean => node.id === 'target')?.style
                .fills[0]?.framing?.scale,
        ).toBe(2);
        const both: DesignDocument = DesignEdits.apply(joined, [
            { op: 'scale', pageId: 'page-1', selection: ['target', 'motif'], factor: 2 },
        ]).document;
        expect(
            both.nodes.find((node: DesignNode): boolean => node.id === 'target')?.style.fills[0]
                ?.framing?.scale,
        ).toBe(1);
        expect(DesignPatternSources.cell(both, 'motif').width).toBe(32);
    });
    it('keeps one original multi-layer definition and exports shared vectors and editable lettering at intrinsic repeat size', async (): Promise<void> => {
        const document: DesignDocument = fixture();
        const selected: DesignSvgSelection = selection(document);
        const svg: string = DesignSvg.render(selected).svg;
        expect(selected.patternSources).toHaveLength(1);
        expect(selected.patternSources?.[0]?.selection).toMatchObject({
            x: 0,
            y: 0,
            width: 16,
            height: 12,
        });
        expect(svg).toContain('width="16" height="12" patternTransform="matrix(1 0 0 1 0 0)"');
        expect(svg).toContain('<linearGradient');
        expect(svg).toContain('>V</tspan>');
        expect(svg).not.toContain('data:image/');
        expect(svg.match(/<g id="pattern-source-/gu)).toHaveLength(1);
        expect(DesignSvgFonts.inter(selected)).toBe(true);
        expect((await DesignSvgFonts.embed(DesignSvg.render(selected), selected)).svg).toContain(
            '@font-face',
        );
        expect(
            DesignSvgSelections.nodes(selected).filter((node): boolean => node.text !== null),
        ).toHaveLength(1);
        expect(document).toEqual(fixture());
        expect(DesignPatternGeometry.framing(paint('motif')).fit).toBe('tile');
    });

    it('namespaces nested gradients and clips without flattening repeated source definitions', (): void => {
        const before: DesignDocument = fixture();
        const added: DesignNode = {
            ...DesignDefaults.node('nested', 'component'),
            width: 24,
            height: 20,
            style: { ...DesignDefaults.style('component'), fills: [paint('motif')] },
        };
        const document: DesignDocument = DesignEdits.apply(before, [
            { op: 'insert', node: added, pageId: 'library', parentId: null, index: 1 },
            {
                op: 'paint-pattern',
                id: 'target',
                pageId: 'page-1',
                target: 'fill',
                index: 0,
                changes: { patternId: added.id, rotation: 30 },
            },
        ]).document;
        const selected: DesignSvgSelection = selection(document);
        const svg: string = DesignSvg.render(selected).svg;
        const ids: readonly string[] = [...svg.matchAll(/\bid="([^"]+)"/gu)].map(
            (match: RegExpExecArray): string => match[1] ?? '',
        );
        expect(new Set(ids).size).toBe(ids.length);
        expect(svg).toContain('pattern-source-0-pattern-source-0-paint-');
        expect(svg).toContain('width="24" height="20"');
        expect(DesignPatternReferences.ids(document.nodes[0] ?? added)).toEqual([
            'nested',
            'motif',
        ]);
    });

    it('patches source framing and color on one paint without replacing the source body or unrelated paints', (): void => {
        const before: DesignDocument = fixture();
        const command: DesignOperation = {
            op: 'paint-pattern',
            id: 'target',
            pageId: 'page-1',
            target: 'fill',
            index: 0,
            changes: {
                scale: 2,
                flipX: true,
                adjustments: { contrast: 0.2 },
                tile: { content: { a: 0.5, b: 0, c: 0, d: 0.5, tx: 0.25, ty: 0.25 } },
            },
        };
        const document: DesignDocument = DesignEdits.apply(before, [command]).document;
        expect(document.nodes.slice(1)).toEqual(before.nodes.slice(1));
        expect(document.nodes[0]?.style.stroke).toEqual(before.nodes[0]?.style.stroke);
        expect(document.nodes[0]?.style.fills[0]).toMatchObject({
            kind: 'pattern',
            patternId: 'motif',
            framing: { fit: 'tile', scale: 2, flipX: true, adjustments: { contrast: 0.2 } },
        });
        expect(DesignOperationCodec.operations([command])).toEqual([command]);
        expect(DesignScaleMetrics.paint(paint('motif'), 2).framing).toMatchObject({
            fit: 'tile',
            scale: 2,
        });
    });

    it('rejects missing, noncomponent and cyclic definitions, including style overrides and rich text paints', (): void => {
        const before: DesignDocument = fixture();
        expect((): DesignPaint =>
            DesignStyleCodec.paint({ ...paint('motif'), patternId: null }),
        ).toThrow('component');
        for (const reference of ['missing', 'dot', 'target']) {
            expect((): DesignEditResult =>
                DesignEdits.apply(before, [
                    {
                        op: 'paint-pattern',
                        id: 'target',
                        pageId: 'page-1',
                        target: 'fill',
                        index: 0,
                        changes: { patternId: reference },
                    },
                ]),
            ).toThrow('component');
        }
        expect((): DesignEditResult =>
            DesignEdits.apply(before, [
                {
                    op: 'paint-pattern',
                    id: 'dot',
                    pageId: 'library',
                    target: 'fill',
                    index: 0,
                    changes: { patternId: 'motif' },
                },
            ]),
        ).toThrow('cyclic');
        expect((): readonly DesignOperation[] =>
            DesignOperationCodec.operations([
                {
                    op: 'paint-pattern',
                    id: 'target',
                    pageId: 'page-1',
                    target: 'fill',
                    index: 0,
                    changes: { assetId: 'motif' },
                },
            ]),
        ).toThrow('Unexpected');
        expect((): readonly DesignOperation[] =>
            DesignOperationCodec.operations([
                {
                    op: 'paint-pattern',
                    id: 'target',
                    pageId: 'page-1',
                    target: 'fill',
                    index: 0,
                    changes: {},
                },
            ]),
        ).toThrow('Supply');
    });

    it('copies linked definitions with their artwork across documents and remaps an internally duplicated forest', (): void => {
        const before: DesignDocument = fixture();
        const copied: DesignDocument = DesignTransfer.apply(
            before,
            DesignDefaults.document('destination'),
            {
                id: 'destination',
                expectedRevision: '1',
                commandId: 'copy-pattern',
                sourceId: before.id,
                sourceRevision: before.revision,
                sourcePageId: 'page-1',
                selection: ['target'],
                pageId: 'page-1',
                parentId: null,
                x: 0,
                y: 0,
            },
            (key: string): string => 'copy-' + key.replaceAll(':', '-'),
            { measure: (): DesignSize => ({ width: 16, height: 12 }) },
        ).document;
        const target: DesignNode | undefined = copied.nodes.find(
            (node: DesignNode): boolean => node.id === 'copy-layer-target',
        );
        expect(target?.style.fills[0]?.patternId).toBe('copy-definition-motif');
        expect(
            copied.nodes.find((node: DesignNode): boolean => node.id === 'copy-definition-letter')
                ?.text?.content,
        ).toBe('V');
        expect(DesignSvg.render(selection(copied)).svg).toContain('>V</tspan>');
        const joined: DesignDocument = DesignCodec.document({
            ...before,
            pages: [{ ...before.pages[0], roots: ['target', 'motif'] }],
        });
        const plan: DesignSelectionPlan = DesignSelectionTree.duplicate(
            new DesignSelectionContext(joined, 'page-1', ['target', 'motif']),
            (key: string): string => 'duplicate-' + key,
        );
        const duplicated: DesignDocument = DesignEdits.apply(joined, plan.operations).document;
        const clone: DesignNode | undefined = duplicated.nodes.find(
            (node: DesignNode): boolean => node.id === 'duplicate-target',
        );
        expect(clone?.style.fills[0]?.patternId).toBe('duplicate-motif');
        expect(clone?.style.stroke?.paint.patternId).toBe('duplicate-motif');
    });
});
