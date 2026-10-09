import { describe, expect, it } from 'vitest';
import type {
    ReverseCatalogPage,
    ReverseEvidencePage,
    ReverseEvidenceRecord,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

/** Exact captured metadata independent of a model's truncated report. */
const record: ReverseEvidenceRecord = {
    id: 'evidence',
    expert: 'reverse-ida',
    operation: 'decompile',
    selector: 'main',
    path: '/workspace/.nexa/reverse/run/evidence.txt',
    excerpt: 'return 7;',
    characters: '9',
    createdAtMs: '1',
};
const catalog: ReverseCatalogPage = {
    runId: 'run',
    sha256: 'a'.repeat(64),
    cursor: '0',
    nextCursor: null,
    total: '1',
    evidence: [record],
};
const evidence: ReverseEvidencePage = {
    runId: 'run',
    sha256: 'a'.repeat(64),
    record,
    evidenceSha256: 'b'.repeat(64),
    cursor: '0',
    nextCursor: null,
    characters: '9',
    text: 'return 7;',
};

describe('immutable investigation archive receipts', (): void => {
    it('preserves exact originals and rejects forged pagination and oversized catalogs', (): void => {
        expect(ReverseInvestigation.catalog(catalog)).toBe(catalog);
        expect(ReverseInvestigation.evidence(evidence)).toBe(evidence);
        for (const invalid of [
            { ...catalog, cursor: '01' },
            { ...catalog, total: '10001' },
            { ...catalog, nextCursor: '0' },
            { ...catalog, total: '2' },
            { ...catalog, evidence: Array(21).fill(record), total: '21' },
            { ...catalog, evidence: [record, record], total: '2' },
            { ...catalog, evidence: [{ ...record, excerpt: 'x'.repeat(241) }] },
        ]) {
            expect((): ReverseCatalogPage => ReverseInvestigation.catalog(invalid)).toThrow();
        }
        for (const invalid of [
            { ...evidence, cursor: '-1' },
            { ...evidence, cursor: '9007199254740993' },
            { ...evidence, characters: '8' },
            { ...evidence, nextCursor: '9' },
            { ...evidence, text: '' },
            { ...evidence, evidenceSha256: 'invalid' },
            { ...evidence, text: 'x'.repeat(12001) },
            { ...evidence, characters: '8388609', record: { ...record, characters: '8388609' } },
        ]) {
            expect((): ReverseEvidencePage => ReverseInvestigation.evidence(invalid)).toThrow();
        }
    });
    it('requires original provenance for derived code pages and keeps their offsets independent', (): void => {
        const code: ReverseEvidencePage = {
            ...evidence,
            representation: 'code',
            originalEvidenceSha256: 'c'.repeat(64),
            characters: '3',
            text: 'ret',
        };
        expect(ReverseInvestigation.evidence(code)).toBe(code);
        for (const invalid of [
            { ...code, originalEvidenceSha256: undefined },
            { ...code, originalEvidenceSha256: 'invalid' },
            { ...code, representation: 'original' },
            { ...code, representation: 'other' },
            { ...code, nextCursor: '3' },
        ]) {
            expect((): ReverseEvidencePage => ReverseInvestigation.evidence(invalid)).toThrow();
        }
    });
    it('accepts a bounded intermediate text page and an empty final page', (): void => {
        expect(
            ReverseInvestigation.evidence({ ...evidence, text: 'ret', nextCursor: '3' }).nextCursor,
        ).toBe('3');
        expect(ReverseInvestigation.evidence({ ...evidence, cursor: '9', text: '' }).text).toBe('');
        expect(
            ReverseInvestigation.catalog({ ...catalog, cursor: '1', evidence: [] }).nextCursor,
        ).toBeNull();
    });
});
