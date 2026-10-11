// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignRequestCodec } from '../src/design/DesignRequestCodec.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import {
    DesignKind,
    type DesignNode,
    type DesignDocument,
    type DesignBox,
} from '../src/design/DesignTypes.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import { DesignFlowOrdering } from '../src/design/DesignFlowOrdering.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';

test('generated transport validates mixed flow reorders and free translation as one undoable operation', (): void => {
    const frame: DesignNode = DesignDefaults.node('frame', DesignKind.Frame);
    const first: DesignNode = DesignDefaults.node('first');
    const second: DesignNode = DesignDefaults.node('second');
    const floating: DesignNode = DesignDefaults.node('floating');
    const source: DesignDocument = DesignCodec.document({
        ...DesignDefaults.document('mixed'),
        pages: [{ id: 'page-1', name: 'Page', background: '#FFFFFF', roots: ['frame'] }],
        nodes: [
            {
                ...frame,
                rotation: 29,
                children: ['first', 'second', 'floating'],
                layout: { ...frame.layout, flow: 'row', gap: 20 },
            },
            { ...first, parentId: 'frame', width: 40, height: 40 },
            { ...second, parentId: 'frame', width: 40, height: 40 },
            {
                ...floating,
                parentId: 'frame',
                x: 20,
                y: 80,
                width: 20,
                height: 20,
                placement: { ...floating.placement, absolute: true },
            },
        ],
    });
    const request: DesignSaveRequest = {
        id: 'mixed',
        expectedRevision: '1',
        commandId: 'move',
        operations: [
            {
                op: 'translate',
                pageId: 'page-1',
                selection: ['first', 'floating'],
                dx: 47,
                dy: -23,
                reorders: DesignFlowOrdering.keyboard(source, 'page-1', ['first', 'floating'], {
                    x: 1,
                    y: 0,
                }),
            },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    const external: unknown = JSON.parse(JSON.stringify(request));
    const received: DesignSaveRequest = DesignRequestCodec.save(external);
    const result: DesignEditResult = DesignEdits.apply(source, received.operations);
    const before: DesignBox | undefined = new DesignLayoutEngine(source, 'page-1')
        .solve()
        .boxes.find((box: DesignBox): boolean => box.id === 'floating');
    const after: DesignBox | undefined = new DesignLayoutEngine(result.document, 'page-1')
        .solve()
        .boxes.find((box: DesignBox): boolean => box.id === 'floating');
    if (before === undefined || after === undefined) {
        throw new Error('Missing transported floating layer');
    }
    expect(after.x - before.x).toBeCloseTo(47, 6);
    expect(after.y - before.y).toBeCloseTo(-23, 6);
    expect(
        result.document.nodes.find((node: DesignNode): boolean => node.id === 'frame')?.children,
    ).toEqual(['second', 'first', 'floating']);
    expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
        source.nodes,
    );
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                {
                    op: 'translate',
                    pageId: 'page-1',
                    selection: ['first'],
                    dx: 0,
                    dy: 0,
                    reorders: [{ id: 'first', index: '1' }],
                },
            ],
        }),
    ).toBe(false);
});

test('the generated gateway contract carries one world translation and preserves rotated Hug artwork', (): void => {
    const frame: DesignNode = DesignDefaults.node('frame', DesignKind.Frame);
    const card: DesignNode = DesignDefaults.node('card', DesignKind.Frame);
    const badge: DesignNode = DesignDefaults.node('badge', DesignKind.Rectangle);
    const source: DesignDocument = DesignCodec.document({
        ...DesignDefaults.document('canvas'),
        pages: [{ id: 'page-1', name: 'Page', background: '#FFFFFF', roots: ['frame'] }],
        nodes: [
            {
                ...frame,
                width: 500,
                height: 300,
                rotation: 29,
                children: ['card'],
                placement: { ...frame.placement, width: 'hug' },
            },
            {
                ...card,
                parentId: 'frame',
                x: 100,
                y: 90,
                width: 180,
                height: 120,
                children: ['badge'],
                placement: {
                    ...card.placement,
                    width: 'hug',
                    height: 'hug',
                    horizontal: 'end',
                    vertical: 'center',
                },
            },
            {
                ...badge,
                parentId: 'card',
                x: 140,
                y: 80,
                width: 20,
                height: 12,
                placement: { ...badge.placement, horizontal: 'end', vertical: 'end' },
            },
        ],
    });
    const request: DesignSaveRequest = {
        id: source.id,
        expectedRevision: source.revision,
        commandId: 'translate',
        operations: [{ op: 'translate', pageId: 'page-1', selection: ['card'], dx: 70, dy: -25 }],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    const raw: unknown = JSON.parse(JSON.stringify(request));
    const received: DesignSaveRequest = DesignRequestCodec.save(raw);
    const moved: DesignDocument = DesignEdits.apply(source, received.operations).document;
    const before: readonly DesignBox[] = new DesignLayoutEngine(source, 'page-1').solve().boxes;
    const after: readonly DesignBox[] = new DesignLayoutEngine(moved, 'page-1').solve().boxes;
    for (const id of ['card', 'badge']) {
        const original: DesignBox | undefined = before.find(
            (box: DesignBox): boolean => box.id === id,
        );
        const current: DesignBox | undefined = after.find(
            (box: DesignBox): boolean => box.id === id,
        );
        if (original === undefined || current === undefined) {
            throw new Error('Missing translated artwork');
        }
        expect(current.x - original.x).toBeCloseTo(70, 6);
        expect(current.y - original.y).toBeCloseTo(-25, 6);
        expect(current.width).toBeCloseTo(original.width, 6);
        expect(current.height).toBeCloseTo(original.height, 6);
    }
    for (const operation of [
        { op: 'translate', pageId: 'page-1', selection: ['card'], dx: '70', dy: -25 },
        { op: 'translate', pageId: 'page-1', selection: ['card'], dx: 70 },
    ]) {
        expect(
            methodValidators[Method.DesignSave].params({ ...request, operations: [operation] }),
        ).toBe(false);
    }
    expect((): DesignSaveRequest =>
        DesignRequestCodec.save({
            ...request,
            operations: [
                { op: 'translate', pageId: 'page-1', selection: ['card'], dx: 70, dy: -25, x: 70 },
            ],
        }),
    ).toThrow();
    expect((): DesignSaveRequest =>
        DesignRequestCodec.save({
            ...request,
            operations: [
                { op: 'translate', pageId: 'page-1', selection: ['card', 'card'], dx: 70, dy: -25 },
            ],
        }),
    ).toThrow();
});
