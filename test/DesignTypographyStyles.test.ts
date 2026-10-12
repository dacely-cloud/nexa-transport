// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignTypographyStyleCodec } from '../src/design/DesignTypographyStyleCodec.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import type { DesignDocument } from '../src/design/DesignTypes.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';

it('validates new style definitions and compact linking through the existing save method', (): void => {
    const request: DesignSaveRequest = {
        id: 'styles',
        expectedRevision: '1',
        commandId: 'link',
        operations: [
            {
                op: 'token',
                id: 'heading',
                changes: {
                    name: 'Heading',
                    category: 'typography',
                    typography: { size: 32, weight: 700 },
                },
            },
            { op: 'typography-style', id: 'caption', pageId: 'page-1', tokenId: 'heading' },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [{ op: 'typography-style', id: 'caption', tokenId: 'heading' }],
        }),
    ).toBe(false);
    expect(
        DesignTypographyStyleCodec.link({ tokenId: 'heading', overrides: { size: 20 } }),
    ).toEqual({ tokenId: 'heading', overrides: { size: 20 } });
    expect(JSON.stringify(request).length).toBeLessThan(450);
});
it('portable linking and definition updates preserve source and local overrides', (): void => {
    const source: DesignDocument = DesignDefaults.document('styles');
    const linked: DesignEditResult = DesignEdits.apply(source, [
        {
            op: 'token',
            id: 'heading',
            changes: { name: 'Heading', category: 'typography', typography: { size: 32 } },
        },
        {
            op: 'insert',
            pageId: 'page-1',
            parentId: null,
            index: 0,
            node: DesignDefaults.node('caption', 'text'),
        },
        { op: 'typography-style', id: 'caption', pageId: 'page-1', tokenId: 'heading' },
    ]);
    const changed: DesignEditResult = DesignEdits.apply(linked.document, [
        { op: 'typography', id: 'caption', pageId: 'page-1', changes: { size: 20 } },
        { op: 'token', id: 'heading', changes: { typography: { size: 48, weight: 700 } } },
    ]);
    expect(changed.document.nodes[0]?.text).toMatchObject({
        size: 20,
        weight: 700,
        typographyStyle: { tokenId: 'heading', overrides: { size: 20 } },
    });
    expect(DesignEdits.restore(changed.document, changed.changes).document).toEqual(
        linked.document,
    );
});
