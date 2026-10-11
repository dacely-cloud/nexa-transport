import { expect, test } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignRequestCodec } from '../src/design/DesignRequestCodec.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignKind, type DesignNode, type DesignDocument } from '../src/design/DesignTypes.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';

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
