// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';

test('typed native arc commands carry four bounded settings without curve bodies', (): void => {
    const request: DesignSaveRequest = {
        id: 'design',
        expectedRevision: '2',
        commandId: 'arc',
        operations: [
            {
                op: 'arc',
                id: 'ring',
                pageId: 'page-1',
                changes: { start: -90, sweep: 270, innerRadius: 0.6, closed: true },
            },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    expect(JSON.stringify(request).length).toBeLessThan(260);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                {
                    op: 'arc',
                    id: 'ring',
                    pageId: 'page-1',
                    changes: { start: -90, sweep: 361, innerRadius: 0.6, closed: true },
                },
            ],
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                {
                    op: 'arc',
                    id: 'ring',
                    pageId: 'page-1',
                    changes: { start: -90, sweep: 270, innerRadius: 0.6, closed: true, path: [] },
                },
            ],
        }),
    ).toBe(false);
    expect((): ReturnType<typeof DesignOperationCodec.operations> =>
        DesignOperationCodec.operations([
            {
                op: 'arc',
                id: 'ring',
                pageId: 'page-1',
                changes: { start: 0, sweep: 90, innerRadius: 0.6, closed: false },
            },
        ]),
    ).toThrow(/open arc/);
});
