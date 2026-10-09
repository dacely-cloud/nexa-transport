// SPDX-License-Identifier: Apache-2.0
import { WorkflowInput } from '../WorkflowInput.js';
import { WorkflowSpendingCodec as Spending } from './RunSpendingCodec.js';
import { WorkflowRunUsageCodec } from './RunUsageCodec.js';
import { WorkflowUsageEvidenceCodec as Evidence } from './UsageEvidenceCodec.js';
import {
    WorkflowUsageDimension,
    type WorkflowRunBreakdownRequest,
    type WorkflowRunBreakdown,
    type WorkflowRunBreakdownView,
    type WorkflowUsageGroup,
    type WorkflowStepUsageIdentity,
    type WorkflowAgentUsageIdentity,
    type WorkflowStepUsageOrigin,
    type WorkflowUsageGroupLabel,
} from './RunBreakdownTypes.js';
import type { WorkflowSpendingBucket } from './RunSpendingTypes.js';

/** Validate coverage and attribution before anything is presented as a step or agent's spending. */
export class WorkflowRunBreakdownCodec {
    public static request(raw: unknown): WorkflowRunBreakdownRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'offset',
            'dimension',
        ]);
        const dimension: unknown = value['dimension'];
        if (
            dimension !== WorkflowUsageDimension.Steps &&
            dimension !== WorkflowUsageDimension.Agents
        ) {
            throw new Error('Invalid usage breakdown dimension');
        }
        return {
            ...WorkflowRunUsageCodec.request({ runId: value['runId'], offset: value['offset'] }),
            dimension,
        };
    }
    public static report(raw: unknown): WorkflowRunBreakdown {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            ...Evidence.fields,
            'offset',
            'dimension',
            'runEntries',
            'groups',
            'groupCount',
            'next',
        ]);
        const request: WorkflowRunBreakdownRequest = this.request({
            runId: value['runId'],
            offset: value['offset'],
            dimension: value['dimension'],
        });
        const result: WorkflowRunBreakdown = {
            ...request,
            ...Evidence.read(value),
            runEntries: Spending.amount(value['runEntries']),
            groups: WorkflowInput.list(value['groups'], 10, (item: unknown): WorkflowUsageGroup =>
                this.#group(item, request.dimension),
            ),
            groupCount: Spending.amount(value['groupCount']),
            next: value['next'] === null ? null : Spending.amount(value['next']),
        };
        if (BigInt(result.entries) > BigInt(result.runEntries)) {
            throw new Error('Breakdown coverage exceeds retained run reports');
        }
        Evidence.page(
            result.offset,
            result.groupCount,
            result.next,
            result.groups.length,
            result.entries,
        );
        WorkflowInput.unique(result.groups.map((group: WorkflowUsageGroup): string => group.id));
        for (const group of result.groups) {
            Evidence.window(result, group.lastReportedAtMs, group.expiresAtMs);
        }
        Evidence.partition(
            result.pricing,
            result.groups.flatMap(
                (group: WorkflowUsageGroup): readonly WorkflowSpendingBucket[] => group.pricing,
            ),
            result.offset === '0' && result.next === null,
        );
        return Object.freeze(result);
    }
    public static view(raw: unknown): WorkflowRunBreakdownView {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const { simulated, labels, ...rest }: Readonly<Record<string, unknown>> = value;
        if (typeof simulated !== 'boolean') {
            throw new Error('Invalid usage simulation state');
        }
        const report: WorkflowRunBreakdown = this.report(rest);
        if (simulated && report.runEntries !== '0') {
            throw new Error('Mock execution cannot report live usage');
        }
        const decoded: readonly WorkflowUsageGroupLabel[] = WorkflowInput.list(
            labels,
            10,
            (raw: unknown): WorkflowUsageGroupLabel => {
                const item: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
                    'id',
                    'label',
                    'component',
                ]);
                return {
                    id: WorkflowInput.id(item['id']),
                    label: WorkflowInput.text(item['label'], 256),
                    component: WorkflowInput.text(item['component'], 256),
                };
            },
        );
        WorkflowInput.unique(decoded.map((label: WorkflowUsageGroupLabel): string => label.id));
        if (
            decoded.length !== report.groups.length ||
            decoded.some(
                (label: WorkflowUsageGroupLabel): boolean =>
                    !report.groups.some(
                        (group: WorkflowUsageGroup): boolean => group.id === label.id,
                    ),
            )
        ) {
            throw new Error('Usage labels do not match the reported groups');
        }
        return Object.freeze({ ...report, simulated, labels: decoded });
    }
    static #group(raw: unknown, dimension: WorkflowUsageDimension): WorkflowUsageGroup {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'identity',
            'microcents',
            'entries',
            'pricing',
            'lastReportedAtMs',
            'expiresAtMs',
        ]);
        const id: unknown = value['id'];
        if (typeof id !== 'string' || !/^[a-f0-9]{64}$/u.test(id)) {
            throw new Error('Invalid usage group identity');
        }
        const result: WorkflowUsageGroup = {
            id,
            identity: this.#identity(value['identity'], dimension),
            microcents: Spending.amount(value['microcents'], true),
            entries: Spending.amount(value['entries']),
            pricing: Spending.pricing(value['pricing']),
            lastReportedAtMs: Spending.timestamp(value['lastReportedAtMs']),
            expiresAtMs: Spending.timestamp(value['expiresAtMs']),
        };
        if (result.entries === '0') {
            throw new Error('Empty usage group');
        }
        Evidence.subtotals(result.pricing, result.entries, result.microcents);
        return Object.freeze(result);
    }
    static #identity(
        raw: unknown,
        dimension: WorkflowUsageDimension,
    ): WorkflowStepUsageIdentity | WorkflowAgentUsageIdentity {
        if (dimension === WorkflowUsageDimension.Agents) {
            const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
                'nodeId',
                'agentId',
            ]);
            return {
                nodeId: WorkflowInput.id(value['nodeId']),
                agentId: WorkflowInput.text(value['agentId'], 4096),
            };
        }
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'nodeId',
            'invocationId',
            'attempt',
            'origin',
        ]);
        const attempt: string = Spending.amount(value['attempt']);
        if (attempt === '0') {
            throw new Error('Invalid usage attempt');
        }
        let origin: WorkflowStepUsageOrigin | null = null;
        if (value['origin'] !== null) {
            const record: Readonly<Record<string, unknown>> = WorkflowInput.record(
                value['origin'],
                ['nodeId', 'loopId', 'itemIndex'],
            );
            const itemIndex: string = Spending.amount(record['itemIndex']);
            if (BigInt(itemIndex) > 999n) {
                throw new Error('Invalid usage loop position');
            }
            origin = {
                nodeId: WorkflowInput.id(record['nodeId']),
                loopId: WorkflowInput.id(record['loopId']),
                itemIndex,
            };
        }
        return {
            nodeId: WorkflowInput.id(value['nodeId']),
            invocationId: WorkflowInput.id(value['invocationId']),
            attempt,
            origin,
        };
    }
}
