// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignLayoutCodec } from '../src/design/DesignLayoutCodec.js';
import { DesignFlowOrdering } from '../src/design/DesignFlowOrdering.js';
import type { DesignOperation } from '../src/design/DesignOperationTypes.js';
import type {
    DesignBox,
    DesignDocument,
    DesignLayout,
    DesignNode,
} from '../src/design/DesignTypes.js';

function create(
    layout: Partial<DesignLayout>,
    sizes: readonly number[],
    row: boolean = true,
    width: number = 200,
    height: number = 200,
    hug: boolean = true,
    fill: boolean = false,
): DesignDocument {
    const base: DesignNode = DesignDefaults.node('stack', 'frame');
    const frame: DesignNode = {
        ...base,
        width,
        height,
        layout: { ...base.layout, flow: row ? 'row' : 'column', ...layout },
        placement: {
            ...base.placement,
            width: hug && row ? 'hug' : 'fixed',
            height: hug && !row ? 'hug' : 'fixed',
        },
    };
    const operations: DesignOperation[] = [
        { op: 'insert', node: frame, parentId: null, pageId: 'page-1', index: 0 },
    ];
    for (let index: number = 0; index < sizes.length; index++) {
        const size: number | undefined = sizes[index];
        if (size === undefined) {
            throw new Error('Missing fixture size');
        }
        const node: DesignNode = DesignDefaults.node('item-' + index.toString(), 'rectangle');
        operations.push({
            op: 'insert',
            node: {
                ...node,
                width: row ? size : 40,
                height: row ? 40 : size,
                placement: {
                    ...node.placement,
                    ...(fill ? { width: 'fill', height: 'fill' } : {}),
                },
            },
            parentId: frame.id,
            pageId: 'page-1',
            index,
        });
    }
    return DesignEdits.apply(DesignDefaults.document('overlap'), operations).document;
}
function boxes(document: DesignDocument): readonly DesignBox[] {
    return new DesignLayoutEngine(document, 'page-1').solve().boxes;
}
function box(document: DesignDocument, id: string): DesignBox {
    const value: DesignBox | undefined = boxes(document).find(
        (entry: DesignBox): boolean => entry.id === id,
    );
    if (value === undefined) {
        throw new Error('Missing overlap fixture box');
    }
    return value;
}

for (const row of [true, false]) {
    test(
        'signed ' +
            (row ? 'row' : 'column') +
            ' gaps preserve ordered overlapping children and Hug bounds',
        (): void => {
            const document: DesignDocument = create({ gap: -12 }, [40, 40, 40], row);
            expect(box(document, 'stack')[row ? 'width' : 'height']).toBe(96);
            expect(
                [0, 1, 2].map(
                    (index: number): number =>
                        box(document, 'item-' + index.toString())[row ? 'x' : 'y'],
                ),
            ).toEqual([0, 28, 56]);
            expect(
                document.nodes.find((node: DesignNode): boolean => node.id === 'stack')?.children,
            ).toEqual(['item-0', 'item-1', 'item-2']);
        },
    );
    test(
        'oversized negative ' +
            (row ? 'row' : 'column') +
            ' gaps retain the complete occupied envelope',
        (): void => {
            const document: DesignDocument = create({ gap: -140 }, [100, 20], row);
            expect(box(document, 'stack')[row ? 'width' : 'height']).toBe(140);
            expect(box(document, 'item-0')[row ? 'x' : 'y']).toBe(40);
            expect(box(document, 'item-1')[row ? 'x' : 'y']).toBe(0);
        },
    );
}

test('keyboard reorder follows reversed wrapped lines without changing their content', (): void => {
    const document: DesignDocument = create(
        { wrap: true, gap: 0, rowGap: -60 },
        [80, 80, 80],
        true,
        100,
        200,
        false,
    );
    expect(DesignFlowOrdering.keyboard(document, 'page-1', ['item-1'], { x: 0, y: 1 })).toEqual([
        { id: 'item-1', index: 0 },
    ]);
});

for (const align of ['center', 'end'] as const) {
    test(
        'overlap alignment uses the occupied width rather than the last child endpoint: ' + align,
        (): void => {
            const document: DesignDocument = create(
                { gap: -80, justify: align },
                [100, 20],
                true,
                200,
                100,
                false,
            );
            expect(box(document, 'item-0').x).toBe(align === 'center' ? 50 : 100);
            expect(box(document, 'item-1').x).toBe(align === 'center' ? 70 : 120);
        },
    );
}

