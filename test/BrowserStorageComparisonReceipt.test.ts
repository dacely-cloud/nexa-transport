// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type {
    BrowserStorageComparisonPage,
    BrowserStorageGroupComparison,
    BrowserStoragePage,
    ReverseRunSnapshot,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';
import { storagePageFixture } from './BrowserStorageFixture.js';

function fixture(): BrowserStorageComparisonPage {
    const source: BrowserStoragePage = storagePageFixture();
    const row: BrowserStoragePage['rows'][number] | undefined = source.rows[0];
    if (row === undefined) {
        throw new Error('Missing original storage row');
    }
    const scope: BrowserStorageGroupComparison = {
        mode: 'fingerprints',
        status: 'unchanged',
        complete: true,
        reason: null,
        ambiguousIdentities: '0',
        added: '0',
        removed: '0',
        modified: '0',
        unchanged: '0',
        totalChanges: '0',
        retainedChanges: '0',
        omittedChanges: '0',
    };
    return {
        runId: '33333333-3333-4333-8333-333333333333',
        evidenceId: '44444444-4444-4444-8444-444444444444',
        sha256: 'e'.repeat(64),
        captureSha256: 'f'.repeat(64),
        comparison: {
            algorithm: 'storage-observations-v1',
            before: {
                reference: {
                    sessionId: 'alice::main',
                    runId: source.runId,
                    evidenceId: source.evidenceId,
                    captureSha256: source.captureSha256,
                },
                sha256: source.sha256,
                metadata: source.metadata,
            },
            after: {
                reference: {
                    sessionId: 'alice::main',
                    runId: '55555555-5555-4555-8555-555555555555',
                    evidenceId: '66666666-6666-4666-8666-666666666666',
                    captureSha256: '7'.repeat(64),
                },
                sha256: '8'.repeat(64),
                metadata: source.metadata,
            },
            status: 'changed',
            complete: true,
            detailsComplete: true,
            quota: { status: 'unchanged', usageDeltaBytes: '0', quotaDeltaBytes: '0' },
            groups: {
                'local-storage': {
                    ...scope,
                    status: 'changed',
                    modified: '1',
                    totalChanges: '1',
                    retainedChanges: '1',
                },
                'session-storage': scope,
                cookies: scope,
                'indexed-db': scope,
                'cache-storage': scope,
            },
            limitations: [],
        },
        group: 'local-storage',
        cursor: '0',
        nextCursor: null,
        changes: [
            {
                id: 'local-storage:0',
                group: 'local-storage',
                change: 'modified',
                before: row,
                after: { ...row, valueSha256: '9'.repeat(64) },
            },
        ],
    };
}

