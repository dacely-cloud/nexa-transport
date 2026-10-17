// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import {
    DesignSizing,
    DesignFlow,
    type DesignBox,
    type DesignDocument,
    type DesignNode,
} from '../src/design/DesignTypes.js';
import type { DesignEditResult, DesignOperation } from '../src/design/DesignOperationTypes.js';

interface Point {
    readonly x: number;
    readonly y: number;
}
interface Edge {
    readonly name: string;
    readonly horizontal: boolean;
    readonly anchorX: number;
    readonly anchorY: number;
}
const edges: readonly Edge[] = [
    { name: 'east', horizontal: true, anchorX: 0, anchorY: 0.5 },
    { name: 'west', horizontal: true, anchorX: 1, anchorY: 0.5 },
    { name: 'south', horizontal: false, anchorX: 0.5, anchorY: 0 },
    { name: 'north', horizontal: false, anchorX: 0.5, anchorY: 1 },
];

function point(box: DesignBox, x: number, y: number): Point {
    const radians: number = (box.rotation * Math.PI) / 180;
    const dx: number = (x - 0.5) * box.width;
    const dy: number = (y - 0.5) * box.height;
    return {
        x: box.x + box.width / 2 + Math.cos(radians) * dx - Math.sin(radians) * dy,
        y: box.y + box.height / 2 + Math.sin(radians) * dx + Math.cos(radians) * dy,
    };
}
function box(document: DesignDocument, id: string): DesignBox {
    const result: DesignBox | undefined = new DesignLayoutEngine(document, 'page-1')
        .solve()
        .boxes.find((entry: DesignBox): boolean => entry.id === id);
    if (result === undefined) {
        throw new Error('Missing pivot layer');
    }
    return result;
}
function source(rotation: number, horizontal: boolean): DesignDocument {
    const document: DesignDocument = DesignDefaults.document('pivot-resize');
    const parent: DesignNode = DesignDefaults.node('parent', 'frame');
    const frame: DesignNode = DesignDefaults.node('frame', 'frame');
    const child: DesignNode = DesignDefaults.node('child', 'rectangle');
    return {
        ...document,
        pages: document.pages.map((page): typeof page => ({ ...page, roots: [parent.id] })),
        nodes: [
            {
                ...parent,
                x: 100,
                y: 80,
                rotation: 19,
                children: [frame.id],
                placement: {
                    ...parent.placement,
                    width: DesignSizing.Hug,
                    height: DesignSizing.Hug,
                },
            },
            {
                ...frame,
                parentId: parent.id,
                x: 70,
                y: 60,
                width: 200,
                height: 140,
                rotation,
                children: [child.id],
                placement: {
                    ...frame.placement,
                    width: horizontal ? DesignSizing.Fixed : DesignSizing.Hug,
                    height: horizontal ? DesignSizing.Hug : DesignSizing.Fixed,
                },
            },
            { ...child, parentId: frame.id, x: 16, y: 20, width: 110, height: 70 },
        ],
    };
}

for (const edge of edges) {
    for (const rotation of [0, 27, 90, 180]) {
        test(
            edge.name +
                ' resize at ' +
                String(rotation) +
                ' retains its world pivot and the other Hug axis',
            (): void => {
                const before: DesignDocument = source(rotation, edge.horizontal);
                const original: DesignBox = box(before, 'frame');
                const expected: Point = point(original, edge.anchorX, edge.anchorY);
                const operations: readonly DesignOperation[] = DesignOperationCodec.operations([
                    {
                        op: 'resize',
                        pageId: 'page-1',
                        selection: ['frame'],
                        ...(edge.horizontal
                            ? { width: original.width + 73 }
                            : { height: original.height + 57 }),
                        anchorX: edge.anchorX,
                        anchorY: edge.anchorY,
                    },
                ]);
                const result: DesignEditResult = DesignEdits.apply(before, operations);
                const resized: DesignBox = box(result.document, 'frame');
                const actual: Point = point(resized, edge.anchorX, edge.anchorY);
                expect(actual.x).toBeCloseTo(expected.x, 6);
                expect(actual.y).toBeCloseTo(expected.y, 6);
                expect(edge.horizontal ? resized.width : resized.height).toBeCloseTo(
                    edge.horizontal ? original.width + 73 : original.height + 57,
                    6,
                );
                expect(
                    result.document.nodes.find((node: DesignNode): boolean => node.id === 'frame')
                        ?.placement[edge.horizontal ? 'height' : 'width'],
                ).toBe(DesignSizing.Hug);
                expect(
                    result.document.nodes.find((node: DesignNode): boolean => node.id === 'child'),
                ).toEqual(before.nodes.find((node: DesignNode): boolean => node.id === 'child'));
                const oldCorner: Point = point(box(before, 'parent'), 0, 0);
                const newCorner: Point = point(box(result.document, 'parent'), 0, 0);
                expect(newCorner.x).toBeCloseTo(oldCorner.x, 6);
                expect(newCorner.y).toBeCloseTo(oldCorner.y, 6);
                expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
                    before.nodes,
                );
            },
        );
    }
}

