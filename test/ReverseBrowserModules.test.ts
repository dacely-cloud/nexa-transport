// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type {
    BrowserModulePage,
    BrowserModuleImportRow,
    BrowserModuleCandidateRow,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

const imported: BrowserModuleImportRow = {
    kind: 'import',
    id: 'import:0',
    syntax: 'ImportDeclaration',
    status: 'native-resolution',
    specifier: 'pkg',
    specifierCharacters: '3',
    url: 'https://example.test/pkg.js#entry',
    urlCharacters: '33',
    errorName: null,
    errorMessage: null,
    errorCharacters: null,
    expression: null,
    expressionCharacters: null,
    expressionTruncated: false,
    location: { line: 1, column: 0, endLine: 1, endColumn: 10, start: 0, end: 10 },
    candidateCount: 1,
    execution: 'unknown',
};
const page: BrowserModulePage = {
    runId: '89107b32-0000-4000-8000-000000000001',
    evidenceId: '89107b32-0000-4000-8000-000000000002',
    sha256: 'a'.repeat(64),
    reportSha256: 'b'.repeat(64),
    view: 'imports',
    selector: null,
    field: null,
    cursor: '0',
    nextCursor: null,
    total: '1',
    records: [{ ...imported, urlCharacters: String(imported.url?.length ?? 0) }],
    text: null,
    textSha256: null,
    metadata: {
        module: 'main.js',
        moduleCharacters: '7',
        sourceSha256: 'c'.repeat(64),
        sourceBytes: '100',
        engine: 'chromium-import-meta-resolve',
        engineVersion: 'Chrome/153',
        context: 'explicit-importer-url',
        importerUrl: 'https://example.test/main.js',
        importerCharacters: '28',
        importMapSha256: null,
        importMapBytes: null,
        importMapBaseUrl: null,
        importMapBaseCharacters: null,
        parseError: null,
        parseErrorCharacters: null,
        importCount: '1',
        excludedTypeOnly: '0',
        excludedNonEs: '0',
        sourceCapture: {
            runId: '89107b32-0000-4000-8000-000000000003',
            sha256: 'd'.repeat(64),
            evidenceId: '89107b32-0000-4000-8000-000000000004',
            captureSha256: 'e'.repeat(64),
        },
    },
};
const candidate: BrowserModuleCandidateRow = {
    kind: 'candidate',
    id: 'f'.repeat(64) + ':1',
    frameId: 'frame',
    url: 'https://example.test/pkg.js',
    urlCharacters: '27',
    sourceSha256: '9'.repeat(64),
    sourceBytes: '40',
    state: 'captured',
    isModule: true,
    hasSourceUrl: false,
    startLine: 0,
    startColumn: 0,
    match: 'response-url-without-fragment',
};
function valid(): BrowserModulePage {
    return {
        ...page,
        metadata: {
            ...page.metadata,
            importerCharacters: String(page.metadata.importerUrl.length),
        },
    };
}
describe('saved native module receipts', (): void => {
    it('keeps imports, original captured versions and selected Unicode text separate', (): void => {
        const imports: BrowserModulePage = valid();
        expect(ReverseInvestigation.modules(imports)).toEqual(imports);
        const candidates: BrowserModulePage = {
            ...imports,
            view: 'candidates',
            selector: imported.id,
            records: [{ ...candidate, urlCharacters: String(candidate.url.length) }],
        };
        expect(ReverseInvestigation.modules(candidates)).toEqual(candidates);
        const text: BrowserModulePage = {
            ...imports,
            view: 'text',
            selector: imported.id,
            field: 'expression',
            records: [],
            total: '6',
            nextCursor: '2',
            text: '💻',
            textSha256: '8'.repeat(64),
        };
        expect(ReverseInvestigation.modules(text)).toEqual(text);
        expect(
            ReverseInvestigation.modules({ ...text, cursor: '2', nextCursor: null, text: 'tail' }),
        ).toMatchObject({ text: 'tail' });
    });
    it('rejects hidden bodies, forged provenance, execution claims and inconsistent cursor/state receipts', (): void => {
        const imports: BrowserModulePage = valid();
        const row: BrowserModuleImportRow =
            imports.records[0]?.kind === 'import' ? imports.records[0] : imported;
        const invalid: readonly unknown[] = [
            { ...imports, records: [{ ...row, source: 'BODY_SECRET' }] },
            { ...imports, metadata: { ...imports.metadata, records: ['BODY_SECRET'] } },
            {
                ...imports,
                metadata: {
                    ...imports.metadata,
                    sourceCapture: { ...imports.metadata.sourceCapture, runId: imports.runId },
                },
            },
            { ...imports, metadata: { ...imports.metadata, importMapBytes: '20' } },
            { ...imports, records: [{ ...row, execution: 'executed' }] },
            {
                ...imports,
                records: [
                    {
                        ...row,
                        url: null,
                        urlCharacters: null,
                        errorName: 'TypeError',
                        errorMessage: '',
                        errorCharacters: '0',
                    },
                ],
            },
            { ...imports, records: [{ ...row, location: { ...row.location, end: 101 } }] },
            { ...imports, cursor: '01' },
            { ...imports, nextCursor: '1' },
            { ...imports, total: '2' },
            { ...imports, records: [] },
            { ...imports, text: 'BODY_SECRET' },
            { ...imports, selector: imported.id },
            {
                ...imports,
                view: 'candidates',
                selector: imported.id,
                records: [{ ...candidate, text: 'BODY_SECRET' }],
            },
        ];
        for (const raw of invalid) {
            expect((): BrowserModulePage => ReverseInvestigation.modules(raw)).toThrow();
        }
    });
    it('rejects split Unicode, oversized fields and global text that contradicts its original metadata', (): void => {
        const imports: BrowserModulePage = valid();
        const text: BrowserModulePage = {
            ...imports,
            view: 'text',
            field: 'module',
            records: [],
            total: '7',
            text: 'main.js',
            textSha256: '8'.repeat(64),
        };
        expect(ReverseInvestigation.modules(text)).toEqual(text);
        const invalid: readonly unknown[] = [
            { ...text, total: '8', text: 'main.jsx' },
            { ...text, selector: imported.id },
            {
                ...text,
                field: 'expression',
                selector: imported.id,
                total: '1025',
                text: 'x',
                nextCursor: '1',
            },
            {
                ...text,
                field: 'expression',
                selector: imported.id,
                total: '2',
                text: '\ud83d',
                nextCursor: '1',
            },
            { ...text, field: 'map-base-url', text: null, total: '1', textSha256: null },
            { ...text, text: '', nextCursor: '0' },
        ];
        for (const raw of invalid) {
            expect((): BrowserModulePage => ReverseInvestigation.modules(raw)).toThrow();
        }
    });
});
