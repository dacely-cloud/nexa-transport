import type { NetworkBody, NetworkRequest, ReverseNetworkSnapshot } from '../protocol/Protocol.js';

import { NetworkSourceReceipt } from './NetworkSourceReceipt.js';

/** Portable bounds for capability-free HAR previews; payloads remain in paged evidence storage. */
export class NetworkReceipt {
    /** Validates counts, source entry pointers and original payload digests after wire-shape validation. */
    public static validate(value: ReverseNetworkSnapshot): void {
        const counts: readonly number[] = [
            value.entryCount,
            value.missingBodies,
            value.redactedBodies,
            value.issueCount,
        ];
        if (
            !(
                (value.format === 'har' && value.version === '1.2') ||
                (value.format === 'mitmproxy' && value.version === '12.2.3')
            ) ||
            counts.some(
                (count: number): boolean =>
                    !Number.isSafeInteger(count) || count < 0 || count > 300000,
            ) ||
            value.entryCount > 100000 ||
            value.missingBodies > value.entryCount ||
            value.redactedBodies > value.entryCount * 2 ||
            value.requests.length > 6 ||
            value.requests.length > value.entryCount ||
            value.issues.length > 8 ||
            value.issues.length > value.issueCount ||
            new Set(value.requests.map((request): string => request.id)).size !==
                value.requests.length
        ) {
            throw new RangeError('Network projection exceeds presentation limits');
        }
        for (const request of value.requests) {
            this.request(request);
            if ((value.format === 'mitmproxy') !== (request.native !== undefined)) {
                throw new RangeError('Capture format changed');
            }
            if (BigInt(request.id.slice(6)) >= BigInt(value.entryCount)) {
                throw new RangeError('Invalid HAR request provenance');
            }
        }
        if (
            value.issues.some(
                (issue): boolean => issue.location.length > 256 || issue.message.length > 1000,
            )
        ) {
            throw new RangeError('Network coverage gap exceeds presentation limits');
        }
    }
    /** Shared request checks support compact progress previews and full metadata directory rows. */
    public static request(request: NetworkRequest, maximumUrl: number = 512): void {
        if (
            !NetworkSourceReceipt.request(request) ||
            (request.url?.length ?? 0) > maximumUrl ||
            (request.method?.length ?? 0) > 32 ||
            request.mimeType.length > 256 ||
            (request.startedDateTime !== null &&
                (request.startedDateTime.length > 128 ||
                    !Number.isFinite(Date.parse(request.startedDateTime)))) ||
            (request.status !== null &&
                (!Number.isInteger(request.status) ||
                    request.status < 0 ||
                    request.status > 999)) ||
            (request.durationMs !== null &&
                (!Number.isFinite(request.durationMs) ||
                    request.durationMs < 0 ||
                    request.durationMs > Number.MAX_SAFE_INTEGER)) ||
            (request.native === undefined &&
                [
                    request.url,
                    request.method,
                    request.startedDateTime,
                    request.status,
                    request.durationMs,
                ].includes(null)) ||
            request.mimeType !== request.responseBody.mimeType ||
            Object.keys(request).some(
                (key: string): boolean =>
                    ![
                        'id',
                        'location',
                        'method',
                        'url',
                        'urlTruncated',
                        'status',
                        'mimeType',
                        'startedDateTime',
                        'durationMs',
                        'requestBody',
                        'responseBody',
                        'requestEvidenceId',
                        'responseEvidenceId',
                        'native',
                    ].includes(key),
            )
        ) {
            throw new RangeError('Invalid HAR request provenance');
        }
        this.body(request.requestBody);
        this.body(request.responseBody);
    }
    /** Validates payload observation metadata without requiring its text in progress events. */
    public static body(body: NetworkBody): void {
        if (
            Object.keys(body).some(
                (key: string): boolean =>
                    ![
                        'mimeType',
                        'captured',
                        'binary',
                        'bytes',
                        'sha256',
                        'characters',
                        'redacted',
                    ].includes(key),
            ) ||
            body.mimeType.length > 256 ||
            !Number.isSafeInteger(body.characters) ||
            body.characters < 0 ||
            body.characters > 67108864 ||
            (body.sha256 !== null && !/^[a-f0-9]{64}$/u.test(body.sha256)) ||
            (body.bytes !== null &&
                (!/^[0-9]{1,10}$/u.test(body.bytes) || BigInt(body.bytes) > 16777216n)) ||
            (body.captured && (body.bytes === null || body.sha256 === null)) ||
            (!body.captured &&
                (body.bytes !== null ||
                    body.sha256 !== null ||
                    body.characters !== 0 ||
                    body.binary ||
                    body.redacted)) ||
            (body.binary && (body.characters !== 0 || body.redacted))
        ) {
            throw new RangeError('Invalid captured payload provenance');
        }
    }
}
