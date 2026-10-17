// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import { DesignSelectionContext } from '../src/design/DesignSelectionContext.js';
import { DesignTidyEdits } from '../src/design/DesignTidyEdits.js';
import {
    DesignTidyGeometry,
    type DesignTidyCell,
    type DesignTidyLayout,
} from '../src/design/DesignTidyGeometry.js';
import {
    DesignConstraint,
    DesignFlow,
    DesignKind,
    DesignSizing,
    type DesignDocument,
    type DesignNode,
    type DesignBox,
} from '../src/design/DesignTypes.js';
import type { DesignEditResult, DesignTidyOperation } from '../src/design/DesignOperationTypes.js';

function fixture(
    pin: DesignConstraint = DesignConstraint.Start,
    hug: boolean = false,
): DesignDocument {
    const frame: DesignNode = DesignDefaults.node('frame', DesignKind.Frame);
    const rectangle: DesignNode = DesignDefaults.node('a', DesignKind.Rectangle);
    return DesignCodec.document({
        ...DesignDefaults.document('tidy'),
        pages: [{ id: 'page-1', name: 'Canvas', background: '#FFFFFF', roots: ['frame'] }],
        nodes: [
            {
                ...frame,
                x: 90,
                y: 70,
                width: 600,
                height: 500,
                rotation: 27,
                children: ['c', 'b', 'a', 'f', 'e', 'd'],
                placement: {
                    ...frame.placement,
                    width: hug ? DesignSizing.Hug : DesignSizing.Fixed,
                    height: hug ? DesignSizing.Hug : DesignSizing.Fixed,
                },
            },
            ...['a', 'b', 'c', 'd', 'e', 'f'].map((id: string, index: number): DesignNode => ({
                ...rectangle,
                id,
                name: id,
                parentId: 'frame',
                x: 20 + (index % 3) * 160 + index * 2,
                y: 30 + Math.floor(index / 3) * 170 + (index % 3) * 3,
                width: 80 + index * 5,
                height: 60 + index * 2,
                placement: { ...rectangle.placement, horizontal: pin, vertical: pin },
            })),
        ],
    });
}
function context(
    document: DesignDocument,
    selection: readonly string[] = ['a', 'b', 'c', 'd', 'e', 'f'],
): DesignSelectionContext {
    return new DesignSelectionContext(document, 'page-1', selection);
}
function operation(gapX: number = 24, gapY: number = 32): DesignTidyOperation {
    return {
        op: 'tidy',
        pageId: 'page-1',
        selection: ['a', 'b', 'c', 'd', 'e', 'f'],
        columns: 3,
        gapX,
        gapY,
    };
}

for (const pin of Object.values(DesignConstraint)) {
    for (const hug of [false, true]) {
        test(`tidy preserves rotated parent axes, dimensions, painter order and ${pin} constraints with Hug ${hug}`, (): void => {
            const source: DesignDocument = fixture(pin, hug);
            const before: DesignSelectionContext = context(source);
            const result: DesignEditResult = DesignEdits.apply(source, [operation()]);
            const after: DesignSelectionContext = context(result.document);
            const layout: DesignTidyLayout = new DesignTidyEdits(after).inspect(
                operation().selection,
                3,
            ).layout;
            expect(layout.regular).toBe(true);
            expect(layout.gapX).toBeCloseTo(24, 6);
            expect(layout.gapY).toBeCloseTo(32, 6);
            const original: readonly ReturnType<typeof DesignSelectionContext.bounds>[] =
                operation().selection.map(
                    (id: string): ReturnType<typeof DesignSelectionContext.bounds> =>
                        DesignSelectionContext.bounds(
                            DesignSelectionContext.relative(before.box(id), before.box('frame')),
                        ),
                );
            const left: number = Math.min(...original.map((bounds): number => bounds.left));
            const top: number = Math.min(...original.map((bounds): number => bounds.top));
            const firstWidth: number = Math.max(
                (original[0]?.right ?? 0) - (original[0]?.left ?? 0),
                (original[3]?.right ?? 0) - (original[3]?.left ?? 0),
            );
            const secondWidth: number = Math.max(
                (original[1]?.right ?? 0) - (original[1]?.left ?? 0),
                (original[4]?.right ?? 0) - (original[4]?.left ?? 0),
            );
            const firstHeight: number = Math.max(
                ...original.slice(0, 3).map((bounds): number => bounds.bottom - bounds.top),
            );
            for (const [index, id] of operation().selection.entries()) {
                const placed: ReturnType<typeof DesignSelectionContext.bounds> =
                    DesignSelectionContext.bounds(
                        DesignSelectionContext.relative(after.box(id), after.box('frame')),
                    );
                expect(placed.left).toBeCloseTo(
                    left + ([0, firstWidth + 24, firstWidth + secondWidth + 48][index % 3] ?? 0),
                    6,
                );
                expect(placed.top).toBeCloseTo(top + (index < 3 ? 0 : firstHeight + 32), 6);
            }
            const oldCorner: ReturnType<typeof DesignSelectionContext.corner> =
                DesignSelectionContext.corner(before.box('frame'));
            const newCorner: ReturnType<typeof DesignSelectionContext.corner> =
                DesignSelectionContext.corner(after.box('frame'));
            expect(newCorner.x).toBeCloseTo(oldCorner.x, 6);
            expect(newCorner.y).toBeCloseTo(oldCorner.y, 6);
            for (const id of operation().selection) {
                const oldBox: DesignBox = before.box(id);
                const newBox: DesignBox = after.box(id);
                expect(newBox.width).toBeCloseTo(oldBox.width, 6);
                expect(newBox.height).toBeCloseTo(oldBox.height, 6);
                expect(newBox.rotation).toBeCloseTo(oldBox.rotation, 6);
                expect(after.node(id).style).toEqual(before.node(id).style);
                expect(after.node(id).placement.horizontal).toBe(pin);
            }
            expect(after.node('frame').children).toEqual(before.node('frame').children);
            expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
                source.nodes,
            );
            const noop: DesignEditResult = DesignEdits.apply(result.document, [operation()]);
            expect(noop.document.nodes).toEqual(result.document.nodes);
            expect(noop.changes.nodes).toHaveLength(0);
        });
    }
}