test('resize pivots reject incomplete, ambiguous, unbounded and multi-selection requests', (): void => {
    const base: DesignOperation = {
        op: 'resize',
        pageId: 'page-1',
        selection: ['frame'],
        width: 240,
    };
    for (const extra of [
        { anchorX: 0 },
        { anchorY: 0.5 },
        { anchorX: -0.1, anchorY: 0 },
        { anchorX: 0, anchorY: 1.1 },
        { anchorX: Infinity, anchorY: 0 },
        { anchorX: 0, anchorY: 0.5, x: 20 },
        { anchorX: 0, anchorY: 0.5, y: 20 },
        { anchorX: 0, anchorY: 0.5, selection: ['frame', 'child'] },
    ]) {
        expect((): readonly DesignOperation[] =>
            DesignOperationCodec.operations([{ ...base, ...extra }]),
        ).toThrow();
    }
});

test('native clamping retains the pivot at the accepted dimensions', (): void => {
    const original: DesignDocument = source(27, true);
    const before: DesignDocument = {
        ...original,
        nodes: original.nodes.map((node: DesignNode): DesignNode =>
            node.id === 'frame'
                ? {
                      ...node,
                      placement: { ...node.placement, maxWidth: 260 },
                  }
                : node,
        ),
    };
    const expected: Point = point(box(before, 'frame'), 1, 0.5);
    const result: DesignEditResult = DesignEdits.apply(before, [
        {
            op: 'resize',
            pageId: 'page-1',
            selection: ['frame'],
            width: 1000,
            anchorX: 1,
            anchorY: 0.5,
        },
    ]);
    const resized: DesignBox = box(result.document, 'frame');
    expect(resized.width).toBe(260);
    const actual: Point = point(resized, 1, 0.5);
    expect(actual.x).toBeCloseTo(expected.x, 6);
    expect(actual.y).toBeCloseTo(expected.y, 6);
    expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
        before.nodes,
    );
});

test('explicit anchors reject flow-owned roots while ordinary one-axis resize keeps the parent layout in control', (): void => {
    const original: DesignDocument = source(0, true);
    const before: DesignDocument = {
        ...original,
        nodes: original.nodes.map((node: DesignNode): DesignNode =>
            node.id === 'parent'
                ? {
                      ...node,
                      layout: { ...node.layout, flow: DesignFlow.Row },
                  }
                : node,
        ),
    };
    expect((): DesignEditResult =>
        DesignEdits.apply(before, [
            {
                op: 'resize',
                pageId: 'page-1',
                selection: ['frame'],
                width: 280,
                anchorX: 0,
                anchorY: 0.5,
            },
        ]),
    ).toThrow('absolute positioning');
    const result: DesignEditResult = DesignEdits.apply(before, [
        {
            op: 'resize',
            pageId: 'page-1',
            selection: ['frame'],
            width: 280,
        },
    ]);
    expect(box(result.document, 'frame').width).toBe(280);
    expect(
        result.document.nodes.find((node: DesignNode): boolean => node.id === 'frame')?.placement
            .height,
    ).toBe(DesignSizing.Hug);
    expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
        before.nodes,
    );
});
