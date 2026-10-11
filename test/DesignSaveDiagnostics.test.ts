// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import {
    DesignKind,
    type DesignNode,
    type DesignDocument,
    type DesignBox,
} from '../src/design/DesignTypes.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';

test('a CSS alignment value identifies the exact failed operation and lists native accepted values', (): void => {
    const node: DesignNode = DesignDefaults.node('navigation', DesignKind.Frame);
    expect((): void => {
        DesignOperationCodec.operations([
            { op: 'metadata', name: 'Dogs' },
            {
                op: 'insert',
                node: { ...node, layout: { ...node.layout, justify: 'space-between' } },
                parentId: null,
                pageId: 'page-1',
                index: 0,
            },
        ]);
    }).toThrow(
        'operations[1]: insert.node: node.layout: Unsupported design choice at layout.justify: "space-between". Expected one of: "start", "center", "end", "between", "stretch".',
    );
});

test('missing image, misspelled parentId and invented style fields identify their enclosing layer', (): void => {
    const node: DesignNode = DesignDefaults.node('root', DesignKind.Frame);
    const incomplete: Record<string, unknown> = { ...node, parentid: null };
    Reflect.deleteProperty(incomplete, 'image');
    expect((): void => {
        DesignOperationCodec.operations([
            { op: 'insert', node: incomplete, parentId: null, pageId: 'page-1', index: 0 },
        ]);
    }).toThrow(
        'operations[0]: insert.node: Invalid design fields. Missing: "image". Unexpected: "parentid".',
    );
    expect((): void => {
        DesignOperationCodec.operations([
            {
                op: 'insert',
                node: { ...node, style: { ...node.style, shadows2: [] } },
                parentId: null,
                pageId: 'page-1',
                index: 0,
            },
        ]);
    }).toThrow(
        'operations[0]: insert.node: node.style: Invalid design fields. Unexpected: "shadows2".',
    );
});

test('the documented between token places navigation children at opposite padded edges', (): void => {
    const frame: DesignNode = DesignDefaults.node('nav', DesignKind.Frame);
    const first: DesignNode = DesignDefaults.node('brand', DesignKind.Rectangle);
    const last: DesignNode = DesignDefaults.node('action', DesignKind.Rectangle);
    const document: DesignDocument = DesignEdits.apply(
        DesignDefaults.document('navigation'),
        DesignOperationCodec.operations([
            {
                op: 'insert',
                node: {
                    ...frame,
                    width: 200,
                    height: 40,
                    layout: {
                        ...frame.layout,
                        flow: 'row',
                        justify: 'between',
                        padding: { left: 10, right: 10, top: 0, bottom: 0 },
                    },
                },
                parentId: null,
                pageId: 'page-1',
                index: 0,
            },
            {
                op: 'insert',
                node: { ...first, width: 20, height: 20 },
                parentId: 'nav',
                pageId: 'page-1',
                index: 0,
            },
            {
                op: 'insert',
                node: { ...last, width: 30, height: 20 },
                parentId: 'nav',
                pageId: 'page-1',
                index: 1,
            },
        ]),
    ).document;
    const boxes: readonly DesignBox[] = new DesignLayoutEngine(document, 'page-1').solve().boxes;
    expect(boxes.find((box: DesignBox): boolean => box.id === 'brand')?.x).toBe(10);
    expect(boxes.find((box: DesignBox): boolean => box.id === 'action')?.x).toBe(160);
});
