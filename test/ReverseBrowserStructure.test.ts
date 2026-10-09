// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import type {
    BrowserStructurePage,
    BrowserDomNode,
    BrowserAccessibilityNode,
    BrowserStructureSnapshot,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';
import { BrowserStructureReceipt } from '../src/reverse/BrowserStructureReceipt.js';

const root: BrowserDomNode = {
    kind: 'dom',
    relation: 'document',
    id: '1',
    backendNodeId: '101',
    parentId: null,
    depth: 0,
    nodeType: 9,
    name: '#document',
    localName: '',
    valueLength: '0',
    attributeCount: '0',
    childCount: '30',
    missingChildren: '0',
};
const child: BrowserDomNode = {
    ...root,
    relation: 'child',
    id: '2',
    backendNodeId: '102',
    parentId: '1',
    depth: 1,
    nodeType: 1,
    name: 'BUTTON',
    localName: 'button',
    attributeCount: '45',
    childCount: '0',
};
const page: BrowserStructurePage = {
    runId: '89107b32-0000-4000-8000-000000000001',
    evidenceId: '89107b32-0000-4000-8000-000000000002',
    sha256: 'a'.repeat(64),
    captureSha256: 'b'.repeat(64),
    view: 'dom',
    selector: 'roots',
    cursor: '0',
    nextCursor: null,
    total: '1',
    records: [root],
    metadata: {
        provider: 'cdp-passive',
        targetId: 'target',
        frameId: 'frame',
        origin: 'https://example.test',
        url: 'https://example.test/',
        capturedAt: '2026-10-09T00:00:00.000Z',
        priorActivityAvailable: false,
        limitations: [],
        dom: {
            available: true,
            nodes: '31',
            partial: false,
            countPreviewPartial: false,
            counts: [{ name: 'BUTTON', count: '30' }],
        },
        accessibility: {
            available: false,
            nodes: '0',
            partial: true,
            countPreviewPartial: false,
            counts: [],
        },
    },
};

describe('saved browser topology receipts', (): void => {
    it('accepts independently selected trees, direct children and paged attribute names', (): void => {
        expect(ReverseInvestigation.structure(page)).toEqual(page);
        const children: BrowserStructurePage = {
            ...page,
            selector: 'children:1',
            total: '30',
            nextCursor: '1',
            records: [child],
        };
        expect(ReverseInvestigation.structure(children)).toEqual(children);
        const names: BrowserStructurePage = {
            ...page,
            selector: 'attributes:2',
            total: '45',
            cursor: '20',
            nextCursor: '21',
            records: [{ kind: 'attribute', nodeId: '2', index: 20, name: 'data-mode' }],
        };
        expect(ReverseInvestigation.structure(names)).toEqual(names);
        expect(
            ReverseInvestigation.structure({ ...page, selector: 'node:2', records: [child] }),
        ).toMatchObject({ records: [child] });
    });
    it('rejects empty-progress cursors, unexpected nodes and invalid namespaces', (): void => {
        for (const changed of [
            { cursor: '01' },
            { nextCursor: '1' },
            { total: '2', records: [] },
            { selector: 'node:2' },
            { selector: 'children:2' },
            { records: [{ ...root, id: '0' }] },
            { records: [{ ...root, id: '2147483648' }] },
            { records: [{ ...root, depth: 1 }] },
            { records: [{ ...root, nodeType: 1 }] },
            { records: [{ ...root, parentId: '1' }] },
            { selector: 'node:01' },
            { selector: 'attributes:1', records: [root] },
            { view: 'accessibility', selector: 'attributes:ax' },
            { selector: 'host:/tmp/file' },
        ]) {
            expect((): BrowserStructurePage =>
                ReverseInvestigation.structure({ ...page, ...changed }),
            ).toThrow();
        }
    });
    it('rejects raw producer values, hidden attributes, foreign origins and credential-bearing URLs', (): void => {
        for (const records of [
            [{ ...root, nodeValue: 'SECRET' }],
            [{ ...root, attributeNames: ['private'] }],
            [{ ...root, name: 'x'.repeat(257) }],
        ]) {
            expect((): BrowserStructurePage =>
                ReverseInvestigation.structure({ ...page, records }),
            ).toThrow();
        }
        for (const url of [
            'https://outside.test/',
            'https://user:pass@example.test/',
            'https://example.test/?token=SECRET',
        ]) {
            expect((): BrowserStructurePage =>
                ReverseInvestigation.structure({ ...page, metadata: { ...page.metadata, url } }),
            ).toThrow();
        }
        expect((): BrowserStructurePage =>
            ReverseInvestigation.structure({
                ...page,
                metadata: {
                    ...page.metadata,
                    accessibility: {
                        ...page.metadata.accessibility,
                        available: true,
                        nodes: '1',
                        counts: [{ name: 'button', count: '2' }],
                    },
                },
            }),
        ).toThrow();
    });
    it('requires honest partial AX ancestry and preserves opaque IDs and backend links', (): void => {
        const ax: BrowserAccessibilityNode = {
            kind: 'accessibility',
            id: 'ax:button',
            parentId: 'external:root',
            depth: null,
            backendNodeId: '102',
            role: 'button',
            ignored: false,
            childCount: '0',
            missingChildren: '1',
        };
        const partial: BrowserStructurePage = {
            ...page,
            view: 'accessibility',
            records: [ax],
            metadata: {
                ...page.metadata,
                accessibility: {
                    available: true,
                    partial: true,
                    nodes: '1',
                    counts: [{ name: 'button', count: '1' }],
                    countPreviewPartial: false,
                },
            },
        };
        expect(ReverseInvestigation.structure(partial)).toEqual(partial);
        expect((): BrowserStructurePage =>
            ReverseInvestigation.structure({
                ...partial,
                metadata: {
                    ...partial.metadata,
                    accessibility: { ...partial.metadata.accessibility, partial: false },
                },
            }),
        ).toThrow();
        expect((): BrowserStructurePage =>
            ReverseInvestigation.structure({ ...partial, records: [{ ...ax, name: 'SECRET' }] }),
        ).toThrow();
        expect((): BrowserStructurePage =>
            ReverseInvestigation.structure({ ...partial, records: [{ ...ax, id: '\n' }] }),
        ).toThrow();
    });
    it('binds structure summaries to exact immutable run and conversation provenance', (): void => {
        const snapshot: BrowserStructureSnapshot = {
            ...page.metadata,
            reference: {
                sessionId: 'chat',
                runId: page.runId,
                evidenceId: page.evidenceId,
                captureSha256: page.captureSha256,
            },
        };
        expect((): void =>
            BrowserStructureReceipt.snapshot(snapshot, page.runId, 'chat'),
        ).not.toThrow();
        expect((): void =>
            BrowserStructureReceipt.snapshot(snapshot, page.runId, 'other-chat'),
        ).toThrow();
        expect((): void =>
            BrowserStructureReceipt.snapshot(snapshot, page.evidenceId, 'chat'),
        ).toThrow();
        expect((): void =>
            BrowserStructureReceipt.snapshot(
                { ...snapshot, reference: { ...snapshot.reference, captureSha256: 'wrong' } },
                page.runId,
                'chat',
            ),
        ).toThrow();
    });
});
