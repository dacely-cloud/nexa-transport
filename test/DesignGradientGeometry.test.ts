// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import type { DesignDocument } from '../src/design/DesignTypes.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';

it('the existing save method admits compact gradient edits and rejects malformed geometry types', (): void => {
    const request: DesignSaveRequest = {
        id: 'layout',
        expectedRevision: '2',
        commandId: 'gradient',
        operations: [
            {
                op: 'paint-gradient',
                id: 'hero',
                pageId: 'page-1',
                target: 'fill',
                index: 0,
                changes: {
                    kind: 'radial',
                    gradient: {
                        startX: 0.3,
                        startY: 0.4,
                        endX: 0.8,
                        endY: 0.4,
                        axisX: 0.3,
                        axisY: 0.8,
                    },
                },
            },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                { ...request.operations[0], changes: { gradient: { startX: 'invalid' } } },
            ],
        }),
    ).toBe(false);
    expect(JSON.stringify(request).length).toBeLessThan(400);
});
it('portable gradient geometry edits preserve unrelated paints and restore the exact prior document', (): void => {
    const source: DesignDocument = DesignDefaults.document('gradient');
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
        {
            op: 'paint-gradient',
            id: 'hero',
            pageId: 'page-1',
            target: 'fill',
            index: 0,
            changes: { kind: 'linear', gradient: { startX: 0.2, endX: 0.8 } },
        },
    ]);
    expect(edited.document.nodes[0]?.style.fills[0]).toMatchObject({
        kind: 'linear',
        gradient: { startX: 0.2, startY: 0.5, endX: 0.8, endY: 0.5 },
    });
    expect(DesignEdits.restore(edited.document, edited.changes).document).toEqual(
        inserted.document,
    );
});
