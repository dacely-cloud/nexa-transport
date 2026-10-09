// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { BrowserScreenshotPage, BrowserScreenshotSnapshot } from '../src/protocol/Protocol';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation';
import { BrowserScreenshotReceipt } from '../src/reverse/BrowserScreenshotReceipt';

const page: BrowserScreenshotPage = {
    runId: '11111111-1111-4111-8111-111111111111',
    sha256: 'a'.repeat(64),
    evidenceId: '22222222-2222-4222-8222-222222222222',
    captureSha256: 'b'.repeat(64),
    view: 'metadata',
    cursor: '0',
    nextCursor: null,
    data: null,
    metadata: {
        provider: 'cdp-passive',
        targetId: 'page-1',
        frameId: 'frame-1',
        origin: 'https://example.test',
        capturedAt: '2026-10-09T00:00:00.000Z',
        mimeType: 'image/png',
        sha256: 'c'.repeat(64),
        bytes: '100000',
        width: 257,
        height: 131,
        viewport: { pageX: 0, pageY: 123, width: 257, height: 131, scale: 1 },
        coverage: 'visible-viewport',
    },
};
describe('portable bounded screenshot receipts', (): void => {
    it('accepts image-free metadata and exact advancing image byte ranges', (): void => {
        expect(ReverseInvestigation.screenshot(page)).toBe(page);
        const first: BrowserScreenshotPage = {
            ...page,
            view: 'image',
            data: btoa('x'.repeat(49152)),
            nextCursor: '49152',
        };
        expect(ReverseInvestigation.screenshot(first)).toBe(first);
        const escaped: BrowserScreenshotPage = {
            ...first,
            metadata: {
                ...first.metadata,
                origin: 'https://' + 'a'.repeat(4088),
                targetId: '\u0000'.repeat(256),
                frameId: '\u0000'.repeat(256),
            },
        };
        expect(JSON.stringify(escaped).length).toBeGreaterThan(70000);
        expect(ReverseInvestigation.screenshot(escaped)).toBe(escaped);
        const last: BrowserScreenshotPage = {
            ...page,
            view: 'image',
            cursor: '98304',
            data: btoa('x'.repeat(1696)),
        };
        expect(ReverseInvestigation.screenshot(last)).toBe(last);
        const snapshot: BrowserScreenshotSnapshot = {
            ...page.metadata,
            reference: {
                sessionId: 'alice::main',
                runId: page.runId,
                evidenceId: page.evidenceId,
                captureSha256: page.captureSha256,
            },
        };
        expect((): void =>
            BrowserScreenshotReceipt.snapshot(snapshot, page.runId, 'alice::main'),
        ).not.toThrow();
        expect((): void =>
            BrowserScreenshotReceipt.snapshot(snapshot, page.runId, 'bob::main'),
        ).toThrow();
    });
    it('rejects hidden pixel bodies, malformed dimensions, foreign provenance and forged page continuity', (): void => {
        const invalid: readonly unknown[] = [
            { ...page, data: 'AAAA' },
            { ...page, raw: 'HIDDEN' },
            { ...page, metadata: { ...page.metadata, data: 'HIDDEN' } },
            {
                ...page,
                metadata: {
                    ...page.metadata,
                    viewport: { ...page.metadata.viewport, raw: 'HIDDEN' },
                },
            },
            { ...page, metadata: { ...page.metadata, width: 1.5 } },
            { ...page, metadata: { ...page.metadata, bytes: '4194305' } },
            { ...page, metadata: { ...page.metadata, width: 16384, height: 16384 } },
            { ...page, metadata: { ...page.metadata, origin: 'https://user:secret@example.test' } },
            { ...page, cursor: '00' },
            { ...page, cursor: '1' },
            { ...page, nextCursor: '1' },
            { ...page, runId: '../workspace' },
            { ...page, view: 'image', data: '!!!!', nextCursor: '1' },
            { ...page, view: 'image', data: 'YQ==', nextCursor: '1' },
            { ...page, view: 'image', data: btoa('x'.repeat(49152)), nextCursor: '0' },
            { ...page, view: 'image', cursor: '100001', data: '' },
        ];
        for (const input of invalid) {
            expect((): BrowserScreenshotPage => ReverseInvestigation.screenshot(input)).toThrow();
        }
    });
});
