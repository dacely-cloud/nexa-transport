import type {
    ReverseCatalogPage,
    ReverseEvidencePage,
    ReverseEvidenceRecord,
} from '../protocol/Protocol.js';
import { reverseCatalog, reverseEvidence } from '../protocol/Validators.js';

/** Portable validation of immutable archive pages before a consumer displays captured text. */
export class ArchiveReceipt {
    /** Bounds provenance independently of an investigation's truncated evidence preview. */
    public static validRecord(record: ReverseEvidenceRecord): boolean {
        return (
            record.id.length > 0 &&
            record.id.length <= 128 &&
            record.expert.length > 0 &&
            record.expert.length <= 128 &&
            record.operation.length > 0 &&
            record.operation.length <= 128 &&
            record.path.length <= 8192 &&
            record.excerpt.length <= 240 &&
            (record.selector === null || record.selector.length <= 1024) &&
            (record.stepId === undefined ||
                (record.stepId.length > 0 && record.stepId.length <= 128)) &&
            /^[0-9]{1,40}$/u.test(record.characters) &&
            /^[0-9]{1,40}$/u.test(record.createdAtMs)
        );
    }
    /** Verifies ordered offsets, bounded pages and canonical decimal cursors. */
    public static catalog(input: unknown): ReverseCatalogPage {
        if (!reverseCatalog(input)) {
            throw new TypeError('Invalid investigation catalog page');
        }
        if (
            !this.#identity(input.runId, input.sha256) ||
            !this.#decimal(input.cursor) ||
            !this.#decimal(input.total) ||
            (input.nextCursor !== null && !this.#decimal(input.nextCursor)) ||
            input.evidence.length > 20 ||
            new Set(input.evidence.map((record): string => record.id)).size !==
                input.evidence.length ||
            input.evidence.some((record): boolean => !this.validRecord(record))
        ) {
            throw new RangeError('Investigation catalog exceeds presentation limits');
        }
        const cursor: bigint = BigInt(input.cursor);
        const total: bigint = BigInt(input.total);
        const end: bigint = cursor + BigInt(input.evidence.length);
        if (
            total > 10_000n ||
            cursor > total ||
            end > total ||
            input.evidence.length !== Number(total - cursor > 20n ? 20n : total - cursor) ||
            input.nextCursor !== (end < total ? end.toString() : null)
        ) {
            throw new RangeError('Inconsistent investigation catalog pagination');
        }
        return input;
    }
    /** Verifies exact text offsets and immutable content identity, without trusting a JSON shape alone. */
    public static evidence(input: unknown): ReverseEvidencePage {
        if (!reverseEvidence(input)) {
            throw new TypeError('Invalid investigation evidence page');
        }
        if (
            !this.#identity(input.runId, input.sha256) ||
            !/^[a-f0-9]{64}$/u.test(input.evidenceSha256) ||
            !this.validRecord(input.record) ||
            BigInt(input.record.characters) > 8_388_608n ||
            !this.#decimal(input.cursor) ||
            !this.#decimal(input.characters) ||
            (input.nextCursor !== null && !this.#decimal(input.nextCursor)) ||
            (input.representation !== 'code' && input.record.characters !== input.characters) ||
            (input.representation === 'code' &&
                (input.originalEvidenceSha256 === undefined ||
                    !/^[a-f0-9]{64}$/u.test(input.originalEvidenceSha256))) ||
            (input.representation !== 'code' && input.originalEvidenceSha256 !== undefined) ||
            input.text.length > 12_000
        ) {
            throw new RangeError('Investigation evidence exceeds presentation limits');
        }
        const cursor: bigint = BigInt(input.cursor);
        const characters: bigint = BigInt(input.characters);
        const end: bigint = cursor + BigInt(input.text.length);
        if (
            characters > 8_388_608n ||
            cursor > characters ||
            end > characters ||
            (input.text.length === 0 && cursor < characters) ||
            input.nextCursor !== (end < characters ? end.toString() : null)
        ) {
            throw new RangeError('Inconsistent investigation evidence pagination');
        }
        return input;
    }
    static #decimal(value: string): boolean {
        return /^(?:0|[1-9][0-9]{0,19})$/u.test(value);
    }
    static #identity(id: string, sha256: string): boolean {
        return id.length > 0 && id.length <= 128 && /^[a-f0-9]{64}$/u.test(sha256);
    }
}
