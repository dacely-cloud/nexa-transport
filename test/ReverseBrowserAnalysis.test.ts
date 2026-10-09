// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import type { BrowserAnalysisInput, ReverseRunSnapshot } from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

const source: BrowserAnalysisInput = {
    provider: 'cdp-passive',
    targetId: 'target',
    frameId: 'frame',
    origin: 'https://example.test',
    capturedAt: '2026-10-09T00:00:00.000Z',
    priorActivityAvailable: false,
    includeSources: true,
    scriptCount: '2',
    resourceCount: '2',
    coverage: {
        excludedScriptObservations: '0',
        omittedScriptObservations: '0',
        excludedResources: '0',
        excludedFrames: false,
        capturedSources: '2',
        sourceBytes: '100',
        partial: false,
    },
    reference: {
        sessionId: 'alice::main',
        runId: '89107b32-0000-4000-8000-000000000001',
        evidenceId: '89107b32-0000-4000-8000-000000000002',
        captureSha256: 'a'.repeat(64),
    },
    sourceRunSha256: 'b'.repeat(64),
    manifestSha256: 'c'.repeat(64),
    manifestBytes: '500',
    exportedFiles: '2',
};
const run: ReverseRunSnapshot = {
    version: 1,
    id: '89107b32-0000-4000-8000-000000000003',
    archive: { sessionId: 'alice::main' },
    revision: '1',
    inputName: 'Browser scripts',
    sha256: 'd'.repeat(64),
    question: 'Inspect captured source',
    kind: 'javascript',
    browserInput: source,
    state: 'running',
    tasks: [],
    evidenceCount: 0,
    evidence: [],
    cleanupErrors: [],
};
describe('captured browser analysis provenance', (): void => {
    it('keeps original source and derived analysis identities separate in bounded progress', (): void => {
        expect(ReverseInvestigation.parse(run)).toEqual(run);
        expect(
            ReverseInvestigation.parse({ ...run, browserInput: { ...source, exportedFiles: '1' } }),
        ).toMatchObject({ browserInput: { exportedFiles: '1' } });
    });
    it('rejects cross-conversation references, source bodies and impossible export metadata', (): void => {
        for (const change of [
            { reference: { ...source.reference, sessionId: 'bob::main' } },
            { reference: { ...source.reference, runId: run.id } },
            { sourceRunSha256: 'not-a-digest' },
            { manifestSha256: 'not-a-digest' },
            { manifestBytes: '0' },
            { manifestBytes: '01' },
            { exportedFiles: '3' },
            { exportedFiles: '0' },
            { includeSources: false },
            { scripts: ['BODY_SECRET'] },
            { text: 'BODY_SECRET' },
        ]) {
            expect((): ReverseRunSnapshot =>
                ReverseInvestigation.parse({ ...run, browserInput: { ...source, ...change } }),
            ).toThrow();
        }
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.parse({ ...run, kind: 'browser' }),
        ).toThrow();
    });
});
