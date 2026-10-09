// SPDX-License-Identifier: Apache-2.0
import { WorkflowInput } from '../WorkflowInput.js';
import { ResourceBindingCodec } from '../ResourceBindingCodec.js';
import { WorkflowSpendingCodec as Spending } from './RunSpendingCodec.js';
import type { WorkflowSpendingBucket } from './RunSpendingTypes.js';
import { WorkflowUsageModelCodec } from './RunUsageModelCodec.js';
import type {
    WorkflowRunUsageRequest,
    WorkflowRunUsage,
    WorkflowRunUsageView,
    WorkflowModelUsage,
} from './RunUsageTypes.js';

/** Exact retained usage validation shared by the authority adapter and browser SDK. */
export class WorkflowRunUsageCodec {
    public static request(raw: unknown): WorkflowRunUsageRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'offset',
        ]);
        const offset: string = Spending.amount(value['offset']);
        if (BigInt(offset) % 10n !== 0n) {
            throw new Error('Invalid usage page offset');
        }
        return { runId: WorkflowInput.id(value['runId']), offset };
    }
    public static report(raw: unknown): WorkflowRunUsage {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'offset',
            'workflowId',
            'revision',
            'observedAtMs',
            'reportedMicrocents',
            'entries',
            'lastReportedAtMs',
            'retainedFromMs',
            'expiresAtMs',
            'pricing',
            'models',
            'modelCount',
            'next',
        ]);
        const result: WorkflowRunUsage = {
            ...this.request({ runId: value['runId'], offset: value['offset'] }),
            workflowId: WorkflowInput.id(value['workflowId']),
            revision: ResourceBindingCodec.decimal(value['revision']),
            observedAtMs: Spending.timestamp(value['observedAtMs']),
            reportedMicrocents:
                value['reportedMicrocents'] === null
                    ? null
                    : Spending.amount(value['reportedMicrocents'], true),
            entries: Spending.amount(value['entries']),
            lastReportedAtMs: this.#time(value['lastReportedAtMs']),
            retainedFromMs: this.#time(value['retainedFromMs']),
            expiresAtMs: this.#time(value['expiresAtMs']),
            pricing: Spending.pricing(value['pricing']),
            models: WorkflowInput.list(value['models'], 10, (item: unknown): WorkflowModelUsage =>
                WorkflowUsageModelCodec.read(item),
            ),
            modelCount: Spending.amount(value['modelCount']),
            next: value['next'] === null ? null : Spending.amount(value['next']),
        };
        this.#validate(result);
        return Object.freeze(result);
    }
    public static view(raw: unknown): WorkflowRunUsageView {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const { simulated, ...rest }: Readonly<Record<string, unknown>> = value;
        if (typeof simulated !== 'boolean') {
            throw new Error('Invalid usage simulation state');
        }
        const report: WorkflowRunUsage = this.report(rest);
        if (simulated && report.entries !== '0') {
            throw new Error('Mock execution cannot report live usage');
        }
        return Object.freeze({ ...report, simulated });
    }
    static #time(raw: unknown): string | null {
        return raw === null ? null : Spending.timestamp(raw);
    }
    static #validate(report: WorkflowRunUsage): void {
        const entries: bigint = BigInt(report.entries);
        const count: bigint = BigInt(report.modelCount);
        const offset: bigint = BigInt(report.offset);
        const end: bigint = offset + BigInt(report.models.length);
        const empty: boolean = entries === 0n;
        if (
            report.revision === '0' ||
            empty !== (report.reportedMicrocents === null) ||
            empty !== (report.lastReportedAtMs === null) ||
            empty !== (report.retainedFromMs === null) ||
            empty !== (report.expiresAtMs === null) ||
            empty !== (count === 0n) ||
            count > entries ||
            offset > count ||
            end !== (offset + 10n < count ? offset + 10n : count) ||
            report.next !== (end < count ? end.toString() : null)
        ) {
            throw new Error('Inconsistent usage totals or pagination');
        }
        const observed: bigint = BigInt(report.observedAtMs);
        if (
            !empty &&
            (BigInt(report.retainedFromMs ?? '0') > BigInt(report.lastReportedAtMs ?? '0') ||
                BigInt(report.lastReportedAtMs ?? '0') > observed ||
                BigInt(report.expiresAtMs ?? '0') <= observed)
        ) {
            throw new Error('Inconsistent usage retention window');
        }
        if (
            report.pricing.reduce(
                (sum: bigint, bucket: WorkflowSpendingBucket): bigint =>
                    sum + BigInt(bucket.entries),
                0n,
            ) !== entries ||
            report.pricing.reduce(
                (sum: bigint, bucket: WorkflowSpendingBucket): bigint =>
                    sum + BigInt(bucket.microcents),
                0n,
            ) !== BigInt(report.reportedMicrocents ?? '0')
        ) {
            throw new Error('Usage pricing subtotals do not match');
        }
        WorkflowInput.unique(report.models.map((model: WorkflowModelUsage): string => model.id));
        for (const model of report.models) {
            if (
                model.expiresAtMs !== report.expiresAtMs ||
                BigInt(model.lastReportedAtMs) < BigInt(report.retainedFromMs ?? '0') ||
                BigInt(model.lastReportedAtMs) > BigInt(report.lastReportedAtMs ?? '0')
            ) {
                throw new Error('Model usage is outside the retained report');
            }
            if (
                !report.pricing.some(
                    (bucket: WorkflowSpendingBucket): boolean => bucket.basis === model.basis,
                )
            ) {
                throw new Error('Model usage has an unreported pricing category');
            }
        }
        for (const bucket of report.pricing) {
            const models: readonly WorkflowModelUsage[] = report.models.filter(
                (model: WorkflowModelUsage): boolean => model.basis === bucket.basis,
            );
            const rows: bigint = models.reduce(
                (sum: bigint, model: WorkflowModelUsage): bigint => sum + BigInt(model.entries),
                0n,
            );
            const amount: bigint = models.reduce(
                (sum: bigint, model: WorkflowModelUsage): bigint => sum + BigInt(model.microcents),
                0n,
            );
            // A partial page cannot reconstruct signed adjustments, but its entry coverage is bounded.
            if (
                rows > BigInt(bucket.entries) ||
                (bucket.basis !== 'adjustment' &&
                    bucket.basis !== 'legacy' &&
                    amount > BigInt(bucket.microcents)) ||
                (offset === 0n &&
                    end === count &&
                    (rows !== BigInt(bucket.entries) || amount !== BigInt(bucket.microcents)))
            ) {
                throw new Error('Model usage does not partition its pricing category');
            }
        }
    }
}
