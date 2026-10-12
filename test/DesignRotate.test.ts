// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignSelectionContext } from '../src/design/DesignSelectionContext.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import {
    DesignConstraint,
    DesignFlow,
    DesignKind,
    DesignSizing,
    type DesignDocument,
    type DesignNode,
    type DesignBox,
} from '../src/design/DesignTypes.js';
import type { DesignSelectionBounds } from '../src/design/DesignSelectionTypes.js';
import type { DesignEditResult, DesignOperation } from '../src/design/DesignOperationTypes.js';

function fixture(pin: DesignConstraint, hug: boolean): DesignDocument {
    const frame: DesignNode = DesignDefaults.node('board', DesignKind.Frame);
    const card: DesignNode = DesignDefaults.node('card', DesignKind.Frame);
    const leaf: DesignNode = DesignDefaults.node('badge', DesignKind.Rectangle);
    return DesignCodec.document({
        ...DesignDefaults.document('rotation'),
        pages: [{ id: 'page-1', name: 'Page', background: '#FFFFFF', roots: ['board', 'other'] }],
        nodes: [
            {
                ...frame,
                x: 100,
                y: 90,
                width: 600,
                height: 450,
                rotation: 33,
                children: ['card', 'peer'],
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
                children: ['badge'],
                placement: { ...card.placement, horizontal: pin, vertical: pin },
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
                ...leaf,
                id: 'peer',
                parentId: 'board',
                x: 280,
                y: 210,
                width: 90,
                height: 70,
                rotation: -17,
                placement: { ...leaf.placement, horizontal: pin, vertical: pin },
            },
            { ...leaf, id: 'other', x: 720, y: 120, width: 80, height: 60, rotation: -22 },
        ],
    });
}
function node(source: DesignDocument, id: string): DesignNode {
    const result: DesignNode | undefined = source.nodes.find(
        (entry: DesignNode): boolean => entry.id === id,
    );
    if (result === undefined) {
        throw new Error('Missing test layer ' + id);
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
        throw new Error('Missing resolved test layer ' + id);
    }
    return result;
}
for (const pin of Object.values(DesignConstraint)) {
    for (const hug of [false, true]) {
        for (const crossParent of [false, true]) {
            test(`shared-pivot rotation preserves world spacing, pinned content and undo with ${pin}, Hug ${hug}, cross parent ${crossParent}`, (): void => {
                const source: DesignDocument = fixture(pin, hug);
                const selection: readonly string[] = crossParent
                    ? ['card', 'badge', 'other']
                    : ['card', 'badge', 'peer'];
                const context: DesignSelectionContext = new DesignSelectionContext(
                    source,
                    'page-1',
                    selection,
                );
                const before: ReadonlyMap<string, DesignBox> = boxes(source);
                const angle: number = 47;
                const pivotX: number = 380;
                const pivotY: number = 260;
                const result: DesignEditResult = DesignEdits.apply(source, [
                    { op: 'rotate', pageId: 'page-1', selection, angle, pivotX, pivotY },
                ]);
                const after: ReadonlyMap<string, DesignBox> = boxes(result.document);
                for (const root of context.roots) {
                    const old: DesignBox = box(before, root.id);
                    const current: DesignBox = box(after, root.id);
                    const dx: number = old.x + old.width / 2 - pivotX;
                    const dy: number = old.y + old.height / 2 - pivotY;
                    const radians: number = (angle * Math.PI) / 180;
                    expect(current.x + current.width / 2).toBeCloseTo(
                        pivotX + dx * Math.cos(radians) - dy * Math.sin(radians),
                        6,
                    );
                    expect(current.y + current.height / 2).toBeCloseTo(
                        pivotY + dx * Math.sin(radians) + dy * Math.cos(radians),
                        6,
                    );
                    expect(current.rotation).toBeCloseTo(old.rotation + angle, 6);
                    expect(current.width).toBeCloseTo(old.width, 6);
                    expect(current.height).toBeCloseTo(old.height, 6);
                    expect(node(result.document, root.id).placement.horizontal).toBe(
                        pin === DesignConstraint.Start || root.id === 'other'
                            ? DesignConstraint.Start
                            : pin,
                    );
                }
                expect(node(result.document, 'badge')).toEqual(node(source, 'badge'));
                const originalBadge: DesignBox = box(before, 'badge');
                const rotatedBadge: DesignBox = box(after, 'badge');
                const oldCard: DesignBox = box(before, 'card');
                const newCard: DesignBox = box(after, 'card');
                expect(rotatedBadge.rotation).toBeCloseTo(originalBadge.rotation + angle, 6);
                expect(
                    Math.hypot(
                        rotatedBadge.x + rotatedBadge.width / 2 - newCard.x - newCard.width / 2,
                        rotatedBadge.y + rotatedBadge.height / 2 - newCard.y - newCard.height / 2,
                    ),
                ).toBeCloseTo(
                    Math.hypot(
                        originalBadge.x + originalBadge.width / 2 - oldCard.x - oldCard.width / 2,
                        originalBadge.y + originalBadge.height / 2 - oldCard.y - oldCard.height / 2,
                    ),
                    6,
                );
                const previous: DesignBox = box(before, 'board');
                const current: DesignBox = box(after, 'board');
                expect(DesignSelectionContext.corner(current).x).toBeCloseTo(
                    DesignSelectionContext.corner(previous).x,
                    6,
                );
                expect(DesignSelectionContext.corner(current).y).toBeCloseTo(
                    DesignSelectionContext.corner(previous).y,
                    6,
                );
                const restored: DesignDocument = DesignEdits.restore(
                    result.document,
                    result.changes,
                ).document;
                expect(restored.nodes).toEqual(source.nodes);
            });
        }
    }
}

