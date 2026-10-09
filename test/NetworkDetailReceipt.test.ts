import { describe, expect, it } from 'vitest';
import type { ReverseNetworkDetailPage } from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

function page(): ReverseNetworkDetailPage {
    return {
        runId: 'run',
        sha256: 'a'.repeat(64),
        selector: 'entry:4',
        location: '$.log.entries[4]',
        view: 'response-body',
        cursor: '0',
        nextCursor: '3',
        characters: '5',
        captureSha256: 'b'.repeat(64),
        body: {
            mimeType: 'text/plain',
            captured: true,
            binary: false,
            bytes: '5',
            sha256: 'c'.repeat(64),
            characters: 5,
            redacted: false,
        },
        unavailable: null,
        text: 'abc',
    };
}
describe('saved request detail wire receipts', (): void => {
    it('accepts independent paged bodies, header projections and explicitly unavailable content', (): void => {
        expect(ReverseInvestigation.networkDetail(page())).toEqual(page());
        expect(
            ReverseInvestigation.networkDetail({ ...page(), view: 'request-headers', body: null }),
        ).toMatchObject({ body: null });
        expect(
            ReverseInvestigation.networkDetail({
                ...page(),
                cursor: '3',
                nextCursor: null,
                text: 'de',
            }).nextCursor,
        ).toBeNull();
        expect(
            ReverseInvestigation.networkDetail({
                ...page(),
                characters: '0',
                nextCursor: null,
                text: '',
                unavailable: 'Binary payload has no text projection',
                body: { ...page().body, characters: 0, binary: true },
            }).unavailable,
        ).toContain('Binary');
    });
    it('rejects changed identity, forged pagination, unbounded wire text and inconsistent coverage', (): void => {
        for (const invalid of [
            { ...page(), selector: 'entry:04' },
            { ...page(), location: '$.log.entries[3]' },
            { ...page(), nextCursor: '4' },
            { ...page(), text: '' },
            { ...page(), cursor: '01' },
            { ...page(), characters: '9007199254740993' },
            { ...page(), captureSha256: 'wrong' },
            { ...page(), view: 'timings' },
            { ...page(), body: null },
            { ...page(), unavailable: 'missing' },
            { ...page(), body: { ...page().body, captured: false } },
            { ...page(), body: { ...page().body, characters: 3 } },
            { ...page(), cursor: '0', nextCursor: '1', text: '\uD83D' },
            { ...page(), raw: 'extra raw payload' },
            {
                ...page(),
                text: '\u0001'.repeat(3000),
                characters: '3000',
                nextCursor: null,
                body: { ...page().body, characters: 3000 },
            },
        ]) {
            expect((): ReverseNetworkDetailPage =>
                ReverseInvestigation.networkDetail(invalid),
            ).toThrow();
        }
    });
});
