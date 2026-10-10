// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignRequestCodec } from '../src/design/DesignRequestCodec.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignKind, type DesignNode } from '../src/design/DesignTypes.js';
import { DesignMaskMode } from '../src/design/DesignMaskTypes.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';

test('wire validators accept retained mask inserts and reject malformed mask records', (): void => {
    const node: DesignNode = DesignDefaults.node('mask', DesignKind.Mask);
    const request: DesignSaveRequest = {
        id: 'design',
        expectedRevision: '1',
        commandId: 'mask-insert',
        operations: [{ op: 'insert', node, parentId: null, pageId: 'page', index: 0 }],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                {
                    op: 'insert',
                    node: { ...node, mask: { mode: 'invalid', sourceId: null } },
                    parentId: null,
                    pageId: 'page',
                    index: 0,
                },
            ],
        }),
    ).toBe(false);
});
test('wire validators accept all modes and explicit release without permitting owner fields', (): void => {
    for (const mode of Object.values(DesignMaskMode)) {
        const request: DesignSaveRequest = {
            id: 'design',
            expectedRevision: '1',
            commandId: 'mode',
            operations: [
                { op: 'update', id: 'mask', changes: { mask: { mode, sourceId: 'source' } } },
            ],
        };
        expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    }
    const released: DesignSaveRequest = {
        id: 'design',
        expectedRevision: '1',
        commandId: 'release',
        operations: [{ op: 'update', id: 'mask', changes: { kind: DesignKind.Group, mask: null } }],
    };
    expect(methodValidators[Method.DesignSave].params(released)).toBe(true);
    expect((): DesignSaveRequest =>
        DesignRequestCodec.save({ ...released, owner: 'another-user' }),
    ).toThrow();
});
