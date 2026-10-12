// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignScene } from '../src/design/DesignScene.js';
import { DesignSelectionContext } from '../src/design/DesignSelectionContext.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import { DesignComponents } from '../src/design/DesignComponents.js';
import { DesignComponentAction } from '../src/design/DesignComponentTypes.js';
import {
    DesignConstraint,
    DesignFlow,
    DesignKind,
    DesignSizing,
    DesignPathVerb,
    type DesignDocument,
    type DesignNode,
    type DesignBox,
} from '../src/design/DesignTypes.js';
import type { DesignEditResult, DesignOperation } from '../src/design/DesignOperationTypes.js';
import type {
    DesignSelectionPlan,
    DesignSelectionPoint,
} from '../src/design/DesignSelectionTypes.js';
import type { DesignScenePage, DesignSceneNode } from '../src/design/DesignScene.js';

function node(source: DesignDocument, id: string): DesignNode {
    const result: DesignNode | undefined = source.nodes.find(
        (entry: DesignNode): boolean => entry.id === id,
    );
    if (result === undefined) {
        throw new Error('Missing scale test layer ' + id);
    }
    return result;
}
function boxes(source: DesignDocument): ReadonlyMap<string, DesignBox> {
    return new Map(
        new DesignLayoutEngine(source, 'page-1')
            .solve()
            .boxes.map((box: DesignBox): readonly [string, DesignBox] => [box.id, box]),
    );
}
function box(source: ReadonlyMap<string, DesignBox>, id: string): DesignBox {
    const result: DesignBox | undefined = source.get(id);
    if (result === undefined) {
        throw new Error('Missing scale test box ' + id);
    }
    return result;
}
function fixture(pin: DesignConstraint, hug: boolean): DesignDocument {
    const frame: DesignNode = DesignDefaults.node('board', DesignKind.Frame);
    const card: DesignNode = DesignDefaults.node('card', DesignKind.Frame);
    const leaf: DesignNode = DesignDefaults.node('badge', DesignKind.Rectangle);
    const label: DesignNode = DesignDefaults.node('label', DesignKind.Text);
    const vector: DesignNode = DesignDefaults.node('vector', DesignKind.Path);
    if (label.text === null) {
        throw new Error('Missing text template');
    }
    return DesignCodec.document({
        ...DesignDefaults.document('scale'),
        pages: [{ id: 'page-1', name: 'Page', background: '#FFFFFF', roots: ['board', 'other'] }],
        nodes: [
            {
                ...frame,
                x: 100,
                y: 90,
                width: 600,
                height: 450,
                rotation: 33,
                children: ['card'],
                placement: {
                    ...frame.placement,
                    width: hug ? DesignSizing.Hug : DesignSizing.Fixed,
                    height: hug ? DesignSizing.Hug : DesignSizing.Fixed,
                },
            },
            {
                ...card,
                parentId: 'board',
                x: 50,
                y: 60,
                width: 180,
                height: 120,
                rotation: 13,
                children: ['badge', 'label', 'vector'],
                placement: { ...card.placement, horizontal: pin, vertical: pin },
                style: {
                    ...card.style,
                    corners: { topLeft: 8, topRight: 10, bottomLeft: 12, bottomRight: 14 },
                    stroke: { paint: DesignDefaults.paint('#123456'), width: 2, dash: [4, 2] },
                    shadows: [{ x: 2, y: 3, blur: 4, spread: 1, color: '#00000080', inner: false }],
                },
            },
            {
                ...leaf,
                parentId: 'card',
                x: 140,
                y: 80,
                width: 20,
                height: 12,
                placement: {
                    ...leaf.placement,
                    horizontal: DesignConstraint.End,
                    vertical: DesignConstraint.End,
                },
            },
            {
                ...label,
                parentId: 'card',
                x: 8,
                y: 12,
                width: 150,
                height: 40,
                text: {
                    ...label.text,
                    content: 'Scale artwork',
                    size: 20,
                    letterSpacing: 1,
                    runs: [
                        {
                            start: 0,
                            end: 5,
                            family: 'Inter',
                            size: 24,
                            weight: 700,
                            italic: false,
                            color: '#AA5544',
                            underline: true,
                        },
                    ],
                },
            },
            {
                ...vector,
                parentId: 'card',
                x: 20,
                y: 70,
                width: 40,
                height: 20,
                path: [
                    { verb: DesignPathVerb.Move, values: [0, 0] },
                    { verb: DesignPathVerb.Cubic, values: [10, 0, 30, 20, 40, 20] },
                ],
                style: {
                    ...vector.style,
                    stroke: { paint: DesignDefaults.paint('#000000'), width: 2, dash: [4, 2] },
                },
            },
            { ...leaf, id: 'other', x: 720, y: 120, width: 80, height: 60, rotation: -22 },
        ],
    });
}
for (const pin of Object.values(DesignConstraint)) {
    for (const hug of [false, true]) {
        for (const factor of [0.5, 2]) {
            test(`uniform artwork scale preserves world geometry and pins with ${pin}, Hug ${hug} and factor ${factor}`, (): void => {
                const source: DesignDocument = fixture(pin, hug);
                const before: ReadonlyMap<string, DesignBox> = boxes(source);
                const result: DesignEditResult = DesignEdits.apply(source, [
                    {
                        op: 'scale',
                        pageId: 'page-1',
                        selection: ['card', 'badge', 'other'],
                        factor,
                        pivotX: 380,
                        pivotY: 260,
                    },
                ]);
                const after: ReadonlyMap<string, DesignBox> = boxes(result.document);
                for (const id of ['card', 'badge', 'label', 'vector', 'other']) {
                    const previous: DesignBox = box(before, id);
                    const current: DesignBox = box(after, id);
                    expect(current.x + current.width / 2).toBeCloseTo(
                        380 + (previous.x + previous.width / 2 - 380) * factor,
                        6,
                    );
                    expect(current.y + current.height / 2).toBeCloseTo(
                        260 + (previous.y + previous.height / 2 - 260) * factor,
                        6,
                    );
                    expect(current.width).toBeCloseTo(previous.width * factor, 6);
                    expect(current.height).toBeCloseTo(previous.height * factor, 6);
                    expect(current.rotation).toBeCloseTo(previous.rotation, 6);
                }
                expect(node(result.document, 'card').placement.horizontal).toBe(pin);
                expect(node(result.document, 'card').style.stroke?.width).toBe(2 * factor);
                expect(node(result.document, 'card').style.stroke?.dash).toEqual([
                    4 * factor,
                    2 * factor,
                ]);
                expect(node(result.document, 'card').style.corners.topLeft).toBe(8 * factor);
                expect(node(result.document, 'card').style.shadows[0]?.blur).toBe(4 * factor);
                expect(node(result.document, 'label').text?.size).toBe(20 * factor);
                expect(node(result.document, 'label').text?.letterSpacing).toBe(factor);
                expect(node(result.document, 'label').text?.runs[0]?.size).toBe(24 * factor);
                expect(node(result.document, 'label').text?.content).toBe('Scale artwork');
                expect(node(result.document, 'vector').path[1]?.values).toEqual([
                    10 * factor,
                    0,
                    30 * factor,
                    20 * factor,
                    40 * factor,
                    20 * factor,
                ]);
                const oldCorner: DesignSelectionPoint = DesignSelectionContext.corner(
                    box(before, 'board'),
                );
                const newCorner: DesignSelectionPoint = DesignSelectionContext.corner(
                    box(after, 'board'),
                );
                expect(newCorner.x).toBeCloseTo(oldCorner.x, 6);
                expect(newCorner.y).toBeCloseTo(oldCorner.y, 6);
                expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
                    source.nodes,
                );
            });
        }
    }
}

