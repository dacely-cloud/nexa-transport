// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import type {
    BrowserSourcesPage,
    BrowserSourceScriptRow,
    BrowserSourcesSnapshot,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';
import { BrowserSourcesReceipt } from '../src/reverse/BrowserSourcesReceipt.js';

const script: BrowserSourceScriptRow = {
    kind: 'script',
    id: 'c'.repeat(64) + ':1',
    frameId: 'frame',
    url: 'https://example.test/app.js',
    cdpHash: null,
    length: '12',
    language: 'JavaScript',
    isModule: true,
    hasSourceUrl: false,
    startLine: 0,
    startColumn: 0,
    endLine: 1,
    endColumn: 0,
    resourceIds: [],
    sourceMap: null,
    sourceMapOmitted: false,
    source: { state: 'captured', sha256: 'd'.repeat(64), bytes: '12' },
};
const page: BrowserSourcesPage = {
    runId: '89107b32-0000-4000-8000-000000000001',
    evidenceId: '89107b32-0000-4000-8000-000000000002',
    sha256: 'a'.repeat(64),
    captureSha256: 'b'.repeat(64),
    view: 'scripts',
    selector: null,
    cursor: '0',
    nextCursor: null,
    total: '1',
    records: [script],
    text: null,
    sourceSha256: null,
    sourceBytes: null,
    metadata: {
        provider: 'cdp-passive',
        targetId: 'target',
        frameId: 'frame',
        origin: 'https://example.test',
        capturedAt: '2026-10-09T00:00:00.000Z',
        priorActivityAvailable: false,
        includeSources: true,
        scriptCount: '1',
        resourceCount: '0',
        coverage: {
            excludedScriptObservations: '0',
            omittedScriptObservations: '0',
            excludedResources: '0',
            excludedFrames: false,
            capturedSources: '1',
            sourceBytes: '12',
            partial: false,
        },
    },
};
describe('saved browser source receipts', (): void => {
    it('accepts separate metadata, resource and exact Unicode text pages', (): void => {
        expect(ReverseInvestigation.sources(page)).toEqual(page);
        expect(
            ReverseInvestigation.sources({ ...page, view: 'resources', total: '0', records: [] }),
        ).toMatchObject({ records: [] });
        const text: BrowserSourcesPage = {
            ...page,
            view: 'source',
            selector: script.id,
            records: [],
            total: '12',
            nextCursor: '4',
            text: '💻éx',
            sourceSha256: script.source.sha256,
            sourceBytes: '14',
            metadata: {
                ...page.metadata,
                coverage: { ...page.metadata.coverage, sourceBytes: '14' },
            },
        };
        expect(ReverseInvestigation.sources(text)).toEqual(text);
        expect(
            ReverseInvestigation.sources({
                ...text,
                cursor: '4',
                text: 'x'.repeat(8),
                nextCursor: null,
            }),
        ).toMatchObject({ cursor: '4' });
    });
    it('rejects hidden source bodies, invalid identities, mixed representations and stalled cursors', (): void => {
        for (const changed of [
            { records: [{ ...script, source: { ...script.source, text: 'BODY_SECRET' } }] },
            { metadata: { ...page.metadata, scripts: ['BODY_SECRET'] } },
            { records: [{ ...script, id: 'script' }] },
            { records: [{ ...script, url: 'https://foreign.test/app.js' }] },
            { records: [{ ...script, url: 'https://example.test/app.js?token=SECRET' }] },
            { records: [{ ...script, startLine: 2 }] },
            { records: [{ ...script, resourceIds: ['d'.repeat(64) + ':1'] }] },
            { cursor: '01' },
            { nextCursor: '1' },
            { total: '2' },
            { records: [] },
            { text: 'BODY_SECRET' },
            { selector: script.id },
            { sourceSha256: 'a'.repeat(64) },
        ]) {
            expect((): BrowserSourcesPage =>
                ReverseInvestigation.sources({ ...page, ...changed }),
            ).toThrow();
        }
    });
    it('rejects split Unicode, inconsistent byte ranges and directory rows inside source pages', (): void => {
        const source: BrowserSourcesPage = {
            ...page,
            view: 'source',
            selector: script.id,
            records: [],
            total: '12',
            nextCursor: '4',
            text: '💻éx',
            sourceSha256: script.source.sha256,
            sourceBytes: '12',
        };
        for (const changed of [
            { text: '\ud83d' },
            { text: '\udcbb' },
            { text: '' },
            { selector: null },
            { records: [script] },
            { sourceBytes: '1' },
            { sourceSha256: 'SHA' },
            { total: '40' },
            { nextCursor: '3' },
            { text: 'x'.repeat(12000) },
            { metadata: { ...source.metadata, includeSources: false } },
        ]) {
            expect((): BrowserSourcesPage =>
                ReverseInvestigation.sources({ ...source, ...changed }),
            ).toThrow();
        }
    });
    it('binds body-free progress to the original run and conversation', (): void => {
        const snapshot: BrowserSourcesSnapshot = {
            ...page.metadata,
            reference: {
                sessionId: 'alice::main',
                runId: page.runId,
                evidenceId: page.evidenceId,
                captureSha256: page.captureSha256,
            },
        };
        expect((): void =>
            BrowserSourcesReceipt.snapshot(snapshot, page.runId, 'alice::main'),
        ).not.toThrow();
        expect((): void =>
            BrowserSourcesReceipt.snapshot(snapshot, page.runId, 'bob::main'),
        ).toThrow();
        expect((): void =>
            BrowserSourcesReceipt.snapshot(snapshot, page.evidenceId, 'alice::main'),
        ).toThrow();
        expect((): void =>
            BrowserSourcesReceipt.snapshot(
                { ...snapshot, reference: { ...snapshot.reference, evidenceId: 'not-an-id' } },
                page.runId,
            ),
        ).toThrow();
    });
});
