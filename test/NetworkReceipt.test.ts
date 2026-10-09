import { describe, expect, it } from 'vitest';
import type {
    NetworkBody,
    ReverseNetworkSnapshot,
    ReverseRunSnapshot,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

function snapshot(): ReverseRunSnapshot {
    const body: NetworkBody = {
        mimeType: 'application/json',
        captured: true,
        binary: false,
        bytes: '50',
        sha256: 'a'.repeat(64),
        characters: 44,
        redacted: true,
    };
    const network: ReverseNetworkSnapshot = {
        format: 'har',
        version: '1.2',
        entryCount: 1,
        missingBodies: 0,
        redactedBodies: 2,
        issueCount: 0,
        requests: [
            {
                id: 'entry:0',
                location: '$.log.entries[0]',
                method: 'POST',
                url: 'https://example.test/api',
                urlTruncated: false,
                status: 200,
                mimeType: 'application/json',
                startedDateTime: '2026-10-09T12:00:00Z',
                durationMs: 12.5,
                requestBody: body,
                responseBody: body,
            },
        ],
        issues: [],
    };
    return {
        version: 1,
        id: 'run',
        revision: '1',
        kind: 'network',
        network,
        inputName: 'capture.har',
        sha256: 'a'.repeat(64),
        question: 'Inspect protocol',
        state: 'running',
        tasks: [],
        evidenceCount: 0,
        evidence: [],
        cleanupErrors: [],
    };
}
function projection(): ReverseNetworkSnapshot {
    const network: ReverseNetworkSnapshot | undefined = snapshot().network;
    if (network === undefined) {
        throw new Error('Missing fixture');
    }
    return network;
}
describe('network investigation receipts', (): void => {
    it('accepts HAR provenance without leaking payload bodies or query capabilities', (): void => {
        expect(ReverseInvestigation.parse(snapshot()).network).toEqual(projection());
    });
    it('rejects wrong target, invalid counts, oversized previews and forged entry pointers', (): void => {
        const network: ReverseNetworkSnapshot = projection();
        const first: ReverseNetworkSnapshot['requests'][number] | undefined = network.requests[0];
        if (first === undefined) {
            throw new Error('Missing request');
        }
        expect((): void => {
            ReverseInvestigation.parse({ ...snapshot(), kind: 'native' });
        }).toThrow('network target');
        for (const invalid of [
            { ...network, entryCount: -1 },
            { ...network, missingBodies: 2 },
            { ...network, requests: [...network.requests, ...network.requests] },
            { ...network, requests: [{ ...first, location: '$.log.entries[99]' }] },
            { ...network, requests: [{ ...first, url: 'x'.repeat(513) }] },
            {
                ...network,
                requests: [{ ...first, responseBody: { ...first.responseBody, sha256: 'bad' } }],
            },
            {
                ...network,
                requests: [{ ...first, responseBody: { ...first.responseBody, captured: false } }],
            },
        ]) {
            expect((): void => {
                ReverseInvestigation.parse({ ...snapshot(), network: invalid });
            }).toThrow();
        }
    });
});
