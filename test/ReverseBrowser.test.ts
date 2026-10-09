// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import type { ReverseBrowserPage, BrowserActivityRequest } from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

const row: BrowserActivityRequest = {
    kind: 'request',
    ordinal: 1,
    requestId: 'r',
    frameId: 'main',
    url: 'https://example.test/items?token=%5Bredacted%5D',
    method: 'GET',
    resourceType: 'Fetch',
    timestamp: '1.25',
    initiator: null,
    status: 200,
    mimeType: 'application/json',
    encodedBytes: '500',
    finished: true,
    failed: false,
    redirectedTo: null,
    reusedWithoutRedirect: false,
};
const page: ReverseBrowserPage = {
    runId: '89107b32-0000-4000-8000-000000000001',
    evidenceId: '89107b32-0000-4000-8000-000000000002',
    sha256: 'a'.repeat(64),
    captureSha256: 'b'.repeat(64),
    cursor: '0',
    nextCursor: null,
    total: 1,
    records: [row],
    metadata: {
        provider: 'cdp-passive',
        targetId: 'target',
        origin: 'https://example.test',
        url: 'https://example.test/',
        startedAt: '2026-10-09T00:00:00.000Z',
        endedAt: '2026-10-09T00:00:01.000Z',
        observationMs: 1000,
        coverage: {
            priorActivityAvailable: false,
            truncated: false,
            reusedRequestIds: '0',
            excluded: '0',
            missingPredecessors: '0',
            unfinishedRequests: '0',
            networkCompleteWithinWindow: true,
        },
    },
};

describe('saved browser capture receipts', (): void => {
    it('accepts exact scoped metadata pages and rejects cursor, size and record-order inconsistencies', (): void => {
        expect(ReverseInvestigation.browser(page)).toEqual(page);
        expect((): ReverseBrowserPage =>
            ReverseInvestigation.browser({ ...page, cursor: '01' }),
        ).toThrow();
        expect((): ReverseBrowserPage =>
            ReverseInvestigation.browser({ ...page, nextCursor: '1' }),
        ).toThrow();
        expect((): ReverseBrowserPage =>
            ReverseInvestigation.browser({ ...page, total: 2, records: [] }),
        ).toThrow();
        expect((): ReverseBrowserPage =>
            ReverseInvestigation.browser({ ...page, total: 2, records: [row, row] }),
        ).toThrow();
        expect((): ReverseBrowserPage =>
            ReverseInvestigation.browser({
                ...page,
                records: [{ ...row, ordinal: Number.MAX_SAFE_INTEGER }],
            }),
        ).toThrow();
    });
    it('refuses raw content fields, unknown categories, credentials and foreign origins', (): void => {
        for (const changed of [
            { ...row, headers: { authorization: 'SECRET' } },
            { ...row, payloadData: 'SECRET' },
            { ...row, resourceType: 'SECRET' },
            { ...row, url: 'https://outside.test/' },
            { ...row, url: 'https://user:pass@example.test/' },
            { ...row, url: 'https://example.test/?token=SECRET' },
            { ...row, initiator: { url: 'https://outside.test/script.js', line: 1, column: 0 } },
        ]) {
            expect((): ReverseBrowserPage =>
                ReverseInvestigation.browser({ ...page, records: [changed] }),
            ).toThrow();
        }
    });
    it('never presents unfinished, reused or truncated observations as complete evidence', (): void => {
        expect((): ReverseBrowserPage =>
            ReverseInvestigation.browser({ ...page, records: [{ ...row, finished: false }] }),
        ).toThrow();
        expect((): ReverseBrowserPage =>
            ReverseInvestigation.browser({
                ...page,
                records: [{ ...row, reusedWithoutRedirect: true }],
            }),
        ).toThrow();
        expect((): ReverseBrowserPage =>
            ReverseInvestigation.browser({
                ...page,
                metadata: {
                    ...page.metadata,
                    coverage: { ...page.metadata.coverage, truncated: true },
                },
            }),
        ).toThrow();
        expect((): ReverseBrowserPage =>
            ReverseInvestigation.browser({
                ...page,
                metadata: {
                    ...page.metadata,
                    coverage: { ...page.metadata.coverage, priorActivityAvailable: true },
                },
            }),
        ).toThrow();
    });
});
