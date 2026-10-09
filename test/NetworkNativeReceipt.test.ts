import { describe, expect, it } from 'vitest';
import type {
    NetworkRequest,
    NetworkNativeSource,
    ReverseNetworkSnapshot,
} from '../src/protocol/Protocol.js';
import { NetworkReceipt } from '../src/reverse/NetworkReceipt.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

interface NativeRow extends NetworkRequest {
    readonly native: NetworkNativeSource;
}
function row(): NativeRow {
    return {
        id: 'entry:0',
        location: 'bytes:0-2014',
        native: {
            ordinal: '0',
            start: '0',
            end: '2014',
            flowType: 'tcp',
            flowId: 'native-tcp',
            stateVersion: '{"kind":"integer","decimal":"999"}',
        },
        method: null,
        status: null,
        url: null,
        urlTruncated: false,
        mimeType: '',
        startedDateTime: null,
        durationMs: null,
        requestBody: {
            mimeType: '',
            captured: false,
            binary: false,
            bytes: null,
            sha256: null,
            characters: 0,
            redacted: false,
        },
        responseBody: {
            mimeType: '',
            captured: false,
            binary: false,
            bytes: null,
            sha256: null,
            characters: 0,
            redacted: false,
        },
    };
}
describe('native flow provenance over typed transport', (): void => {
    it('accepts native absence and paged reported state without inventing HTTP fields', (): void => {
        const snapshot: ReverseNetworkSnapshot = {
            format: 'mitmproxy',
            version: '12.2.3',
            entryCount: 1,
            missingBodies: 1,
            redactedBodies: 0,
            issueCount: 0,
            requests: [row()],
            issues: [],
        };
        expect((): void => NetworkReceipt.validate(snapshot)).not.toThrow();
        expect(
            ReverseInvestigation.networkDetail({
                runId: 'run',
                sha256: 'a'.repeat(64),
                selector: 'entry:0',
                location: 'bytes:0-2014',
                view: 'reported',
                cursor: '0',
                nextCursor: null,
                characters: '2',
                captureSha256: 'b'.repeat(64),
                body: null,
                unavailable: null,
                text: '{}',
            }).view,
        ).toBe('reported');
    });
    it('rejects changed ordinals, oversized ranges, hidden payloads and native absence attributed to HAR', (): void => {
        const { native: _native, ...har }: NativeRow = row();
        for (const value of [
            { ...row(), location: 'bytes:0-2015' },
            { ...row(), native: { ...row().native, ordinal: '1' } },
            {
                ...row(),
                location: 'bytes:0-16777217',
                native: { ...row().native, end: '16777217' },
            },
            { ...har, location: '$.log.entries[0]' },
            { ...row(), native: { ...row().native, raw: 'payload' } },
        ]) {
            expect((): void => NetworkReceipt.request(value)).toThrow();
        }
    });
});
