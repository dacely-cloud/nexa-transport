// SPDX-License-Identifier: Apache-2.0
import { WorkflowInput } from '../WorkflowInput.js';
import { ResourceBindingCodec } from '../ResourceBindingCodec.js';
import { WorkflowSpendingCodec as Spending } from './RunSpendingCodec.js';
import type { WorkflowSpendingBucket } from './RunSpendingTypes.js';
import type { WorkflowUsageEvidence } from './RunUsageTypes.js';

/** Exact coverage, retention and partition rules shared by all retained usage pages. */
export class WorkflowUsageEvidenceCodec {
    public static readonly fields: readonly string[] = [
        'runId',
        'workflowId',
        'revision',
        'observedAtMs',
        'reportedMicrocents',
        'entries',
        'lastReportedAtMs',
        'retainedFromMs',
        'expiresAtMs',
        'pricing',
    ];
    /** The caller validates its complete wire shape before reading common evidence fields. */
    public static read(raw: unknown): WorkflowUsageEvidence {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const result: WorkflowUsageEvidence = {
            runId: WorkflowInput.id(value['runId']),
            workflowId: WorkflowInput.id(value['workflowId']),
            revision: ResourceBindingCodec.decimal(value['revision']),
            observedAtMs: Spending.timestamp(value['observedAtMs']),
            reportedMicrocents:
                value['reportedMicrocents'] === null
                    ? null
                    : Spending.amount(value['reportedMicrocents'], true),
            entries: Spending.amount(value['entries']),
            pricing: Spending.pricing(value['pricing']),
            lastReportedAtMs: this.#time(value['lastReportedAtMs']),
            retainedFromMs: this.#time(value['retainedFromMs']),
            expiresAtMs: this.#time(value['expiresAtMs']),
        };
        const empty: boolean = result.entries === '0';
        if (
            result.revision === '0' ||
            empty !== (result.reportedMicrocents === null) ||
            empty !== (result.lastReportedAtMs === null) ||
            empty !== (result.retainedFromMs === null) ||
            empty !== (result.expiresAtMs === null)
        ) {
            throw new Error('Inconsistent usage totals');
        }
        if (
            !empty &&
            (BigInt(result.retainedFromMs ?? '0') > BigInt(result.lastReportedAtMs ?? '0') ||
                BigInt(result.lastReportedAtMs ?? '0') > BigInt(result.observedAtMs) ||
                BigInt(result.expiresAtMs ?? '0') <= BigInt(result.observedAtMs))
        ) {
            throw new Error('Inconsistent usage retention window');
        }
        this.subtotals(result.pricing, result.entries, result.reportedMicrocents ?? '0');
        return Object.freeze(result);
    }
    public static subtotals(
        pricing: readonly WorkflowSpendingBucket[],
        entries: string,
        microcents: string,
    ): void {
        if (
            pricing.reduce(
                (sum: bigint, bucket: WorkflowSpendingBucket): bigint =>
                    sum + BigInt(bucket.entries),
                0n,
            ) !== BigInt(entries) ||
            pricing.reduce(
                (sum: bigint, bucket: WorkflowSpendingBucket): bigint =>
                    sum + BigInt(bucket.microcents),
                0n,
            ) !== BigInt(microcents)
        ) {
            throw new Error('Usage pricing subtotals do not match');
        }
    }
    public static page(
        offset: string,
        count: string,
        next: string | null,
        length: number,
        entries: string,
    ): void {
        const start: bigint = BigInt(offset);
        const size: bigint = BigInt(count);
        const end: bigint = start + BigInt(length);
        if (
            start % 10n !== 0n ||
            (entries === '0') !== (size === 0n) ||
            size > BigInt(entries) ||
            start > size ||
            end !== (start + 10n < size ? start + 10n : size) ||
            next !== (end < size ? end.toString() : null)
        ) {
            throw new Error('Inconsistent usage pagination');
        }
    }
    public static window(report: WorkflowUsageEvidence, last: string, expires: string): void {
        if (
            expires !== report.expiresAtMs ||
            BigInt(last) < BigInt(report.retainedFromMs ?? '0') ||
            BigInt(last) > BigInt(report.lastReportedAtMs ?? '0')
        ) {
            throw new Error('Usage row is outside the retained report');
        }
    }
    /** A partial page can bound positive amounts; complete pages must exactly partition every category. */
    public static partition(
        total: readonly WorkflowSpendingBucket[],
        rows: readonly WorkflowSpendingBucket[],
        complete: boolean,
    ): void {
        for (const row of rows) {
            if (
                !total.some((bucket: WorkflowSpendingBucket): boolean => bucket.basis === row.basis)
            ) {
                throw new Error('Usage row has an unreported pricing category');
            }
        }
        for (const bucket of total) {
            const selected: readonly WorkflowSpendingBucket[] = rows.filter(
                (row: WorkflowSpendingBucket): boolean => row.basis === bucket.basis,
            );
            const entries: bigint = selected.reduce(
                (sum: bigint, row: WorkflowSpendingBucket): bigint => sum + BigInt(row.entries),
                0n,
            );
            const amount: bigint = selected.reduce(
                (sum: bigint, row: WorkflowSpendingBucket): bigint => sum + BigInt(row.microcents),
                0n,
            );
            if (
                entries > BigInt(bucket.entries) ||
                (bucket.basis !== 'adjustment' &&
                    bucket.basis !== 'legacy' &&
                    amount > BigInt(bucket.microcents)) ||
                (complete &&
                    (entries !== BigInt(bucket.entries) || amount !== BigInt(bucket.microcents)))
            ) {
                throw new Error('Usage rows do not partition their pricing category');
            }
        }
    }
    static #time(raw: unknown): string | null {
        return raw === null ? null : Spending.timestamp(raw);
    }
}