test('default pivot is the combined rotated bounds center and zero rotation changes nothing', (): void => {
    const source: DesignDocument = fixture(DesignConstraint.Start, false);
    const context: DesignSelectionContext = new DesignSelectionContext(source, 'page-1', [
        'card',
        'other',
    ]);
    const areas: readonly DesignSelectionBounds[] = context.roots.map(
        (entry: DesignNode): DesignSelectionBounds =>
            DesignSelectionContext.bounds(context.box(entry.id)),
    );
    const pivotX: number =
        (Math.min(...areas.map((area): number => area.left)) +
            Math.max(...areas.map((area): number => area.right))) /
        2;
    const pivotY: number =
        (Math.min(...areas.map((area): number => area.top)) +
            Math.max(...areas.map((area): number => area.bottom))) /
        2;
    const omitted: DesignDocument = DesignEdits.apply(source, [
        { op: 'rotate', pageId: 'page-1', selection: ['card', 'other'], angle: 90 },
    ]).document;
    const explicit: DesignDocument = DesignEdits.apply(source, [
        { op: 'rotate', pageId: 'page-1', selection: ['card', 'other'], angle: 90, pivotX, pivotY },
    ]).document;
    expect(omitted.nodes).toEqual(explicit.nodes);
    expect(
        DesignEdits.apply(source, [
            { op: 'rotate', pageId: 'page-1', selection: ['card', 'other'], angle: 360 },
        ]).changes.nodes,
    ).toEqual([]);
});

test('flow placement and locked ancestry reject shared movement atomically while a single flow child rotates in place', (): void => {
    const source: DesignDocument = fixture(DesignConstraint.Start, false);
    const flowing: DesignDocument = DesignEdits.apply(source, [
        {
            op: 'update',
            id: 'board',
            changes: { layout: { ...node(source, 'board').layout, flow: DesignFlow.Row } },
        },
    ]).document;
    const before: ReadonlyMap<string, DesignBox> = boxes(flowing);
    const rotated: DesignDocument = DesignEdits.apply(flowing, [
        { op: 'rotate', pageId: 'page-1', selection: ['card'], angle: 45 },
    ]).document;
    expect(box(boxes(rotated), 'card')).toEqual({
        ...box(before, 'card'),
        rotation: box(before, 'card').rotation + 45,
    });
    expect((): DesignEditResult =>
        DesignEdits.apply(flowing, [
            { op: 'rotate', pageId: 'page-1', selection: ['card', 'peer'], angle: 45 },
        ]),
    ).toThrow('Auto layout controls this position');
    const locked: DesignDocument = DesignEdits.apply(source, [
        { op: 'update', id: 'board', changes: { locked: true } },
    ]).document;
    expect((): DesignEditResult =>
        DesignEdits.apply(locked, [
            { op: 'rotate', pageId: 'page-1', selection: ['card', 'other'], angle: 45 },
        ]),
    ).toThrow('Unlock');
});

test('rotation boundary rejects incomplete pivots, duplicate selection, nonfinite and oversized angles and stray fields', (): void => {
    const base: DesignOperation = {
        op: 'rotate',
        pageId: 'page-1',
        selection: ['card'],
        angle: 45,
    };
    for (const raw of [
        { ...base, pivotX: 0 },
        { ...base, selection: ['card', 'card'] },
        { ...base, angle: NaN },
        { ...base, angle: 361 },
        { ...base, stray: true },
    ]) {
        expect((): readonly DesignOperation[] => DesignOperationCodec.operations([raw])).toThrow();
    }
});

test('large authored angles wrap into valid saved rotations without changing ordinary translation records', (): void => {
    const source: DesignDocument = fixture(DesignConstraint.Start, false);
    const authored: DesignDocument = DesignEdits.apply(source, [
        { op: 'update', id: 'card', changes: { rotation: 350 } },
    ]).document;
    const rotated: DesignDocument = DesignEdits.apply(authored, [
        { op: 'rotate', pageId: 'page-1', selection: ['card', 'other'], angle: 270 },
    ]).document;
    expect(node(rotated, 'card').rotation).toBeCloseTo(-100, 6);
    expect(node(rotated, 'other').rotation).toBeCloseTo(-112, 6);
    const moved: DesignDocument = DesignEdits.apply(authored, [
        { op: 'translate', pageId: 'page-1', selection: ['card'], dx: 10, dy: 10 },
    ]).document;
    expect(node(moved, 'card').rotation).toBe(350);
});
