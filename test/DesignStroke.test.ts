// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import type { DesignDocument } from '../src/design/DesignTypes.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';

it('compact stroke edits use the existing typed save method and reject invalid wire fields', (): void => {
    const request: DesignSaveRequest = {
        id: 'layout',
        expectedRevision: '2',
        commandId: 'stroke',
        operations: [
            {
                op: 'stroke',
                id: 'hero',
                pageId: 'page-1',
                changes: { cap: 'square', join: 'miter', miterLimit: 2 },
            },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [{ ...request.operations[0], changes: null }],
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [{ ...request.operations[0], changes: { cap: 'triangle' } }],
        }),
    ).toBe(false);
    expect((): ReturnType<typeof DesignOperationCodec.operations> =>
        DesignOperationCodec.operations([
            { ...request.operations[0], changes: { content: 'replace' } },
        ]),
    ).toThrow();
    expect(JSON.stringify(request).length).toBeLessThan(300);
});
it('portable stroke edits preserve paint and undo the exact previous layer', (): void => {
    const source: DesignDocument = DesignDefaults.document('stroke');
    const inserted: DesignEditResult = DesignEdits.apply(source, [
        {
            op: 'insert',
            pageId: 'page-1',
            parentId: null,
            index: 0,
            node: DesignDefaults.node('hero', 'rectangle'),
        },
    ]);
    const edited: DesignEditResult = DesignEdits.apply(inserted.document, [
        { op: 'stroke', id: 'hero', pageId: 'page-1', changes: { width: 4, cap: 'square' } },
    ]);
    expect(edited.document.nodes[0]?.style.stroke).toMatchObject({ width: 4, cap: 'square' });
    expect(edited.document.nodes[0]?.style.fills).toEqual(inserted.document.nodes[0]?.style.fills);
    expect(DesignEdits.restore(edited.document, edited.changes).document).toEqual(
        inserted.document,
    );
});