function linked(): DesignDocument {
    const source: DesignDocument = fixture(DesignConstraint.Start, false);
    const definition: DesignNode = {
        ...node(source, 'card'),
        id: 'definition',
        kind: DesignKind.Component,
        parentId: null,
        x: 100,
        y: 100,
        rotation: 0,
        children: ['label', 'vector', 'badge'],
    };
    const instance: DesignNode = {
        ...DesignDefaults.node('instance', DesignKind.Instance),
        x: 600,
        y: 100,
        width: definition.width,
        height: definition.height,
        componentId: definition.id,
    };
    return DesignCodec.document({
        ...source,
        pages: [
            {
                id: 'page-1',
                name: 'Page',
                background: '#FFFFFF',
                roots: ['definition', 'instance'],
            },
        ],
        nodes: [
            definition,
            ...source.nodes
                .filter((entry: DesignNode): boolean => definition.children.includes(entry.id))
                .map((entry: DesignNode): DesignNode => ({ ...entry, parentId: definition.id })),
            instance,
        ],
    });
}

test('linked instance scaling keeps definitions and overrides, scales all expanded metrics, composes successive scales and detaches without visual changes', (): void => {
    const source: DesignDocument = linked();
    const before: ReadonlyMap<string, DesignBox> = boxes(source);
    const first: DesignEditResult = DesignEdits.apply(source, [
        { op: 'scale', pageId: 'page-1', selection: ['instance'], factor: 2 },
    ]);
    const second: DesignEditResult = DesignEdits.apply(first.document, [
        { op: 'scale', pageId: 'page-1', selection: ['instance'], factor: 1.5 },
    ]);
    expect(node(second.document, 'instance').contentScale).toBe(3);
    expect(node(second.document, 'instance').componentId).toBe('definition');
    expect(
        second.document.nodes.filter((entry: DesignNode): boolean => entry.id !== 'instance'),
    ).toEqual(source.nodes.filter((entry: DesignNode): boolean => entry.id !== 'instance'));
    const scene: DesignScenePage = DesignScene.page(second.document, 'page-1');
    expect(
        scene.nodes.find((entry: DesignSceneNode): boolean => entry.id === '@instance/label')?.text
            ?.size,
    ).toBe(60);
    const after: ReadonlyMap<string, DesignBox> = boxes(second.document);
    for (const id of ['instance', '@instance/label', '@instance/vector', '@instance/badge']) {
        expect(box(after, id).width).toBeCloseTo(box(before, id).width * 3, 6);
        expect(box(after, id).height).toBeCloseTo(box(before, id).height * 3, 6);
    }
    const detached: DesignSelectionPlan = DesignComponents.plan(
        second.document,
        'page-1',
        { action: DesignComponentAction.Detach, selection: ['instance'] },
        (id: string): string => id.replaceAll(':', '-').replaceAll('/', '-').replaceAll('@', 'x'),
    );
    const baked: DesignDocument = DesignEdits.apply(second.document, detached.operations).document;
    expect(node(baked, 'instance').contentScale).toBeUndefined();
    expect(node(baked, 'instance').style).toEqual(
        scene.nodes.find((entry: DesignSceneNode): boolean => entry.id === 'instance')?.style,
    );
    expect(DesignEdits.restore(first.document, first.changes).document.nodes).toEqual(source.nodes);
});

