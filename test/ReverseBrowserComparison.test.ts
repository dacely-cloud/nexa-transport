// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type {
    BrowserScreenshotComparisonSnapshot,
    ReverseRunSnapshot,
} from '../src/protocol/Protocol';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation';

const sourceRun = '11111111-1111-4111-8111-111111111111' as const;
const comparisonRun = '33333333-3333-4333-8333-333333333333' as const;
const session = 'alice::main' as const;
const comparison: BrowserScreenshotComparisonSnapshot = {
    before: {
        reference: {
            sessionId: session,
            runId: sourceRun,
            evidenceId: '22222222-2222-4222-8222-222222222222',
            captureSha256: 'b'.repeat(64),
        },
        sha256: 'a'.repeat(64),
        metadata: {
            provider: 'cdp-passive',
            targetId: 'page-1',
            frameId: 'frame-1',
            origin: 'https://example.test',
            capturedAt: '2026-10-09T00:00:00.000Z',
            mimeType: 'image/png',
            sha256: 'c'.repeat(64),
            bytes: '100',
            width: 2,
            height: 2,
            viewport: { pageX: 0, pageY: 0, width: 2, height: 2, scale: 1 },
            coverage: 'visible-viewport',
        },
    },
    after: {
        reference: {
            sessionId: session,
            runId: sourceRun,
            evidenceId: '44444444-4444-4444-8444-444444444444',
            captureSha256: 'd'.repeat(64),
        },
        sha256: 'a'.repeat(64),
        metadata: {
            provider: 'cdp-passive',
            targetId: 'page-1',
            frameId: 'frame-1',
            origin: 'https://example.test',
            capturedAt: '2026-10-09T00:00:01.000Z',
            mimeType: 'image/png',
            sha256: 'e'.repeat(64),
            bytes: '100',
            width: 2,
            height: 2,
            viewport: { pageX: 0, pageY: 0, width: 2, height: 2, scale: 1 },
            coverage: 'visible-viewport',
        },
    },
    metrics: {
        algorithm: 'rgba-channel-v1',
        beforeWidth: 2,
        beforeHeight: 2,
        afterWidth: 2,
        afterHeight: 2,
        channelThreshold: 1,
        status: 'different',
        comparedPixels: '4',
        changedPixels: '1',
        changedRatio: 0.25,
        absoluteChannelDelta: '2',
        maximumChannelDelta: 2,
        meanAbsoluteChannelDelta: 0.125,
        bounds: { x: 1, y: 0, width: 1, height: 1 },
    },
    reference: {
        sessionId: session,
        runId: comparisonRun,
        evidenceId: '55555555-5555-4555-8555-555555555555',
        captureSha256: 'f'.repeat(64),
    },
};
const run: ReverseRunSnapshot = {
    version: 1,
    id: comparisonRun,
    revision: '1',
    inputName: 'Screenshot comparison',
    sha256: 'a'.repeat(64),
    question: 'Compare viewports',
    kind: 'browser',
    state: 'done',
    tasks: [],
    evidenceCount: 0,
    evidence: [],
    cleanupErrors: [],
    archive: { sessionId: session },
    browserComparison: comparison,
};
describe('portable screenshot comparison progress', (): void => {
    it('keeps exact metrics and both original identities without pixel bodies', (): void => {
        expect(ReverseInvestigation.parse(run)).toEqual(run);
        const tolerated: BrowserScreenshotComparisonSnapshot = {
            ...comparison,
            metrics: {
                ...comparison.metrics,
                channelThreshold: 2,
                status: 'within-threshold',
                changedPixels: '0',
                changedRatio: 0,
                bounds: null,
            },
        };
        expect(
            ReverseInvestigation.parse({ ...run, browserComparison: tolerated }).browserComparison
                ?.metrics.maximumChannelDelta,
        ).toBe(2);
        const mismatch: BrowserScreenshotComparisonSnapshot = {
            ...comparison,
            after: { ...comparison.after, metadata: { ...comparison.after.metadata, width: 3 } },
            metrics: {
                ...comparison.metrics,
                afterWidth: 3,
                status: 'dimension-mismatch',
                comparedPixels: '0',
                changedPixels: null,
                changedRatio: null,
                absoluteChannelDelta: null,
                maximumChannelDelta: null,
                meanAbsoluteChannelDelta: null,
                bounds: null,
            },
        };
        expect(
            ReverseInvestigation.parse({ ...run, browserComparison: mismatch }).browserComparison
                ?.metrics.changedPixels,
        ).toBeNull();
    });
    it('rejects foreign originals, hidden images and internally contradictory metrics', (): void => {
        const invalid: readonly unknown[] = [
            {
                ...comparison,
                before: {
                    ...comparison.before,
                    reference: { ...comparison.before.reference, sessionId: 'bob::main' },
                },
            },
            {
                ...comparison,
                before: {
                    ...comparison.before,
                    metadata: { ...comparison.before.metadata, data: 'secret-pixels' },
                },
            },
            { ...comparison, after: { ...comparison.after, sha256: 'invalid' } },
            { ...comparison, reference: { ...comparison.reference, runId: sourceRun } },
            { ...comparison, metrics: { ...comparison.metrics, meanAbsoluteChannelDelta: 1 } },
            { ...comparison, metrics: { ...comparison.metrics, changedRatio: 0.5 } },
            { ...comparison, metrics: { ...comparison.metrics, status: 'identical' } },
            {
                ...comparison,
                metrics: { ...comparison.metrics, bounds: { x: 2, y: 0, width: 1, height: 1 } },
            },
            { ...comparison, metrics: { ...comparison.metrics, beforeWidth: 3 } },
            {
                ...comparison,
                metrics: { ...comparison.metrics, absoluteChannelDelta: '9'.repeat(200) },
            },
            { ...comparison, raw: 'unexpected-body' },
        ];
        for (const browserComparison of invalid) {
            expect((): ReverseRunSnapshot =>
                ReverseInvestigation.parse({ ...run, browserComparison }),
            ).toThrow();
        }
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.parse({ ...run, kind: 'source' }),
        ).toThrow();
    });
});
