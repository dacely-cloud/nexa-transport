import { expect, test } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignRequestCodec } from '../src/design/DesignRequestCodec.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import {
    DesignKind,
    DesignConstraint,
    type DesignNode,
    type DesignDocument,
} from '../src/design/DesignTypes.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';

test('the generated gateway contract carries visible positioning, pins and preserved instance-content baselines', (): void => {
    const frame: DesignNode = DesignDefaults.node('frame', DesignKind.Frame);
    const child: DesignNode = DesignDefaults.node('child', DesignKind.Frame);
    const badge: DesignNode = DesignDefaults.node('badge', DesignKind.Rectangle);
    const source: DesignDocument = DesignEdits.apply(DesignDefaults.document('canvas'), [
        {
            op: 'insert',
            parentId: null,
            pageId: 'page-1',
            index: 0,
            node: { ...frame, width: 400, placement: { ...frame.placement, minWidth: 600 } },
        },
        {
            op: 'insert',
            parentId: 'frame',
            pageId: 'page-1',
            index: 0,
            node: {
                ...child,
                x: 30,
                width: 100,
                placement: { ...child.placement, horizontal: DesignConstraint.Scale },
            },
        },
        {
            op: 'insert',
            parentId: 'child',
            pageId: 'page-1',
            index: 0,
            node: {
                ...badge,
                x: 80,
                width: 12,
                placement: { ...badge.placement, horizontal: DesignConstraint.End },
            },
        },
    ]).document;
    const request: DesignSaveRequest = {
        id: 'canvas',
        expectedRevision: '1',
        commandId: 'position',
        operations: [
            {
                op: 'position',
                id: 'child',
                pageId: 'page-1',
                x: 220,
                horizontal: DesignConstraint.End,
            },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    const external: unknown = JSON.parse(JSON.stringify(request));
    const received: DesignSaveRequest = DesignRequestCodec.save(external);
    const positioned: DesignDocument = DesignEdits.apply(source, received.operations).document;
    const layout: DesignLayoutEngine = new DesignLayoutEngine(positioned, 'page-1');
    layout.solve();
    expect(layout.position('child')).toMatchObject({ x: 220, width: 150 });
    expect(layout.position('badge')).toMatchObject({ x: 130, width: 12 });
    const node: DesignNode | undefined = positioned.nodes.find(
        (node: DesignNode): boolean => node.id === 'child',
    );
    expect(node?.placement.contentReferenceWidth).toBe(100);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [{ op: 'update', id: 'child', changes: { placement: node?.placement } }],
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                {
                    op: 'update',
                    id: 'child',
                    changes: { placement: { ...node?.placement, contentReferenceWidth: '100' } },
                },
            ],
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [{ op: 'position', id: 'child', pageId: 'page-1', horizontal: 'right' }],
        }),
    ).toBe(false);
    expect((): DesignSaveRequest =>
        DesignRequestCodec.save({
            ...request,
            operations: [
                {
                    op: 'update',
                    id: 'child',
                    changes: { placement: { ...node?.placement, contentReferenceWidth: 0 } },
                },
            ],
        }),
    ).toThrow();
    expect((): DesignSaveRequest =>
        DesignRequestCodec.save({
            ...request,
            operations: [{ op: 'position', id: 'child', pageId: 'page-1' }],
        }),
    ).toThrow();
});
