// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignTokenEdits } from '../src/design/DesignTokenEdits.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import type { DesignOperation, DesignEditResult } from '../src/design/DesignOperationTypes.js';
import type { DesignDocument } from '../src/design/DesignTypes.js';

it('transports exact compact saved-color and paint-color operations through the existing save method', (): void => {
    const request: DesignSaveRequest = {
        id: 'colors',
        expectedRevision: '1',
        commandId: 'save',
        operations: [
            {
                op: 'token',
                id: 'brand',
                changes: { name: 'Brand', category: 'color', value: '#AA226688' },
            },
            {
                op: 'paint-color',
                id: 'caption',
                pageId: 'page-1',
                target: 'fill',
                index: 0,
                changes: { tokenId: 'brand', opacity: 0.7 },
            },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    expect(DesignOperationCodec.operations(request.operations)).toEqual(request.operations);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [{ op: 'token', id: 'brand', changes: null }],
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                {
                    op: 'paint-color',
                    id: 'caption',
                    target: 'fill',
                    index: 0,
                    changes: { tokenId: 'brand' },
                },
            ],
        }),
    ).toBe(false);
    expect((): readonly DesignOperation[] =>
        DesignOperationCodec.operations([
            {
                op: 'paint-color',
                id: 'caption',
                pageId: 'page-1',
                target: 'fill',
                index: 0,
                changes: {},
            },
        ]),
    ).toThrow('at least one');
    expect(JSON.stringify(request).length).toBeLessThan(450);
});
it('the portable editor bakes deletion, preserves independent token edits on undo and exposes one-pass reference counts', (): void => {
    const source: DesignDocument = DesignDefaults.document('colors');
    const created: DesignEditResult = DesignEdits.apply(source, [
        {
            op: 'token',
            id: 'brand',
            changes: { name: 'Brand', category: 'color', value: '#AA226688' },
        },
        {
            op: 'insert',
            pageId: 'page-1',
            parentId: null,
            index: 0,
            node: DesignDefaults.node('card', 'frame'),
        },
        {
            op: 'paint-color',
            id: 'card',
            pageId: 'page-1',
            target: 'fill',
            index: 0,
            changes: { tokenId: 'brand' },
        },
    ]);
    expect(DesignTokenEdits.counts(created.document).get('brand')).toBe(1);
    const changed: DesignEditResult = DesignEdits.apply(created.document, [
        { op: 'token', id: 'brand', changes: { value: '#1166CC' } },
    ]);
    const independent: DesignEditResult = DesignEdits.apply(changed.document, [
        {
            op: 'token',
            id: 'other',
            changes: { name: 'Other', category: 'color', value: '#FFFFFF' },
        },
    ]);
    const undone: DesignEditResult = DesignEdits.restore(independent.document, changed.changes);
    expect(undone.document.tokens[0]?.value).toBe('#AA226688');
    expect(undone.document.tokens[1]?.id).toBe('other');
    const deleted: DesignEditResult = DesignEdits.apply(undone.document, [
        { op: 'token', id: 'brand', changes: null },
    ]);
    expect(deleted.document.nodes[0]?.style.fills[0]).toMatchObject({
        tokenId: null,
        color: '#AA226688',
    });
    expect(DesignEdits.restore(deleted.document, deleted.changes).document).toEqual(
        undone.document,
    );
});
