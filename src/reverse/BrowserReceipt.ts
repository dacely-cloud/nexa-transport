// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    ReverseBrowserPage,
    ReverseBrowserMetadata,
    ReverseBrowserSnapshot,
    BrowserActivityRecord,
    BrowserActivityLocation,
    BrowserActivityCoverage,
} from '../protocol/Protocol.js';
import { reverseBrowser } from '../protocol/Validators.js';
type BrowserFields =
    | ReverseBrowserPage
    | ReverseBrowserMetadata
    | BrowserActivityRecord
    | BrowserActivityLocation
    | BrowserActivityCoverage
    | ReverseBrowserSnapshot['reference'];

/** Portable validation for saved browser metadata before any application renders it. */
export class BrowserReceipt {
    /** Requires exact capture identity, ordered bounded rows, coherent cursors and explicit coverage. */
    public static read(input: unknown): ReverseBrowserPage {
        if (!reverseBrowser(input)) {
            throw new TypeError('Invalid saved browser capture page');
        }
        this.#keys(input, [
            'runId',
            'sha256',
            'evidenceId',
            'captureSha256',
            'metadata',
            'cursor',
            'nextCursor',
            'total',
            'records',
        ]);
        if (
            !this.#uuid(input.runId) ||
            !this.#uuid(input.evidenceId) ||
            !this.#hash(input.sha256) ||
            !this.#hash(input.captureSha256) ||
            !this.#decimal(input.cursor) ||
            !this.#integer(input.total, 2000) ||
            input.records.length > 20 ||
            JSON.stringify(input).length > 12000
        ) {
            throw new RangeError('Browser capture exceeds presentation limits');
        }
        const offset: bigint = BigInt(input.cursor);
        const end: bigint = offset + BigInt(input.records.length);
        if (
            offset > BigInt(input.total) ||
            end > BigInt(input.total) ||
            (input.records.length === 0 && offset < BigInt(input.total)) ||
            input.nextCursor !== (end < BigInt(input.total) ? end.toString() : null)
        ) {
            throw new RangeError('Inconsistent browser capture pagination');
        }
        this.metadata(input.metadata);
        let ordinal: number = 0;
        for (const row of input.records) {
            this.#record(row, input.metadata.origin);
            if (row.ordinal <= ordinal) {
                throw new RangeError('Browser capture record order changed');
            }
            ordinal = row.ordinal;
            if (
                row.kind === 'request' &&
                input.metadata.coverage.networkCompleteWithinWindow &&
                (!row.finished || row.reusedWithoutRedirect)
            ) {
                throw new RangeError('Browser capture hides incomplete network evidence');
            }
        }
        return input;
    }
    /** Validates a bounded live receipt's durable provenance independently of event pages. */
    public static snapshot(
        value: ReverseBrowserSnapshot,
        runId: string,
        sessionId: string | undefined,
    ): void {
        this.metadata(value, true);
        this.#keys(value.reference, ['sessionId', 'runId', 'evidenceId', 'captureSha256']);
        if (
            !this.#integer(value.recordCount, 2000) ||
            value.reference.runId !== runId ||
            !this.#uuid(value.reference.evidenceId) ||
            !this.#hash(value.reference.captureSha256) ||
            value.reference.sessionId.length === 0 ||
            value.reference.sessionId.length > 1024 ||
            value.reference.sessionId !== sessionId
        ) {
            throw new RangeError('Invalid browser capture provenance');
        }
    }
    /** Limits metadata, normalizes no values and refuses contradictory coverage declarations. */
    public static metadata(value: ReverseBrowserMetadata, snapshot: boolean = false): void {
        this.#keys(value, [
            'provider',
            'targetId',
            'origin',
            'url',
            'startedAt',
            'endedAt',
            'observationMs',
            'coverage',
            ...(snapshot ? ['reference', 'recordCount'] : []),
        ]);
        const origin: URL = new URL(value.origin);
        if (
            !['http:', 'https:'].includes(origin.protocol) ||
            origin.origin !== value.origin ||
            value.provider !== 'cdp-passive' ||
            !this.#identity(value.targetId) ||
            !this.#integer(value.observationMs, 10000) ||
            value.observationMs < 50 ||
            !this.#date(value.startedAt) ||
            !this.#date(value.endedAt) ||
            Date.parse(value.endedAt) < Date.parse(value.startedAt)
        ) {
            throw new RangeError('Invalid browser observation metadata');
        }
        this.url(value.url, value.origin);
        const coverage: ReverseBrowserMetadata['coverage'] = value.coverage;
        this.#keys(coverage, [
            'priorActivityAvailable',
            'truncated',
            'reusedRequestIds',
            'excluded',
            'missingPredecessors',
            'unfinishedRequests',
            'networkCompleteWithinWindow',
        ]);
        if (
            coverage.priorActivityAvailable ||
            ![
                coverage.reusedRequestIds,
                coverage.excluded,
                coverage.missingPredecessors,
                coverage.unfinishedRequests,
            ].every((value: string): boolean => this.#decimal(value)) ||
            (coverage.networkCompleteWithinWindow &&
                (coverage.truncated ||
                    coverage.reusedRequestIds !== '0' ||
                    coverage.missingPredecessors !== '0' ||
                    coverage.unfinishedRequests !== '0'))
        ) {
            throw new RangeError('Inconsistent browser observation coverage');
        }
    }
    static #record(row: BrowserActivityRecord, origin: string): void {
        if (
            !this.#integer(row.ordinal, 1000000) ||
            row.ordinal === 0 ||
            JSON.stringify(row).length > 6000
        ) {
            throw new RangeError('Invalid browser event identity');
        }
        if (row.kind === 'request') {
            this.#keys(row, [
                'kind',
                'ordinal',
                'requestId',
                'frameId',
                'url',
                'method',
                'resourceType',
                'timestamp',
                'initiator',
                'status',
                'mimeType',
                'encodedBytes',
                'finished',
                'failed',
                'redirectedTo',
                'reusedWithoutRedirect',
            ]);
            this.url(row.url, origin);
            this.#location(row.initiator, origin);
            if (
                !this.#identity(row.requestId) ||
                !this.#identity(row.frameId) ||
                !/^[A-Z!#$%&'*+.^_`|~-]{1,32}$/u.test(row.method) ||
                row.resourceType.length > 64 ||
                ![
                    'Document',
                    'Stylesheet',
                    'Image',
                    'Media',
                    'Font',
                    'Script',
                    'TextTrack',
                    'XHR',
                    'Fetch',
                    'Prefetch',
                    'EventSource',
                    'WebSocket',
                    'Manifest',
                    'SignedExchange',
                    'Ping',
                    'CSPViolationReport',
                    'Preflight',
                    'FedCM',
                    'Other',
                ].includes(row.resourceType) ||
                !this.#timestamp(row.timestamp) ||
                (row.status !== null && !this.#integer(row.status, 999)) ||
                (row.encodedBytes !== null && !this.#decimal(row.encodedBytes)) ||
                (row.mimeType !== null &&
                    (row.mimeType.length > 256 ||
                        !/^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/u.test(row.mimeType))) ||
                (row.redirectedTo !== null &&
                    (!this.#integer(row.redirectedTo, 1000000) ||
                        row.redirectedTo <= row.ordinal)) ||
                (row.failed && !row.finished)
            ) {
                throw new RangeError('Invalid captured browser request');
            }
        } else if (row.kind === 'console') {
            this.#keys(row, [
                'kind',
                'ordinal',
                'callType',
                'argumentTypes',
                'timestamp',
                'source',
            ]);
            this.#location(row.source, origin);
            if (
                row.callType.length > 64 ||
                ![
                    'log',
                    'debug',
                    'info',
                    'error',
                    'warning',
                    'dir',
                    'dirxml',
                    'table',
                    'trace',
                    'clear',
                    'startGroup',
                    'startGroupCollapsed',
                    'endGroup',
                    'assert',
                    'profile',
                    'profileEnd',
                    'count',
                    'timeEnd',
                ].includes(row.callType) ||
                row.argumentTypes.length > 64 ||
                row.argumentTypes.some(
                    (type: string): boolean =>
                        ![
                            'object',
                            'function',
                            'undefined',
                            'string',
                            'number',
                            'boolean',
                            'symbol',
                            'bigint',
                        ].includes(type),
                ) ||
                !this.#timestamp(row.timestamp)
            ) {
                throw new RangeError('Invalid captured browser console metadata');
            }
        } else if (row.kind === 'websocket') {
            this.#keys(row, [
                'kind',
                'ordinal',
                'requestId',
                'url',
                'direction',
                'opcode',
                'bytes',
                'timestamp',
            ]);
            this.url(row.url, origin, true);
            if (
                !this.#identity(row.requestId) ||
                !['sent', 'received'].includes(row.direction) ||
                !this.#integer(row.opcode, 15) ||
                !this.#decimal(row.bytes) ||
                !this.#timestamp(row.timestamp)
            ) {
                throw new RangeError('Invalid captured WebSocket metadata');
            }
        } else {
            this.#keys(row, ['kind', 'ordinal', 'url', 'sameDocument']);
            this.url(row.url, origin);
        }
    }
    static #location(value: BrowserActivityLocation | null, origin: string): void {
        if (value === null) {
            return;
        }
        this.#keys(value, ['url', 'line', 'column']);
        this.url(value.url, origin);
        if (!this.#integer(value.line, 10000000) || !this.#integer(value.column, 10000000)) {
            throw new RangeError('Invalid browser source location');
        }
    }
    /** Requires the selected origin and redacted known credentials without rewriting producer metadata. */
    public static url(value: string, origin: string, socket: boolean = false): void {
        if (value.length > 4096) {
            throw new RangeError('Browser URL exceeds presentation limits');
        }
        const url: URL = new URL(value);
        if (socket && ['ws:', 'wss:'].includes(url.protocol)) {
            url.protocol = url.protocol === 'ws:' ? 'http:' : 'https:';
        }
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.origin !== origin ||
            url.username !== '' ||
            url.password !== ''
        ) {
            throw new RangeError('Browser capture left its selected origin');
        }
        for (const [key, text] of url.searchParams) {
            const normalized: string = key.toLowerCase().replace(/[^a-z0-9]/gu, '');
            if (
                (/(?:authorization|cookie|password|passwd|secret|token|apikey|credential|sessionid)/u.test(
                    normalized,
                ) ||
                    normalized === 'key' ||
                    normalized === 'auth') &&
                text !== '[redacted]'
            ) {
                throw new RangeError('Browser URL contains an unredacted credential');
            }
        }
    }
    static #integer(value: number, maximum: number): boolean {
        return Number.isSafeInteger(value) && value >= 0 && value <= maximum;
    }
    static #identity(value: string): boolean {
        return value.length > 0 && value.length <= 128;
    }
    static #timestamp(value: string): boolean {
        return (
            value.length <= 64 &&
            /^[0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?$/u.test(value) &&
            Number.isFinite(Number(value))
        );
    }
    static #decimal(value: string): boolean {
        return /^(?:0|[1-9][0-9]{0,39})$/u.test(value);
    }
    static #hash(value: string): boolean {
        return /^[a-f0-9]{64}$/u.test(value);
    }
    static #uuid(value: string): boolean {
        return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u.test(value);
    }
    static #date(value: string): boolean {
        const time: number = Date.parse(value);
        return (
            value.length <= 40 && Number.isFinite(time) && new Date(time).toISOString() === value
        );
    }
    static #keys(value: BrowserFields, keys: readonly string[]): void {
        if (
            Object.keys(value).length !== keys.length ||
            keys.some((key: string): boolean => !Object.hasOwn(value, key))
        ) {
            throw new RangeError('Unexpected browser capture fields');
        }
    }
}