test('visual inference ignores reverse click/painter order and groups top-aligned unequal heights', (): void => {
    const cells: readonly DesignTidyCell[] = [
        { id: 'b', x: 130, y: 20, width: 100, height: 10 },
        { id: 'a', x: 10, y: 20, width: 100, height: 160 },
        { id: 'd', x: 130, y: 200, width: 100, height: 40 },
        { id: 'c', x: 10, y: 200, width: 100, height: 90 },
    ];
    const layout: DesignTidyLayout = DesignTidyGeometry.inspect(cells);
    expect(layout.cells.map((cell: DesignTidyCell): string => cell.id)).toEqual([
        'a',
        'b',
        'c',
        'd',
    ]);
    expect(layout).toMatchObject({ columns: 2, gapX: 20, gapY: 20, regular: true });
    const source: DesignDocument = fixture();
    const result: DesignEditResult = DesignEdits.apply(source, [
        { op: 'tidy', pageId: 'page-1', selection: ['f', 'e', 'd', 'c', 'b', 'a'] },
    ]);
    expect(
        new DesignTidyEdits(context(result.document)).inspect(operation().selection).layout.regular,
    ).toBe(true);
});

test('explicit logical order and signed overlap survive reversal without changing painter order', (): void => {
    const source: DesignDocument = fixture();
    const command: DesignTidyOperation = {
        ...operation(-260, -180),
        selection: operation().selection.toReversed(),
    };
    const result: DesignEditResult = DesignEdits.apply(source, [command]);
    const layout: DesignTidyLayout = new DesignTidyEdits(context(result.document)).inspect(
        command.selection,
        3,
    ).layout;
    expect(layout).toMatchObject({ columns: 3, regular: true });
    expect(layout.gapX).toBeCloseTo(-260, 6);
    expect(layout.gapY).toBeCloseTo(-180, 6);
    expect(DesignEdits.apply(result.document, [command]).changes.nodes).toHaveLength(0);
    expect(context(result.document).node('frame').children).toEqual(
        context(source).node('frame').children,
    );
});

test('world axes arrange roots from different parents and selected descendants are pruned', (): void => {
    const source: DesignDocument = fixture();
    const other: DesignNode = {
        ...DesignDefaults.node('other', DesignKind.Rectangle),
        x: 800,
        y: 550,
        width: 60,
        height: 50,
    };
    const document: DesignDocument = DesignCodec.document({
        ...source,
        pages: source.pages.map((page): typeof page => ({
            ...page,
            roots: [...page.roots, 'other'],
        })),
        nodes: [...source.nodes, other],
    });
    const result: DesignEditResult = DesignEdits.apply(document, [
        { op: 'tidy', pageId: 'page-1', selection: ['frame', 'a', 'other'], columns: 2, gapX: 40 },
    ]);
    const after: DesignSelectionContext = context(result.document, ['frame', 'other']);
    const frame: DesignBox = after.box('frame');
    const bounds: ReturnType<typeof DesignSelectionContext.bounds> =
        DesignSelectionContext.bounds(frame);
    expect(after.box('other').x).toBeCloseTo(bounds.right + 40, 6);
    expect(after.box('other').y).toBeCloseTo(bounds.top, 6);
    expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
        document.nodes,
    );
});

test('tidy rejects invalid contracts and inaccessible or flow-owned selections atomically', (): void => {
    for (const invalid of [
        { selection: ['a'] },
        { selection: ['a', 'a'] },
        { columns: 0 },
        { columns: 1.5 },
        { columns: 129 },
        { gapX: Infinity },
        { gapY: -10001 },
        { parentId: 'frame' },
    ]) {
        expect((): void => {
            DesignOperationCodec.operations([{ ...operation(), ...invalid }]);
        }).toThrow();
    }
    const source: DesignDocument = fixture();
    for (const change of [
        { locked: true },
        { visible: false },
        { layout: { ...context(source).node('frame').layout, flow: DesignFlow.Row } },
    ]) {
        const document: DesignDocument = DesignCodec.document({
            ...source,
            nodes: source.nodes.map((node: DesignNode): DesignNode =>
                node.id === 'frame' ? { ...node, ...change } : node,
            ),
        });
        expect((): void => {
            DesignEdits.apply(document, [operation()]);
        }).toThrow();
        expect(document.nodes).toEqual(
            source.nodes.map((node: DesignNode): DesignNode =>
                node.id === 'frame' ? { ...node, ...change } : node,
            ),
        );
    }
    expect((): void => {
        DesignEdits.apply(source, [{ ...operation(), columns: 7 }]);
    }).toThrow();
    expect((): void => {
        DesignEdits.apply(source, [{ ...operation(), selection: ['frame', 'a'] }]);
    }).toThrow();
    expect((): void => {
        DesignEdits.apply(source, [{ ...operation(), pageId: 'elsewhere' }]);
    }).toThrow();
});
