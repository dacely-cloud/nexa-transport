// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignSelectionIndex } from '../src/design/DesignSelectionIndex.js';
import { DesignSelectionContext } from '../src/design/DesignSelectionContext.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import type { DesignDocument, DesignNode } from '../src/design/DesignTypes.js';

it('portable metadata selection agrees with geometry selection while retaining authored source references', (): void => {
    const frame: DesignNode = { ...DesignDefaults.node('frame', 'frame'), children: ['child'] };
    const child: DesignNode = { ...DesignDefaults.node('child', 'text'), parentId: frame.id };
    const other: DesignNode = DesignDefaults.node('other', 'rectangle');
    const document: DesignDocument = {
        ...DesignDefaults.document('index'),
        nodes: [frame, child, other],
        pages: [{ id: 'page-1', name: 'Page', background: '#FFFFFF', roots: [frame.id, other.id] }],
    };
    const index: DesignSelectionIndex = new DesignSelectionIndex(document, 'page-1', [
        'other',
        'child',
        'frame',
    ]);
    const context: DesignSelectionContext = new DesignSelectionContext(document, 'page-1', [
        'other',
        'child',
        'frame',
    ]);
    expect(index.roots).toEqual(context.roots);
    expect(index.node(child.id)).toBe(child);
    expect(index.roots.map((node: DesignNode): string => node.id)).toEqual(['frame', 'other']);
    expect(
        (): DesignSelectionIndex =>
            new DesignSelectionIndex(document, 'page-1', ['other', 'other']),
    ).toThrow('distinct');
});
