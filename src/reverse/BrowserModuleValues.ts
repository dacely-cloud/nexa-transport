// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserModulePage,
    BrowserModuleMetadata,
    BrowserModuleSourceCapture,
    BrowserModuleDirectoryRow,
    BrowserModulePosition,
    BrowserModuleImportRow,
    BrowserModuleCandidateRow,
} from '../protocol/Protocol.js';
import { BrowserSourcesValues as Source } from './BrowserSourcesValues.js';

type ModuleFields =
    | BrowserModulePage
    | BrowserModuleMetadata
    | BrowserModuleSourceCapture
    | BrowserModuleDirectoryRow
    | BrowserModulePosition;
/** Portable field validation rejects hidden code, forged provenance and oversized previews. */
export class BrowserModuleValues {
    /** Unknown properties cannot smuggle full source or resolver bodies into directory pages. */
    public static keys(value: ModuleFields, fields: readonly string[]): void {
        if (Object.keys(value).some((key: string): boolean => !fields.includes(key))) {
            throw new RangeError('Undeclared browser module page field');
        }
    }
    /** Previews carry exact character lengths and end on complete Unicode pairs. */
    public static preview(value: string | null, characters: string | null, maximum: bigint): void {
        if (value === null || characters === null) {
            if (value !== null || characters !== null) {
                throw new RangeError('Inconsistent module preview availability');
            }
            return;
        }
        if (
            !value.isWellFormed() ||
            !Source.count(characters, maximum) ||
            value.length > 256 ||
            BigInt(value.length) > BigInt(characters) ||
            (BigInt(characters) <= 256n && value.length !== Number(characters)) ||
            (BigInt(characters) > 256n && value.length < 255)
        ) {
            throw new RangeError('Invalid module field preview');
        }
    }
    /** Metadata separates original capture, selected source, native context and saved report identities. */
    public static metadata(value: BrowserModuleMetadata, runId: string): void {
        this.keys(value, [
            'module',
            'moduleCharacters',
            'sourceSha256',
            'sourceBytes',
            'engine',
            'engineVersion',
            'context',
            'importerUrl',
            'importerCharacters',
            'importMapSha256',
            'importMapBytes',
            'importMapBaseUrl',
            'importMapBaseCharacters',
            'parseError',
            'parseErrorCharacters',
            'importCount',
            'excludedTypeOnly',
            'excludedNonEs',
            'sourceCapture',
        ]);
        this.preview(value.module, value.moduleCharacters, 1024n);
        this.preview(value.importerUrl, value.importerCharacters, 8192n);
        this.preview(value.importMapBaseUrl, value.importMapBaseCharacters, 8192n);
        this.preview(value.parseError, value.parseErrorCharacters, 1000n);
        if (
            !Source.hash(value.sourceSha256) ||
            !Source.count(value.sourceBytes, 16777216n) ||
            !Source.count(value.importCount, 100000n) ||
            !Source.count(value.excludedTypeOnly, 100000n) ||
            !Source.count(value.excludedNonEs, 100000n) ||
            (value.engineVersion !== null &&
                (value.engineVersion.length > 1024 || !value.engineVersion.isWellFormed())) ||
            (value.importMapSha256 === null
                ? value.importMapBytes !== null || value.importMapBaseUrl !== null
                : !Source.hash(value.importMapSha256) ||
                  value.importMapBytes === null ||
                  !Source.count(value.importMapBytes, 4194304n) ||
                  value.importMapBaseUrl === null)
        ) {
            throw new RangeError('Invalid module context receipt');
        }
        if (value.sourceCapture !== null) {
            this.keys(value.sourceCapture, ['runId', 'sha256', 'evidenceId', 'captureSha256']);
            if (
                !Source.uuid(value.sourceCapture.runId) ||
                value.sourceCapture.runId === runId ||
                !Source.uuid(value.sourceCapture.evidenceId) ||
                !Source.hash(value.sourceCapture.sha256) ||
                !Source.hash(value.sourceCapture.captureSha256)
            ) {
                throw new RangeError('Invalid original module source capture');
            }
        }
    }
    /** Literal resolutions, native rejections and computed syntax remain distinct states. */
    public static imported(row: BrowserModuleImportRow, metadata: BrowserModuleMetadata): void {
        this.keys(row, [
            'kind',
            'id',
            'syntax',
            'status',
            'specifier',
            'specifierCharacters',
            'url',
            'urlCharacters',
            'errorName',
            'errorMessage',
            'errorCharacters',
            'expression',
            'expressionCharacters',
            'expressionTruncated',
            'location',
            'candidateCount',
            'execution',
        ]);
        this.keys(row.location, ['line', 'column', 'endLine', 'endColumn', 'start', 'end']);
        this.preview(row.specifier, row.specifierCharacters, 1024n);
        this.preview(row.url, row.urlCharacters, 8192n);
        this.preview(row.errorMessage, row.errorCharacters, 8192n);
        this.preview(row.expression, row.expressionCharacters, 1024n);
        if (
            row.id.length === 0 ||
            row.id.length > 128 ||
            !row.id.isWellFormed() ||
            row.syntax.length > 128 ||
            !row.syntax.isWellFormed() ||
            !Number.isSafeInteger(row.candidateCount) ||
            row.candidateCount < 0 ||
            row.candidateCount > 50000 ||
            Object.values(row.location).some(
                (value: number): boolean =>
                    !Number.isSafeInteger(value) || value < 0 || value > 16777216,
            ) ||
            row.location.line < 1 ||
            row.location.endLine < row.location.line ||
            row.location.end < row.location.start ||
            BigInt(row.location.end) > BigInt(metadata.sourceBytes)
        ) {
            throw new RangeError('Invalid module relationship provenance');
        }
        if (
            row.status === 'native-resolution'
                ? row.specifier === null ||
                  row.expression !== null ||
                  metadata.engineVersion === null ||
                  (row.url === null
                      ? row.errorName === null || row.errorMessage === null
                      : row.errorName !== null || row.errorMessage !== null)
                : row.specifier !== null ||
                  row.url !== null ||
                  row.errorName !== null ||
                  row.errorMessage !== null ||
                  row.expression === null
        ) {
            throw new RangeError('Inconsistent module relationship state');
        }
        if (
            (row.url === null && row.candidateCount !== 0) ||
            (row.errorName !== null &&
                (row.errorName.length > 128 || !row.errorName.isWellFormed()))
        ) {
            throw new RangeError('Invalid native module result');
        }
    }
    /** Original script descriptors carry no captured text and retain all frames and versions. */
    public static candidate(row: BrowserModuleCandidateRow): void {
        this.keys(row, [
            'kind',
            'id',
            'frameId',
            'url',
            'urlCharacters',
            'sourceSha256',
            'sourceBytes',
            'state',
            'isModule',
            'hasSourceUrl',
            'startLine',
            'startColumn',
            'match',
        ]);
        this.preview(row.url, row.urlCharacters, 8192n);
        if (
            !Source.recordId(row.id, 50000n) ||
            !Source.identity(row.frameId) ||
            ![row.startLine, row.startColumn].every(
                (value: number): boolean =>
                    Number.isSafeInteger(value) && value >= 0 && value <= 2147483647,
            ) ||
            (row.state === 'captured'
                ? row.sourceSha256 === null ||
                  !Source.hash(row.sourceSha256) ||
                  row.sourceBytes === null ||
                  !Source.count(row.sourceBytes, 2097152n)
                : row.sourceSha256 !== null || row.sourceBytes !== null)
        ) {
            throw new RangeError('Invalid captured module candidate');
        }
    }
}