describe('portable storage comparison receipts', (): void => {
    it('accepts a proven change and a body-free header', (): void => {
        const page: BrowserStorageComparisonPage = fixture();
        expect(ReverseInvestigation.storageComparison(page)).toEqual(page);
        expect(
            ReverseInvestigation.storageComparison({ ...page, group: null, changes: [] }).changes,
        ).toEqual([]);
        expect((): BrowserStorageComparisonPage =>
            ReverseInvestigation.storageComparison({ ...page, group: null }),
        ).toThrow();
    });
    it('rejects secret-bearing fields at every comparison boundary', (): void => {
        const page: BrowserStorageComparisonPage = fixture();
        const change: BrowserStorageComparisonPage['changes'][number] | undefined = page.changes[0];
        if (change === undefined) {
            throw new Error('Missing change');
        }
        for (const raw of [
            { ...page, values: 'SECRET' },
            { ...page, comparison: { ...page.comparison, changes: page.changes } },
            { ...page, changes: [{ ...change, after: { ...change.after, value: 'SECRET' } }] },
            {
                ...page,
                comparison: {
                    ...page.comparison,
                    before: { ...page.comparison.before, values: 'SECRET' },
                },
            },
        ]) {
            expect((): BrowserStorageComparisonPage =>
                ReverseInvestigation.storageComparison(raw),
            ).toThrow();
        }
    });
    it('rejects fabricated quota arithmetic, equality and retained counts', (): void => {
        const page: BrowserStorageComparisonPage = fixture();
        const local: BrowserStorageGroupComparison = page.comparison.groups['local-storage'];
        for (const comparison of [
            { ...page.comparison, status: 'unchanged' },
            {
                ...page.comparison,
                quota: { status: 'changed', usageDeltaBytes: '1', quotaDeltaBytes: '0' },
            },
            {
                ...page.comparison,
                groups: {
                    ...page.comparison.groups,
                    'local-storage': { ...local, retainedChanges: '2' },
                },
            },
            {
                ...page.comparison,
                groups: { ...page.comparison.groups, 'local-storage': { ...local, added: '1' } },
            },
        ]) {
            expect((): BrowserStorageComparisonPage =>
                ReverseInvestigation.storageComparison({ ...page, comparison }),
            ).toThrow();
        }
    });
    it('rejects forged modifications and discontinuous page ordinals', (): void => {
        const page: BrowserStorageComparisonPage = fixture();
        const change: BrowserStorageComparisonPage['changes'][number] | undefined = page.changes[0];
        if (change === undefined) {
            throw new Error('Missing change');
        }
        for (const modified of [
            { ...change, after: change.before },
            { ...change, after: { ...change.after, identitySha256: 'a'.repeat(64) } },
            { ...change, before: null },
            { ...change, id: 'local-storage:1' },
        ]) {
            expect((): BrowserStorageComparisonPage =>
                ReverseInvestigation.storageComparison({ ...page, changes: [modified] }),
            ).toThrow();
        }
        for (const raw of [
            { ...page, cursor: '01' },
            { ...page, nextCursor: '1' },
            { ...page, changes: [] },
        ]) {
            expect((): BrowserStorageComparisonPage =>
                ReverseInvestigation.storageComparison(raw),
            ).toThrow();
        }
    });
    it('rejects cross-conversation source references', (): void => {
        const page: BrowserStorageComparisonPage = fixture();
        expect((): BrowserStorageComparisonPage =>
            ReverseInvestigation.storageComparison({
                ...page,
                comparison: {
                    ...page.comparison,
                    after: {
                        ...page.comparison.after,
                        reference: { ...page.comparison.after.reference, sessionId: 'bob::main' },
                    },
                },
            }),
        ).toThrow();
    });
    it('pins header identity independently from metadata insertion order', (): void => {
        const page: BrowserStorageComparisonPage = fixture();
        expect(
            ReverseInvestigation.storageComparisonIdentity({
                ...page.comparison,
                before: {
                    ...page.comparison.before,
                    metadata: {
                        ...page.comparison.before.metadata,
                        quota: { quotaBytes: '100', usageBytes: '12', available: true },
                    },
                },
            }),
        ).toBe(ReverseInvestigation.storageComparisonIdentity(page.comparison));
        expect(
            ReverseInvestigation.storageComparisonIdentity({
                ...page.comparison,
                before: {
                    ...page.comparison.before,
                    metadata: { ...page.comparison.before.metadata, frameId: 'other' },
                },
            }),
        ).not.toBe(ReverseInvestigation.storageComparisonIdentity(page.comparison));
    });
    it('binds streamed comparison headers to the report run and original conversation', (): void => {
        const page: BrowserStorageComparisonPage = fixture();
        const run: ReverseRunSnapshot = {
            version: 1,
            id: page.runId,
            revision: '1',
            archive: { sessionId: 'alice::main' },
            sha256: page.sha256,
            inputName: 'Storage changes',
            question: 'Compare storage',
            kind: 'browser',
            state: 'done',
            tasks: [],
            evidenceCount: 0,
            evidence: [],
            cleanupErrors: [],
            browserStorageComparison: {
                ...page.comparison,
                reference: {
                    sessionId: 'alice::main',
                    runId: page.runId,
                    evidenceId: page.evidenceId,
                    captureSha256: page.captureSha256,
                },
            },
        };
        expect(ReverseInvestigation.parse(run)).toEqual(run);
        const snapshot: ReverseRunSnapshot['browserStorageComparison'] =
            run.browserStorageComparison;
        if (snapshot === undefined) {
            throw new Error('Missing comparison snapshot');
        }
        for (const value of [
            { ...snapshot, changes: page.changes },
            {
                ...snapshot,
                reference: { ...snapshot.reference, runId: page.comparison.before.reference.runId },
            },
            { ...snapshot, reference: { ...snapshot.reference, sessionId: 'bob::main' } },
        ]) {
            expect((): ReverseRunSnapshot =>
                ReverseInvestigation.parse({ ...run, browserStorageComparison: value }),
            ).toThrow();
        }
    });
});