test('factor one changes nothing and malformed factors, pivots, duplicate roots and non-instance metadata are rejected', (): void => {
    const source: DesignDocument = linked();
    expect(
        DesignEdits.apply(source, [
            { op: 'scale', pageId: 'page-1', selection: ['instance'], factor: 1 },
        ]).changes.nodes,
    ).toEqual([]);
    const base: DesignOperation = {
        op: 'scale',
        pageId: 'page-1',
        selection: ['instance'],
        factor: 2,
    };
    for (const raw of [
        { ...base, factor: 0 },
        { ...base, factor: NaN },
        { ...base, pivotX: 1 },
        { ...base, selection: ['instance', 'instance'] },
        { ...base, stray: true },
    ]) {
        expect((): readonly DesignOperation[] => DesignOperationCodec.operations([raw])).toThrow();
    }
    expect((): DesignEditResult =>
        DesignEdits.apply(source, [
            { op: 'update', id: 'definition', changes: { contentScale: 2 } },
        ]),
    ).toThrow('Only linked instances');
});

for (const flow of [DesignFlow.Row, DesignFlow.Column, DesignFlow.Grid]) {
    test(
        'scaling an automatic layout scales gaps and padding while retaining its ordering: ' + flow,
        (): void => {
            const original: DesignDocument = fixture(DesignConstraint.Start, false);
            const source: DesignDocument = DesignEdits.apply(original, [
                {
                    op: 'update',
                    id: 'board',
                    changes: {
                        layout: {
                            ...node(original, 'board').layout,
                            flow,
                            gap: 14,
                            rowGap: 18,
                            padding: { top: 10, right: 20, bottom: 30, left: 40 },
                            columns: 2,
                        },
                    },
                },
            ]).document;
            const before: ReadonlyMap<string, DesignBox> = boxes(source);
            const result: DesignEditResult = DesignEdits.apply(source, [
                {
                    op: 'scale',
                    pageId: 'page-1',
                    selection: ['board'],
                    factor: 2,
                    pivotX: 0,
                    pivotY: 0,
                },
            ]);
            const after: ReadonlyMap<string, DesignBox> = boxes(result.document);
            for (const id of ['board', 'card', 'badge', 'label', 'vector']) {
                expect(box(after, id).x).toBeCloseTo(box(before, id).x * 2, 6);
                expect(box(after, id).y).toBeCloseTo(box(before, id).y * 2, 6);
                expect(box(after, id).width).toBeCloseTo(box(before, id).width * 2, 6);
                expect(box(after, id).height).toBeCloseTo(box(before, id).height * 2, 6);
            }
            expect(node(result.document, 'board').layout).toEqual({
                ...node(source, 'board').layout,
                gap: 28,
                rowGap: 36,
                padding: { top: 20, right: 40, bottom: 60, left: 80 },
            });
            expect(node(result.document, 'board').children).toEqual(node(source, 'board').children);
            expect(node(result.document, 'other')).toEqual(node(source, 'other'));
        },
    );
}

