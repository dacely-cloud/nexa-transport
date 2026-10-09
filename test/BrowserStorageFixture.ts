// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserStorageMetadata,
    BrowserStorageCoverage,
    BrowserStoragePage,
} from '../src/protocol/Protocol.js';
/** Produces one bounded complete storage page for portable receipt boundary checks. */
export function storagePageFixture(): BrowserStoragePage {
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
