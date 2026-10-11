import { expect, test } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignRequestCodec } from '../src/design/DesignRequestCodec.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignKind, type DesignNode, type DesignDocument } from '../src/design/DesignTypes.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import { DesignSelectionContext } from '../src/design/DesignSelectionContext.js';

test('the actual generated gateway contract carries resize intent and optional constraint baselines', (): void => {
    const frame: DesignNode = DesignDefaults.node('frame', DesignKind.Frame);
    const child: DesignNode = DesignDefaults.node('child', DesignKind.Rectangle);
    const source: DesignDocument = DesignEdits.apply(DesignDefaults.document('canvas'), [
        {
            op: 'insert',
            parentId: null,
            pageId: 'page-1',
            index: 0,
            node: { ...frame, width: 300 },
        },
        {
            op: 'insert',
            parentId: 'frame',
            pageId: 'page-1',
            index: 0,
            node: {
                ...child,
                x: 30,
                width: 80,
                placement: { ...child.placement, horizontal: 'end' },
            },
        },
    ]).document;
    const request: DesignSaveRequest = {
        id: 'canvas',
        expectedRevision: '1',
        commandId: 'resize',
        operations: [{ op: 'resize', pageId: 'page-1', selection: ['frame'], width: 420 }],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    const external: unknown = JSON.parse(JSON.stringify(request));
    const received: DesignSaveRequest = DesignRequestCodec.save(external);
    const resized: DesignDocument = DesignEdits.apply(source, received.operations).document;
    expect(
        new DesignLayoutEngine(resized, 'page-1')
            .solve()
            .boxes.find((box): boolean => box.id === 'child')?.x,
    ).toBe(150);
    const node: DesignNode | undefined = resized.nodes.find(
        (node: DesignNode): boolean => node.id === 'child',
    );
    expect(node?.placement.referenceWidth).toBe(420);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [{ op: 'update', id: 'child', changes: { placement: node?.placement } }],
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [{ ...request.operations[0], width: '420' }],
        }),
    ).toBe(false);
    expect((): DesignSaveRequest =>
        DesignRequestCodec.save({
            ...request,
            operations: [{ op: 'resize', pageId: 'page-1', selection: ['frame'] }],
        }),
    ).toThrow();
});

test('the gateway resize keeps a rotated Hug parent anchored and rebases the nested end-pinned badge', (): void => {
    const parent: DesignNode = DesignDefaults.node('parent', DesignKind.Frame);
    const frame: DesignNode = DesignDefaults.node('frame', DesignKind.Frame);
    const badge: DesignNode = DesignDefaults.node('badge', DesignKind.Rectangle);
    const source: DesignDocument = DesignEdits.apply(DesignDefaults.document('canvas'), [
        {
            op: 'insert',
            parentId: null,
            pageId: 'page-1',
            index: 0,
            node: {
                ...parent,
                x: 80,
                y: 60,
                rotation: 33,
                width: 500,
                height: 300,
                placement: { ...parent.placement, width: 'hug', height: 'hug' },
            },
        },
        {
            op: 'insert',
            parentId: 'parent',
            pageId: 'page-1',
            index: 0,
            node: {
                ...frame,
                x: 100,
                y: 80,
                width: 180,
                height: 120,
                placement: {
                    ...frame.placement,
                    horizontal: 'end',
                    vertical: 'center',
                    referenceWidth: 280,
                    referenceHeight: 200,
                },
            },
        },
        {
            op: 'insert',
            parentId: 'frame',
            pageId: 'page-1',
            index: 0,
            node: {
                ...badge,
                x: 160,
                y: 100,
                width: 12,
                height: 8,
                placement: { ...badge.placement, horizontal: 'end', vertical: 'end' },
            },
        },
    ]).document;
    const request: DesignSaveRequest = {
        id: 'canvas',
        expectedRevision: '1',
        commandId: 'resize-hug',
        operations: [{ op: 'resize', pageId: 'page-1', selection: ['frame'], width: 320 }],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    const external: unknown = JSON.parse(JSON.stringify(request));
    const received: DesignSaveRequest = DesignRequestCodec.save(external);
    const result: ReturnType<typeof DesignEdits.apply> = DesignEdits.apply(
        source,
        received.operations,
    );
    const before: DesignSelectionContext = new DesignSelectionContext(source, 'page-1', ['frame']);
    const after: DesignSelectionContext = new DesignSelectionContext(result.document, 'page-1', [
        'frame',
    ]);
    const original: ReturnType<typeof DesignSelectionContext.corner> =
        DesignSelectionContext.corner(before.box('parent'));
    const current: ReturnType<typeof DesignSelectionContext.corner> = DesignSelectionContext.corner(
        after.box('parent'),
    );
    expect(current.x).toBeCloseTo(original.x, 7);
    expect(current.y).toBeCloseTo(original.y, 7);
    expect(after.local(after.box('frame'), 'parent').x).toBeCloseTo(100, 7);
    expect(after.local(after.box('frame'), 'parent').y).toBeCloseTo(80, 7);
    expect(after.box('frame').width).toBeCloseTo(320, 7);
    expect(after.local(after.box('badge'), 'frame').x).toBeCloseTo(300, 7);
    expect(after.node('parent').placement.width).toBe('hug');
    expect(after.node('parent').placement.height).toBe('hug');
    expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
        source.nodes,
    );
});