for (const row of [true, false]) {
    test(
        'wrapping uses occupied bounds and signed line gaps for ' + (row ? 'rows' : 'columns'),
        (): void => {
            const document: DesignDocument = create(
                { wrap: true, gap: -20, rowGap: -10 },
                [80, 80, 80],
                row,
                row ? 140 : 200,
                row ? 200 : 140,
                false,
            );
            const frame: DesignNode | undefined = document.nodes.find(
                (node: DesignNode): boolean => node.id === 'stack',
            );
            if (frame === undefined) {
                throw new Error('Missing wrapping frame');
            }
            const measured: DesignDocument = DesignEdits.apply(document, [
                {
                    op: 'update',
                    id: frame.id,
                    changes: {
                        placement: { ...frame.placement, [row ? 'height' : 'width']: 'hug' },
                    },
                },
            ]).document;
            expect(box(measured, 'stack')[row ? 'height' : 'width']).toBe(70);
            expect(box(measured, 'item-1')[row ? 'x' : 'y']).toBe(60);
            expect(box(measured, 'item-2')[row ? 'y' : 'x']).toBe(30);
        },
    );
}

test('a fixed Fill row allocates its intentional overlap while Between overflow stays nonoverlapping', (): void => {
    const original: DesignDocument = create({ gap: -20 }, [80, 10], true, 100, 40, false);
    const second: DesignNode | undefined = original.nodes.find(
        (node: DesignNode): boolean => node.id === 'item-1',
    );
    if (second === undefined) {
        throw new Error('Missing Fill child');
    }
    const fill: DesignDocument = DesignEdits.apply(original, [
        {
            op: 'update',
            id: second.id,
            changes: { placement: { ...second.placement, width: 'fill' } },
        },
    ]).document;
    expect(box(fill, second.id)).toMatchObject({ x: 60, width: 40 });
    const between: DesignDocument = create(
        { gap: -20, justify: 'between' },
        [80, 80],
        true,
        100,
        40,
        false,
    );
    expect(box(between, 'item-1').x).toBe(80);
});

for (const row of [true, false]) {
    for (const count of [1, 2]) {
        test(
            'mixed fixed and Fill ' +
                (row ? 'row' : 'column') +
                ' fits occupied bounds with ' +
                count.toString() +
                ' flexible children',
            (): void => {
                const original: DesignDocument = create(
                    { gap: -80 },
                    Array.from({ length: count + 1 }, (): number => 10),
                    row,
                    100,
                    100,
                    false,
                );
                const operations: DesignOperation[] = original.nodes
                    .filter(
                        (node: DesignNode): boolean => node.id !== 'stack' && node.id !== 'item-0',
                    )
                    .map((node: DesignNode): DesignOperation => ({
                        op: 'update',
                        id: node.id,
                        changes: {
                            placement: {
                                ...node.placement,
                                ...(row ? { width: 'fill' } : { height: 'fill' }),
                            },
                        },
                    }));
                const filled: DesignDocument = DesignEdits.apply(original, operations).document;
                const resolved: readonly DesignBox[] = boxes(filled).filter(
                    (value: DesignBox): boolean => value.id !== 'stack',
                );
                for (const value of resolved) {
                    expect(value[row ? 'x' : 'y']).toBeGreaterThanOrEqual(-0.000001);
                    expect(
                        value[row ? 'x' : 'y'] + value[row ? 'width' : 'height'],
                    ).toBeLessThanOrEqual(100.000001);
                    expect(value[row ? 'width' : 'height']).toBeCloseTo(
                        value.id === 'item-0' ? 10 : count === 1 ? 100 : 90,
                        6,
                    );
                }
                expect(box(filled, 'item-0')[row ? 'width' : 'height']).toBe(10);
            },
        );
    }
    for (const minimum of [true, false]) {
        test(
            'mixed overlap Fill ' +
                (row ? 'row' : 'column') +
                ' respects ' +
                (minimum ? 'minimum' : 'maximum') +
                ' limits while filling its envelope',
            (): void => {
                const original: DesignDocument = create(
                    { gap: -80 },
                    [10, 10, 10],
                    row,
                    100,
                    100,
                    false,
                );
                const operations: DesignOperation[] = original.nodes
                    .filter(
                        (node: DesignNode): boolean => node.id !== 'stack' && node.id !== 'item-0',
                    )
                    .map((node: DesignNode): DesignOperation => ({
                        op: 'update',
                        id: node.id,
                        changes: {
                            placement: {
                                ...node.placement,
                                ...(row ? { width: 'fill' } : { height: 'fill' }),
                                ...(node.id === 'item-1'
                                    ? minimum
                                        ? row
                                            ? { minWidth: 95 }
                                            : { minHeight: 95 }
                                        : row
                                          ? { maxWidth: 60 }
                                          : { maxHeight: 60 }
                                    : {}),
                            },
                        },
                    }));
                const filled: DesignDocument = DesignEdits.apply(original, operations).document;
                expect(box(filled, 'item-1')[row ? 'width' : 'height']).toBeCloseTo(
                    minimum ? 95 : 60,
                    6,
                );
                expect(box(filled, 'item-2')[row ? 'width' : 'height']).toBeCloseTo(
                    minimum ? 85 : 100,
                    6,
                );
                const resolved: readonly DesignBox[] = boxes(filled).filter(
                    (value: DesignBox): boolean => value.id !== 'stack',
                );
                const occupied: number =
                    Math.max(
                        ...resolved.map(
                            (value: DesignBox): number =>
                                value[row ? 'x' : 'y'] + value[row ? 'width' : 'height'],
                        ),
                    ) -
                    Math.min(...resolved.map((value: DesignBox): number => value[row ? 'x' : 'y']));
                expect(occupied).toBeCloseTo(100, 6);
            },
        );
    }
}

