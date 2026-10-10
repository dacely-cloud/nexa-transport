// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignKind, type DesignDocument, type DesignNode } from '../src/design/DesignTypes.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';
import { SchemaValidator } from '../src/protocol/Schema.js';
import { schema } from '../src/protocol/SchemaData.js';

it('admits content-only text edits at the gateway boundary and rejects malformed content', (): void => {
    const validator: SchemaValidator = new SchemaValidator(schema);
    expect(
        validator.validate('#/definitions/DesignSaveRequest', {
            id: 'canvas',
            expectedRevision: '0',
            commandId: 'text-edit',
            operations: [{ op: 'text', id: 'heading', content: 'Updated heading' }],
        }),
    ).toBe(true);
    expect(
        validator.validate('#/definitions/DesignSaveRequest', {
            id: 'canvas',
            expectedRevision: '0',
            commandId: 'text-edit',
            operations: [{ op: 'text', id: 'heading', content: 42 }],
        }),
    ).toBe(false);
});

function document(content: string = 'Orbit Studio'): DesignDocument {
    const template: DesignNode = DesignDefaults.node('heading', DesignKind.Text);
    if (template.text === null) {
        throw new Error('Missing text template');
    }
    const node: DesignNode = {
        ...template,
        x: 45,
        width: 450,
        text: {
            ...template.text,
            content,
            size: 56,
            weight: 700,
            runs: [
                {
                    start: 1,
                    end: 8,
                    family: 'Inter',
                    size: 30,
                    weight: 500,
                    italic: true,
                    color: '#ff0000',
                    underline: true,
                },
            ],
        },
    };
    return DesignEdits.apply(DesignDefaults.document('canvas'), [
        { op: 'insert', node, parentId: null, pageId: 'page-1', index: 0 },
    ]).document;
}

it('text content edits preserve typography, geometry, other layers and undo', (): void => {
    const source: DesignDocument = document();
    const result: DesignEditResult = DesignEdits.apply(source, [
        { op: 'text', id: 'heading', content: 'Orbit Labs' },
    ]);
    expect(result.document.nodes[0]).toEqual({
        ...source.nodes[0],
        text: { ...source.nodes[0]?.text, content: 'Orbit Labs' },
    });
    expect(source.nodes[0]?.text?.content).toBe('Orbit Studio');
    expect(result.changes.nodes).toHaveLength(1);
    expect(DesignEdits.restore(result.document, result.changes).document).toEqual(source);
});

it('shorter and empty text clamp rich ranges without splitting surrogate pairs', (): void => {
    const source: DesignDocument = document();
    const clipped: DesignDocument = DesignEdits.apply(source, [
        { op: 'text', id: 'heading', content: '😀ab' },
    ]).document;
    expect(clipped.nodes[0]?.text?.runs).toMatchObject([{ start: 2, end: 4 }]);
    const empty: DesignDocument = DesignEdits.apply(source, [
        { op: 'text', id: 'heading', content: '' },
    ]).document;
    expect(empty.nodes[0]?.text?.runs).toEqual([]);
    expect(empty.nodes[0]?.text?.content).toBe('');
    const end: DesignDocument = DesignEdits.apply(document('123456789'), [
        { op: 'text', id: 'heading', content: '1234567😀' },
    ]).document;
    expect(end.nodes[0]?.text?.runs).toMatchObject([{ start: 1, end: 7 }]);
});

it('text operations reject missing layers, non-text layers, oversized and malformed strings atomically', (): void => {
    const source: DesignDocument = DesignEdits.apply(DesignDefaults.document('canvas'), [
        {
            op: 'insert',
            node: DesignDefaults.node('box'),
            parentId: null,
            pageId: 'page-1',
            index: 0,
        },
    ]).document;
    expect((): DesignEditResult =>
        DesignEdits.apply(source, [{ op: 'text', id: 'box', content: 'Title' }]),
    ).toThrow('no editable text');
    expect((): DesignEditResult =>
        DesignEdits.apply(document(), [{ op: 'text', id: 'missing', content: 'Title' }]),
    ).toThrow();
    for (const content of ['x'.repeat(100001), '\ud800']) {
        expect((): DesignEditResult =>
            DesignEdits.apply(document(), [{ op: 'text', id: 'heading', content }]),
        ).toThrow();
    }
    expect(source.nodes[0]?.text).toBeNull();
});
