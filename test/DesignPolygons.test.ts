// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignPolygons } from '../src/design/DesignPolygons.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import type { DesignDocument } from '../src/design/DesignTypes.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';

test('typed native shape edits use compact settings and reject unknown wire fields', (): void => {
    const request: DesignSaveRequest = {
        id: 'shapes',
        expectedRevision: '2',
        commandId: 'points',
        operations: [
            {
                op: 'polygon',
                id: 'badge',
                pageId: 'page-1',
                changes: { points: 7, innerRadius: 0.4 },
            },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    expect(JSON.stringify(request).length).toBeLessThan(220);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                {
                    op: 'polygon',
                    id: 'badge',
                    pageId: 'page-1',
                    changes: { points: 7, innerRadius: 0.4, path: [] },
                },
            ],
        }),
    ).toBe(false);
    expect((): ReturnType<typeof DesignOperationCodec.operations> =>
        DesignOperationCodec.operations([
            {
                op: 'update',
                id: 'badge',
                changes: { polygon: { points: 1000, innerRadius: null } },
            },
        ]),
    ).toThrow();
});

test('portable insertion, regeneration, detachment and undo retain native shape behavior', (): void => {
    const inserted: DesignDocument = DesignEdits.apply(DesignDefaults.document('shapes'), [
        {
            op: 'insert',
            parentId: null,
            pageId: 'page-1',
            index: 0,
            node: {
                ...DesignDefaults.node('badge', 'polygon'),
                polygon: { points: 5, innerRadius: 0.5 },
            },
        },
    ]).document;
    expect(inserted.nodes[0]?.path).toHaveLength(11);
    const edited: DesignEditResult = DesignEdits.apply(inserted, [
        {
            op: 'update',
            id: 'badge',
            changes: { polygon: { points: 6, innerRadius: null }, width: 200 },
        },
    ]);
    expect(edited.document.nodes[0]?.path).toEqual(
        DesignPolygons.path({ points: 6, innerRadius: null }, 200, 120),
    );
    expect(DesignEdits.restore(edited.document, edited.changes).document).toEqual(inserted);
    const detached: DesignDocument = DesignEdits.apply(edited.document, [
        { op: 'polygon', id: 'badge', pageId: 'page-1', changes: null },
    ]).document;
    expect(detached.nodes[0]).not.toHaveProperty('polygon');
    expect(detached.nodes[0]?.path).toEqual(edited.document.nodes[0]?.path);
});
