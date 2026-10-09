// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserSourcesProjection,
    BrowserSourcesSnapshot,
    BrowserSourceScriptRow,
    BrowserSourceResourceRow,
    BrowserScriptSourceMap,
    ReverseBrowserReference,
    BrowserSourcesPage,
} from '../protocol/Protocol.js';
import { BrowserReceipt } from './BrowserReceipt.js';

type SourceFields =
    | BrowserSourcesProjection
    | BrowserSourcesSnapshot
    | BrowserSourcesProjection['coverage']
    | BrowserSourceScriptRow
    | BrowserSourceResourceRow
    | BrowserSourceScriptRow['source']
    | BrowserScriptSourceMap
    | ReverseBrowserReference
    | BrowserSourcesPage;

/** Portable field validation rejects hidden source bodies and forged scope/provenance metadata. */
export class BrowserSourcesValues {
    /** Metadata counts describe the complete capture, not the selected directory page. */
    public static metadata(value: BrowserSourcesProjection, snapshot: boolean = false): void {
        this.keys(value, [
            'provider',
            'targetId',
            'frameId',
            'origin',
            'capturedAt',
            'priorActivityAvailable',
            'includeSources',
            'coverage',
            'scriptCount',
            'resourceCount',
            ...(snapshot ? ['reference'] : []),
        ]);
        const origin: URL = new URL(value.origin);
        const time: number = Date.parse(value.capturedAt);
        if (
            value.provider !== 'cdp-passive' ||
            value.priorActivityAvailable ||
            !['http:', 'https:'].includes(origin.protocol) ||
            origin.origin !== value.origin ||
            value.origin.length > 4096 ||
            !this.identity(value.targetId) ||
            !this.identity(value.frameId) ||
            value.capturedAt.length > 40 ||
            !Number.isFinite(time) ||
            new Date(time).toISOString() !== value.capturedAt ||
            !this.count(value.scriptCount, 50000n) ||
            !this.count(value.resourceCount, 100000n)
        ) {
            throw new RangeError('Invalid browser source metadata');
        }
        const coverage: BrowserSourcesProjection['coverage'] = value.coverage;
        this.keys(coverage, [
            'excludedScriptObservations',
            'omittedScriptObservations',
            'excludedResources',
            'excludedFrames',
            'capturedSources',
            'sourceBytes',
            'partial',
        ]);
        if (
            ![
                coverage.excludedScriptObservations,
                coverage.omittedScriptObservations,
                coverage.excludedResources,
            ].every((count: string): boolean => this.count(count, 9007199254740991n)) ||
            !this.count(coverage.capturedSources, BigInt(value.scriptCount)) ||
            !this.count(coverage.sourceBytes, 16777216n) ||
            (!value.includeSources &&
                (coverage.capturedSources !== '0' || coverage.sourceBytes !== '0')) ||
            (!coverage.partial &&
                (coverage.excludedFrames ||
                    coverage.excludedScriptObservations !== '0' ||
                    coverage.omittedScriptObservations !== '0' ||
                    coverage.excludedResources !== '0'))
        ) {
            throw new RangeError('Inconsistent browser source coverage');
        }
    }
    /** Directory scripts contain finite source descriptors, never source text. */
    public static script(row: BrowserSourceScriptRow, metadata: BrowserSourcesProjection): void {
        this.keys(row, [
            'kind',
            'id',
            'frameId',
            'url',
            'cdpHash',
            'length',
            'language',
            'isModule',
            'hasSourceUrl',
            'startLine',
            'startColumn',
            'endLine',
            'endColumn',
            'sourceMap',
            'sourceMapOmitted',
            'resourceIds',
            'source',
        ]);
        this.url(row.url, metadata.origin);
        this.keys(row.source, ['state', 'sha256', 'bytes']);
        if (
            !this.recordId(row.id, 50000n) ||
            !this.identity(row.frameId) ||
            row.language.length > 64 ||
            (row.cdpHash !== null && row.cdpHash.length > 256) ||
            (row.length !== null && !this.count(row.length, 9007199254740991n)) ||
            ![row.startLine, row.startColumn, row.endLine, row.endColumn].every(
                (value: number): boolean => Number.isSafeInteger(value) && value >= 0,
            ) ||
            row.endLine < row.startLine ||
            (row.endLine === row.startLine && row.endColumn < row.startColumn) ||
            row.resourceIds.length > Number(metadata.resourceCount) ||
            new Set(row.resourceIds).size !== row.resourceIds.length ||
            !row.resourceIds.every((id: string): boolean => this.recordId(id, 100000n))
        ) {
            throw new RangeError('Invalid browser script identity or location');
        }
        if (row.source.state === 'captured') {
            if (
                !metadata.includeSources ||
                row.language !== 'JavaScript' ||
                row.source.sha256 === null ||
                !this.hash(row.source.sha256) ||
                row.source.bytes === null ||
                !this.count(row.source.bytes, 2097152n) ||
                metadata.coverage.capturedSources === '0' ||
                BigInt(row.source.bytes) > BigInt(metadata.coverage.sourceBytes)
            ) {
                throw new RangeError('Invalid captured browser source descriptor');
            }
        } else if (
            row.source.sha256 !== null ||
            row.source.bytes !== null ||
            (metadata.includeSources
                ? row.source.state === 'not-selected'
                : row.source.state !== 'not-selected') ||
            (row.source.state === 'non-javascript' && row.language === 'JavaScript') ||
            (metadata.includeSources && !metadata.coverage.partial)
        ) {
            throw new RangeError('Invalid unavailable browser source descriptor');
        }
        if (row.sourceMap !== null) {
            this.keys(row.sourceMap, ['url', 'inline', 'declarationSha256', 'declarationLength']);
            if (
                !this.hash(row.sourceMap.declarationSha256) ||
                !this.count(row.sourceMap.declarationLength, 1048576n) ||
                row.sourceMap.declarationLength === '0' ||
                (row.sourceMap.inline && row.sourceMap.url !== null) ||
                row.sourceMapOmitted
            ) {
                throw new RangeError('Invalid browser source-map declaration');
            }
            if (row.sourceMap.url !== null) {
                this.url(row.sourceMap.url);
            }
        }
        if (row.sourceMapOmitted && !metadata.coverage.partial) {
            throw new RangeError('Omitted source map claims complete coverage');
        }
    }
    /** Resource presence retains its own capture-local identity and exact selected origin. */
    public static resource(
        row: BrowserSourceResourceRow,
        metadata: BrowserSourcesProjection,
    ): void {
        this.keys(row, [
            'kind',
            'id',
            'frameId',
            'url',
            'type',
            'mimeType',
            'contentSize',
            'failed',
            'canceled',
        ]);
        this.url(row.url, metadata.origin);
        if (
            !this.recordId(row.id, 100000n) ||
            !this.identity(row.frameId) ||
            row.type.length > 64 ||
            row.mimeType.length > 256 ||
            (row.contentSize !== null && !this.count(row.contentSize, 9007199254740991n))
        ) {
            throw new RangeError('Invalid browser resource metadata');
        }
    }
    /** Native origins and declaration URLs retain canonical credential redaction before UI use. */
    public static url(value: string, origin?: string): void {
        BrowserReceipt.url(value, origin ?? new URL(value).origin);
        if (origin !== undefined && new URL(value).origin !== origin) {
            throw new RangeError('Browser source row left its captured origin');
        }
    }
    /** Canonical bounded decimal counters prevent numeric rounding and unbounded cursor allocation. */
    public static count(value: string, maximum: bigint): boolean {
        return /^(?:0|[1-9][0-9]{0,19})$/u.test(value) && BigInt(value) <= maximum;
    }
    /** Native content digests are canonical lowercase SHA-256. */
    public static hash(value: string): boolean {
        return /^[a-f0-9]{64}$/u.test(value);
    }
    /** Source selectors refer only to capture-local rows, never a path or socket. */
    public static recordId(value: string, maximum: bigint): boolean {
        return /^[a-f0-9]{64}:[1-9][0-9]{0,5}$/u.test(value) && BigInt(value.slice(65)) <= maximum;
    }
    /** Browser frame and target IDs are bounded opaque text without control characters. */
    public static identity(value: string): boolean {
        return (
            value.length > 0 &&
            value.length <= 128 &&
            !Array.from(value).some(
                (character: string): boolean =>
                    character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
            )
        );
    }
    /** Evidence/run selectors use the same canonical UUID vocabulary as the authenticated archive. */
    public static uuid(value: string): boolean {
        return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u.test(value);
    }
    /** Exact keys prevent accidental source bodies, raw protocol fields or credentials in directories. */
    public static keys(value: SourceFields, keys: readonly string[]): void {
        if (
            Object.keys(value).length !== keys.length ||
            keys.some((key: string): boolean => !Object.hasOwn(value, key))
        ) {
            throw new RangeError('Unexpected browser source fields');
        }
    }
}
