// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignClipboardCodec } from '../src/design/DesignClipboardCodec.js';
import { DesignClipboardCapture } from '../src/design/DesignClipboardSnapshot.js';
import { DesignClipboardPaste } from '../src/design/DesignClipboardPaste.js';
import { DesignClipboardCut } from '../src/design/DesignClipboardCut.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignTextMetrics } from '../src/design/DesignTextMetrics.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { schema } from '../src/protocol/SchemaData.js';
import type {
    DesignClipboardCopyRequest,
    DesignClipboardPasteRequest,
} from '../src/design/DesignClipboardTypes.js';
import type { DesignDocument, DesignNode } from '../src/design/DesignTypes.js';
import type { DesignClipboardSnapshot } from '../src/design/DesignClipboardSnapshot.js';

const copy: DesignClipboardCopyRequest = {
    clipboardId: 'copy',
    sourceId: 'source',
    sourceRevision: '1',
    pageId: 'page-1',
    selection: ['text'],
};
const paste: DesignClipboardPasteRequest = {
    id: 'target',
    expectedRevision: '1',
    commandId: 'paste',
    clipboardId: 'copy',
    pageId: 'page-1',
    parentId: null,
    placement: 'center',
    x: 300,
    y: 200,
};

it('exports exact reference-only RPC validation without owner or source-body overrides', (): void => {
    expect(methodValidators[Method.DesignClipboardCopy].params(copy)).toBe(true);
    expect(methodValidators[Method.DesignClipboardPaste].params(paste)).toBe(true);
    expect(DesignClipboardCodec.copy(copy)).toEqual(copy);
    expect(DesignClipboardCodec.paste(paste)).toEqual(paste);
    expect((): DesignClipboardCopyRequest =>
        DesignClipboardCodec.copy({ ...copy, owner: 'someone' }),
    ).toThrow();
    expect((): DesignClipboardPasteRequest =>
        DesignClipboardCodec.paste({ ...paste, snapshot: {} }),
    ).toThrow();
    expect(
        methodValidators[Method.DesignClipboardPaste].params({ ...paste, placement: 'random' }),
    ).toBe(false);
    expect(JSON.stringify(copy).length + JSON.stringify(paste).length).toBeLessThan(500);
});

it('portable local capture retains copy-time text and pastes editable layers without changing its source', (): void => {
    const base: DesignDocument = DesignDefaults.document('source');
    const text: DesignNode = DesignDefaults.node('text', 'text');
    if (text.text === null) {
        throw new Error('Missing text defaults');
    }
    const source: DesignDocument = {
        ...base,
        nodes: [
            { ...text, width: 160, height: 40, text: { ...text.text, content: 'Copy-time text' } },
        ],
        pages: base.pages.map((page): typeof page => ({ ...page, roots: [text.id] })),
    };
    const snapshot: DesignClipboardSnapshot = DesignClipboardCapture.create(
        source,
        copy.pageId,
        copy.selection,
        new DesignTextMetrics(),
    );
    const cut: ReturnType<typeof DesignClipboardCut.apply> = DesignClipboardCut.apply(
        source,
        copy.pageId,
        copy.selection,
    );
    expect(cut.document.nodes).toEqual([]);
    expect(cut.selection).toEqual([]);
    expect(
        DesignClipboardCodec.cut({
            id: 'source',
            expectedRevision: '1',
            commandId: 'cut',
            clipboardId: 'copy',
            pageId: copy.pageId,
            selection: copy.selection,
        }),
    ).toMatchObject({ id: 'source', clipboardId: 'copy' });
    expect(
        methodValidators[Method.DesignClipboardCut].params({
            id: 'source',
            expectedRevision: '1',
            commandId: 'cut',
            clipboardId: 'copy',
            pageId: copy.pageId,
            selection: copy.selection,
        }),
    ).toBe(true);
    const result: ReturnType<typeof DesignClipboardPaste.apply> = DesignClipboardPaste.apply(
        snapshot,
        DesignDefaults.document('target'),
        paste,
        (id: string): string => id.replaceAll(':', '-'),
        new DesignTextMetrics(),
    );
    expect(result.document.nodes[0]).toMatchObject({
        id: 'layer-text',
        x: 220,
        y: 180,
        text: { content: 'Copy-time text' },
    });
    expect(source.nodes[0]?.id).toBe('text');
    expect(result.selection).toEqual(['layer-text']);
});

it('private binary history payloads are excluded from the regenerated JSON wire contract', (): void => {
    expect(schema.definitions?.['SessionHistoryPage']?.properties).not.toHaveProperty('payload');
});