test('locked ancestry and flow-owned roots reject scaling without mutating the source', (): void => {
    const source: DesignDocument = fixture(DesignConstraint.Start, false);
    const locked: DesignDocument = DesignEdits.apply(source, [
        { op: 'update', id: 'board', changes: { locked: true } },
    ]).document;
    expect((): DesignEditResult =>
        DesignEdits.apply(locked, [
            { op: 'scale', pageId: 'page-1', selection: ['card'], factor: 2 },
        ]),
    ).toThrow('Unlock');
    const flowing: DesignDocument = DesignEdits.apply(source, [
        {
            op: 'update',
            id: 'board',
            changes: { layout: { ...node(source, 'board').layout, flow: DesignFlow.Row } },
        },
    ]).document;
    expect((): DesignEditResult =>
        DesignEdits.apply(flowing, [
            { op: 'scale', pageId: 'page-1', selection: ['card'], factor: 2 },
        ]),
    ).toThrow('Auto layout controls this position');
});

test('nested linked instances scale their effective typography and preserve component definitions and override contents', (): void => {
    const original: DesignDocument = linked();
    const definition: DesignNode = node(original, 'definition');
    const nested: DesignNode = {
        ...node(original, 'instance'),
        id: 'nested',
        parentId: 'outer-def',
        x: 10,
        y: 20,
        width: 360,
        height: 240,
        contentScale: 2,
        overrides: [
            { nodeId: 'label', text: 'Custom label', name: null, style: null, visible: null },
        ],
    };
    const outer: DesignNode = {
        ...definition,
        id: 'outer-def',
        x: 100,
        y: 400,
        width: 400,
        height: 280,
        children: ['nested'],
    };
    const source: DesignDocument = DesignCodec.document({
        ...original,
        pages: [
            {
                id: 'page-1',
                name: 'Page',
                background: '#FFFFFF',
                roots: ['definition', 'outer-def', 'instance'],
            },
        ],
        nodes: [
            ...original.nodes.map((entry: DesignNode): DesignNode =>
                entry.id === 'instance'
                    ? { ...entry, componentId: outer.id, width: 400, height: 280 }
                    : entry,
            ),
            outer,
            nested,
        ],
    });
    const before: ReadonlyMap<string, DesignBox> = boxes(source);
    const scaled: DesignEditResult = DesignEdits.apply(source, [
        { op: 'scale', pageId: 'page-1', selection: ['instance'], factor: 1.5 },
    ]);
    const scene: DesignScenePage = DesignScene.page(scaled.document, 'page-1');
    const text: DesignSceneNode | undefined = scene.nodes.find(
        (entry: DesignSceneNode): boolean => entry.id === '@instance/nested/label',
    );
    expect(text?.text?.size).toBe(60);
    expect(text?.text?.content).toBe('Custom label');
    expect(box(boxes(scaled.document), '@instance/nested/label').width).toBeCloseTo(
        box(before, '@instance/nested/label').width * 1.5,
        6,
    );
    expect(
        scaled.document.nodes.filter((entry: DesignNode): boolean => entry.id !== 'instance'),
    ).toEqual(source.nodes.filter((entry: DesignNode): boolean => entry.id !== 'instance'));
});

for (const selectInstance of [false, true]) {
    test(
        'scaling a definition transforms selected instances once and preserves the appearance of other instances: ' +
            String(selectInstance),
        (): void => {
            const source: DesignDocument = linked();
            const before: ReadonlyMap<string, DesignBox> = boxes(source);
            const selection: readonly string[] = selectInstance
                ? ['definition', 'instance']
                : ['definition'];
            const result: DesignEditResult = DesignEdits.apply(source, [
                { op: 'scale', pageId: 'page-1', selection, factor: 2, pivotX: 0, pivotY: 0 },
            ]);
            const after: ReadonlyMap<string, DesignBox> = boxes(result.document);
            const scene: DesignScenePage = DesignScene.page(result.document, 'page-1');
            const factor: number = selectInstance ? 2 : 1;
            for (const id of [
                'instance',
                '@instance/label',
                '@instance/vector',
                '@instance/badge',
            ]) {
                expect(box(after, id).width).toBeCloseTo(box(before, id).width * factor, 6);
                expect(box(after, id).height).toBeCloseTo(box(before, id).height * factor, 6);
            }
            expect(
                scene.nodes.find(
                    (entry: DesignSceneNode): boolean => entry.id === '@instance/label',
                )?.text?.size,
            ).toBe(20 * factor);
            expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
                source.nodes,
            );
        },
    );
}
