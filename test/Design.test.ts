// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignRequestCodec } from '../src/design/DesignRequestCodec.js';
import type {
    DesignCreateRequest,
    DesignSaveRequest,
    DesignReceipt,
    DesignRecordPage,
} from '../src/design/DesignRequests.js';
import type { DesignDocument } from '../src/design/DesignTypes.js';

describe('shared native design contracts', (): void => {
    it('validates named method declarations at the actual parameter and result paths', (): void => {
        const create: DesignCreateRequest = { id: 'design', name: 'A design', commandId: 'create' };
        const receipt: DesignReceipt = {
            summary: {
                id: 'design',
                name: 'A design',
                revision: '1',
                nodeCount: 0,
                pageCount: 1,
                updatedAt: '9007199254740993',
            },
            commandId: 'create',
            actor: 'user',
            previousRevision: null,
            undoable: false,
        };
        expect(methodValidators[Method.DesignCreate].params(create)).toBe(true);
        expect(methodValidators[Method.DesignCreate].result(receipt)).toBe(true);
        expect(methodValidators[Method.DesignCreate].params({ id: 'design', name: 'Name' })).toBe(
            false,
        );
        expect(
            methodValidators[Method.DesignCreate].result({ ...receipt, undoable: 'false' }),
        ).toBe(false);
    });
    it('checks optional edits, complete inserts and paged record shapes', (): void => {
        const save: DesignSaveRequest = {
            id: 'design',
            commandId: 'insert',
            expectedRevision: '1',
            operations: [
                {
                    op: 'insert',
                    node: DesignDefaults.node('card'),
                    parentId: null,
                    pageId: 'page-1',
                    index: 0,
                },
                { op: 'update', id: 'card', changes: { x: 24 } },
            ],
        };
        expect(methodValidators[Method.DesignSave].params(save)).toBe(true);
        expect(
            methodValidators[Method.DesignSave].params({
                ...save,
                operations: [{ op: 'update', id: 'card', changes: { x: 'twenty' } }],
            }),
        ).toBe(false);
        const page: DesignRecordPage = {
            summary: {
                id: 'design',
                name: 'Design',
                revision: '1',
                nodeCount: 1,
                pageCount: 1,
                updatedAt: '0',
            },
            records: [{ kind: 'node', id: 'card', value: DesignDefaults.node('card') }],
            fragment: null,
            nextCursor: null,
        };
        expect(methodValidators[Method.DesignRead].result(page)).toBe(true);
        expect(
            methodValidators[Method.DesignRead].params({
                id: 'design',
                revision: null,
                cursor: null,
                limit: 10,
            }),
        ).toBe(true);
        expect(methodValidators[Method.DesignRead].params({ id: 'design', limit: 10 })).toBe(false);
    });
    it('portable editing and layout preserve authored data and reject owner selection', (): void => {
        const document: DesignDocument = DesignCodec.document(DesignDefaults.document('design'));
        const next: DesignDocument = DesignEdits.apply(document, [
            {
                op: 'insert',
                node: DesignDefaults.node('card'),
                parentId: null,
                pageId: 'page-1',
                index: 0,
            },
        ]).document;
        expect(new DesignLayoutEngine(next, 'page-1').solve().boxes).toMatchObject([
            { id: 'card', width: 160, height: 120 },
        ]);
        expect(document.nodes).toEqual([]);
        expect((): void => {
            DesignRequestCodec.read({
                id: 'design',
                revision: null,
                cursor: null,
                limit: 10,
                owner: 'someone-else',
            });
        }).toThrow('fields');
    });
});
