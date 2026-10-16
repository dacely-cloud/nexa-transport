// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignRequestCodec } from '../src/design/DesignRequestCodec.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import type { DesignDocument, DesignNode, DesignBox } from '../src/design/DesignTypes.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';

it('round-trips the compact native reparent contract and preserves world geometry and source content', (): void => {
    const base: DesignDocument = DesignDefaults.document('reparent');
    const template: DesignNode = DesignDefaults.node('label', 'text');
    if (template.text === null) {
        throw new Error('Missing text template');
    }
    const source: DesignDocument = {
        ...base,
        pages: [
            { id: 'page-1', name: 'Page', background: '#FFFFFF', roots: ['source', 'destination'] },
        ],
        nodes: [
            {
                ...DesignDefaults.node('source', 'frame'),
                width: 500,
                height: 300,
                rotation: 27,
                children: ['label'],
            },
            {
                ...DesignDefaults.node('destination', 'frame'),
                x: 700,
                width: 500,
                height: 300,
                rotation: -19,
            },
            {
                ...template,
                parentId: 'source',
                x: 20,
                y: 20,
                width: 200,
                height: 80,
                text: { ...template.text, content: 'Private source.\n'.repeat(4000) },
            },
        ],
    };
    const request: DesignSaveRequest = {
        id: source.id,
        expectedRevision: source.revision,
        commandId: 'reparent',
        operations: [
            {
                op: 'reparent',
                pageId: 'page-1',
                selection: ['label'],
                parentId: 'destination',
                index: 0,
            },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    const raw: unknown = JSON.parse(JSON.stringify(request));
    const received: DesignSaveRequest = DesignRequestCodec.save(raw);
    const result: DesignEditResult = DesignEdits.apply(source, received.operations);
    const before: DesignBox | undefined = new DesignLayoutEngine(source, 'page-1')
        .solve()
        .boxes.find((value: DesignBox): boolean => value.id === 'label');
    const after: DesignBox | undefined = new DesignLayoutEngine(result.document, 'page-1')
        .solve()
        .boxes.find((value: DesignBox): boolean => value.id === 'label');
    if (before === undefined || after === undefined) {
        throw new Error('Missing label geometry');
    }
    for (const field of ['x', 'y', 'width', 'height', 'rotation'] as const) {
        expect(after[field]).toBeCloseTo(before[field], 5);
    }
    expect(
        result.document.nodes.find((value: DesignNode): boolean => value.id === 'label')?.text,
    ).toEqual(source.nodes.find((value: DesignNode): boolean => value.id === 'label')?.text);
    expect(DesignEdits.restore(result.document, result.changes).document).toEqual(source);
    for (const bad of [
        { ...request, operations: [{ ...request.operations[0], selection: 'label' }] },
        { ...request, operations: [{ ...request.operations[0], index: '0' }] },
    ]) {
        expect(methodValidators[Method.DesignSave].params(bad)).toBe(false);
        expect((): DesignSaveRequest => DesignRequestCodec.save(bad)).toThrow();
    }
    for (const invalid of [
        { ...request, operations: [{ ...request.operations[0], selection: [] }] },
        { ...request, operations: [{ ...request.operations[0], index: -1 }] },
        { ...request, operations: [{ ...request.operations[0], text: 'unwanted source' }] },
    ]) {
        expect((): DesignSaveRequest => DesignRequestCodec.save(invalid)).toThrow();
    }
});
