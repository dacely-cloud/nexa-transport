// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type {
    BrowserStorageRow,
    BrowserStorageMetadata,
    BrowserStorageCoverage,
    BrowserStoragePage,
    ReverseRunSnapshot,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

function fixture(): BrowserStoragePage {
    const scope: BrowserStorageCoverage = {
        selected: true,
        available: true,
        complete: true,
        rows: '0',
        omitted: '0',
        changedDuringCapture: false,
    };
    const metadata: BrowserStorageMetadata = {
        provider: 'cdp-passive',
        targetId: 'target',
        frameId: 'frame',
        url: 'https://example.test/app',
        origin: 'https://example.test',
        capturedAt: '2026-10-09T00:00:00.000Z',
        includeNames: true,
        includeFingerprints: true,
        valuesRedacted: true,
        fingerprintAlgorithm: 'sha256-canonical-json-v1',
        fingerprintsComplete: true,
        quota: { available: true, usageBytes: '12', quotaBytes: '100' },
        coverage: {
            'local-storage': { ...scope, rows: '1' },
            'session-storage': scope,
            cookies: scope,
            'indexed-db': scope,
            'cache-storage': scope,
        },
        limitations: [],
    };
    return {
        runId: '11111111-1111-4111-8111-111111111111',
        evidenceId: '22222222-2222-4222-8222-222222222222',
        sha256: 'a'.repeat(64),
        captureSha256: 'b'.repeat(64),
        metadata,
        group: 'local-storage',
        cursor: '0',
        nextCursor: null,
        rows: [
            {
                id: 'local-storage:0',
                group: 'local-storage',
                kind: 'value',
                name: 'setting',
                identitySha256: 'c'.repeat(64),
                valueSha256: 'd'.repeat(64),
                complete: true,
            },
        ],
    };
}
describe('portable saved storage contract', (): void => {
    it('validates metadata and selected pages while rejecting injected values and skipped ordinals', (): void => {
        const page: BrowserStoragePage = fixture();
        expect(ReverseInvestigation.storage(page)).toEqual(page);
        expect(ReverseInvestigation.storage({ ...page, group: null, rows: [] }).rows).toEqual([]);
        expect((): BrowserStoragePage =>
            ReverseInvestigation.storage({ ...page, values: 'secret' }),
        ).toThrow();
        expect((): BrowserStoragePage =>
            ReverseInvestigation.storage({
                ...page,
                rows: page.rows.map((row): RowInjection => ({ ...row, value: 'secret' })),
            }),
        ).toThrow();
        expect((): BrowserStoragePage =>
            ReverseInvestigation.storage({ ...page, cursor: '1' }),
        ).toThrow();
        expect((): BrowserStoragePage =>
            ReverseInvestigation.storage({ ...page, nextCursor: '0' }),
        ).toThrow();
    });
    it('does not invent availability, complete fingerprints or unchecked quota precision', (): void => {
        const page: BrowserStoragePage = fixture();
        expect((): BrowserStoragePage =>
            ReverseInvestigation.storage({
                ...page,
                rows: page.rows.map(
                    (
                        row: BrowserStoragePage['rows'][number],
                    ): BrowserStoragePage['rows'][number] => ({ ...row, complete: false }),
                ),
            }),
        ).toThrow();
        expect((): BrowserStoragePage =>
            ReverseInvestigation.storage({
                ...page,
                metadata: { ...page.metadata, fingerprintsComplete: false },
            }),
        ).toThrow();
        expect((): BrowserStoragePage =>
            ReverseInvestigation.storage({
                ...page,
                metadata: {
                    ...page.metadata,
                    quota: { available: true, usageBytes: '9007199254740993', quotaBytes: '100' },
                },
            }),
        ).toThrow();
        expect((): BrowserStoragePage =>
            ReverseInvestigation.storage({
                ...page,
                metadata: {
                    ...page.metadata,
                    coverage: {
                        ...page.metadata.coverage,
                        cookies: { ...page.metadata.coverage.cookies, changedDuringCapture: true },
                    },
                },
            }),
        ).toThrow();
    });
    it('pins all header fields independently of producer key insertion order', (): void => {
        const page: BrowserStoragePage = fixture();
        const reordered: BrowserStorageMetadata = {
            ...page.metadata,
            quota: { quotaBytes: '100', usageBytes: '12', available: true },
            coverage: {
                'cache-storage': page.metadata.coverage['cache-storage'],
                'indexed-db': page.metadata.coverage['indexed-db'],
                cookies: page.metadata.coverage.cookies,
                'session-storage': page.metadata.coverage['session-storage'],
                'local-storage': page.metadata.coverage['local-storage'],
            },
        };
        expect(ReverseInvestigation.storageIdentity(reordered)).toBe(
            ReverseInvestigation.storageIdentity(page.metadata),
        );
        expect(
            ReverseInvestigation.storageIdentity({ ...page.metadata, frameId: 'other' }),
        ).not.toBe(ReverseInvestigation.storageIdentity(page.metadata));
    });
    it('requires storage progress to retain the original run and conversation with no embedded rows', (): void => {
        const page: BrowserStoragePage = fixture();
        const run: ReverseRunSnapshot = {
            version: 1,
            id: page.runId,
            revision: '1',
            archive: { sessionId: 'alice::main' },
            sha256: page.sha256,
            inputName: 'Browser storage',
            question: 'Inspect storage',
            kind: 'browser',
            state: 'done',
            tasks: [],
            evidenceCount: 0,
            evidence: [],
            cleanupErrors: [],
            browserStorage: {
                ...page.metadata,
                reference: {
                    sessionId: 'alice::main',
                    runId: page.runId,
                    evidenceId: page.evidenceId,
                    captureSha256: page.captureSha256,
                },
            },
        };
        expect(ReverseInvestigation.parse(run)).toEqual(run);
        if (!run.browserStorage) {
            throw new Error('Missing fixture storage');
        }
        const snapshot: NonNullable<ReverseRunSnapshot['browserStorage']> = run.browserStorage;
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.parse({
                ...run,
                browserStorage: { ...snapshot, rows: page.rows },
            }),
        ).toThrow();
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.parse({
                ...run,
                browserStorage: {
                    ...snapshot,
                    reference: { ...snapshot.reference, sessionId: 'bob::main' },
                },
            }),
        ).toThrow();
    });
});
interface RowInjection extends BrowserStorageRow {
    readonly value: string;
}
