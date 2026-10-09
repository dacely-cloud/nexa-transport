import { describe, expect, it } from 'vitest';
import type {
    NetworkBody,
    ReverseNetworkDirectoryPage,
    ReverseNetworkDirectoryRow,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

function row(index: number): ReverseNetworkDirectoryRow {
    const body: NetworkBody = {
        mimeType: 'application/json',
        captured: true,
        binary: false,
        bytes: '20',
        sha256: 'a'.repeat(64),
        characters: 20,
        redacted: false,
    };
    return {
        id: `entry:${index}`,
        location: `$.log.entries[${index}]`,
        method: 'GET',
        url: 'https://example.test/api',
        urlTruncated: false,
        status: 200,
        mimeType: 'application/json',
        startedDateTime: '2026-10-09T12:00:00Z',
        durationMs: 10,
        requestBody: body,
        responseBody: body,
        requestEvidenceId: null,
        responseEvidenceId: 'captured-response',
    };
}
function page(): ReverseNetworkDirectoryPage {
    return {
        runId: 'run',
        sha256: 'a'.repeat(64),
        state: 'ready',
        error: null,
        cursor: '0',
        nextCursor: '2',
        total: '100',
        sourceEntries: '100',
        requests: [row(0), row(1)],
    };
}
describe('network directory wire receipts', (): void => {
    it('accepts bounded metadata pages and exact end cursors without requiring fixed-size rows', (): void => {
        expect(ReverseInvestigation.network(page())).toEqual(page());
        expect(
            ReverseInvestigation.network({
                ...page(),
                cursor: '98',
                nextCursor: null,
                requests: [row(98), row(99)],
            }).nextCursor,
        ).toBeNull();
    });
    it('rejects forged pagination, source order, payload fields and oversized metadata', (): void => {
        const first: ReverseNetworkDirectoryRow = row(0);
        for (const invalid of [
            { ...page(), nextCursor: '3' },
            { ...page(), cursor: '01' },
            { ...page(), sourceEntries: '1' },
            { ...page(), requests: [row(1), row(0)] },
            { ...page(), requests: [] },
            { ...page(), requests: [{ ...first, requestText: 'payload data' }, row(1)] },
            {
                ...page(),
                requests: [
                    { ...first, responseBody: { ...first.responseBody, text: 'payload data' } },
                    row(1),
                ],
            },
            { ...page(), requests: [{ ...first, responseEvidenceId: '../../secret' }, row(1)] },
            { ...page(), requests: [{ ...first, url: 'x'.repeat(4097) }, row(1)] },
            {
                ...page(),
                requests: Array.from(
                    { length: 20 },
                    (_value: unknown, index: number): ReverseNetworkDirectoryRow => ({
                        ...row(index),
                        url: 'x'.repeat(1000),
                    }),
                ),
                nextCursor: '20',
            },
        ]) {
            expect((): void => {
                ReverseInvestigation.network(invalid);
            }).toThrow();
        }
    });
});
