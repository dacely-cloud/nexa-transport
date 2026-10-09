// SPDX-License-Identifier: Apache-2.0
import { WorkflowInput } from '../WorkflowInput.js';
import { WorkflowUsageEvidenceCodec as Evidence } from './UsageEvidenceCodec.js';
import { WorkflowSpendingCodec as Spending } from './RunSpendingCodec.js';
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
            ...Evidence.fields,
            'offset',
            'models',
            'modelCount',
            'next',
        ]);
        const result: WorkflowRunUsage = {
            ...this.request({ runId: value['runId'], offset: value['offset'] }),
            ...Evidence.read(value),
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
    static #validate(report: WorkflowRunUsage): void {
        Evidence.page(
            report.offset,
            report.modelCount,
            report.next,
            report.models.length,
            report.entries,
        );
        WorkflowInput.unique(report.models.map((model: WorkflowModelUsage): string => model.id));
        for (const model of report.models) {
            Evidence.window(report, model.lastReportedAtMs, model.expiresAtMs);
        }
        Evidence.partition(
            report.pricing,
            report.models,
            report.offset === '0' && report.next === null,
        );
    }
}