test('overlapping grid tracks retain positive spanned rectangles and complete Hug height', (): void => {
    const document: DesignDocument = create(
        { flow: 'grid', columns: 2, gap: -20, rowGap: -10 },
        [60, 60, 60, 60],
        true,
        100,
        200,
        false,
        true,
    );
    const frame: DesignNode | undefined = document.nodes.find(
        (node: DesignNode): boolean => node.id === 'stack',
    );
    if (frame === undefined) {
        throw new Error('Missing grid frame');
    }
    const hug: DesignDocument = DesignEdits.apply(document, [
        {
            op: 'update',
            id: frame.id,
            changes: { placement: { ...frame.placement, height: 'hug' } },
        },
    ]).document;
    expect(box(hug, frame.id).height).toBe(70);
    expect(box(hug, 'item-1')).toMatchObject({ x: 40, y: 0, width: 60, height: 40 });
    expect(box(hug, 'item-2')).toMatchObject({ x: 0, y: 30, width: 60, height: 40 });
});

test('extreme grid overlap remains finite and stretching fills the requested occupied height', (): void => {
    const document: DesignDocument = create(
        { flow: 'grid', columns: 1, rowGap: -100 },
        [40, 40],
        true,
        40,
        200,
        false,
        true,
    );
    expect(box(document, 'item-0')).toMatchObject({ y: 0, height: 150 });
    expect(box(document, 'item-1')).toMatchObject({ y: 50, height: 150 });
    const reverse: DesignDocument = create(
        { flow: 'grid', columns: 2, gap: -100, rowGap: -100 },
        [40, 40],
        true,
        40,
        40,
        false,
        true,
    );
    expect(box(reverse, 'item-0')).toMatchObject({ x: 30, width: 70 });
    expect(box(reverse, 'item-1')).toMatchObject({ x: 0, width: 70 });
});

test('signed gap bounds retain nonnegative padding and reject nonfinite or oversized spacing', (): void => {
    const layout: DesignLayout = DesignDefaults.node('layout').layout;
    expect(DesignLayoutCodec.layout({ ...layout, gap: -10000, rowGap: -10000 })).toMatchObject({
        gap: -10000,
        rowGap: -10000,
    });
    for (const gap of [-10000.01, 10000.01, Infinity, NaN]) {
        expect((): void => {
            DesignLayoutCodec.layout({ ...layout, gap });
        }).toThrow();
    }
    expect((): void => {
        DesignLayoutCodec.layout({ ...layout, padding: { ...layout.padding, left: -1 } });
    }).toThrow();
});

for (const row of [true, false]) {
    for (const gap of [-60, -80, -140]) {
        test(
            'keyboard reorder follows visible overlapping ' +
                (row ? 'rows' : 'columns') +
                ' at gap ' +
                gap.toString(),
            (): void => {
                const document: DesignDocument = create({ gap }, [80, 80, 80], row);
                const reorders: ReturnType<typeof DesignFlowOrdering.keyboard> =
                    DesignFlowOrdering.keyboard(
                        document,
                        'page-1',
                        ['item-1'],
                        row ? { x: 1, y: 0 } : { x: 0, y: 1 },
                    );
                expect(reorders).toEqual([{ id: 'item-1', index: gap === -140 ? 0 : 2 }]);
            },
        );
    }
}
