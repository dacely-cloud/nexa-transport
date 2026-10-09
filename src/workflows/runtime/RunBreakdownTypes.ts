// SPDX-License-Identifier: Apache-2.0
import type { WorkflowUsageEvidence, WorkflowRunUsageRequest } from './RunUsageTypes.js';
import type { WorkflowSpendingBucket } from './RunSpendingTypes.js';

/** Alternative partitions of the same reported usage. */
export const WorkflowUsageDimension = { Steps: 'steps', Agents: 'agents' } as const;
export type WorkflowUsageDimension =
    (typeof WorkflowUsageDimension)[keyof typeof WorkflowUsageDimension];
export interface WorkflowRunBreakdownRequest extends WorkflowRunUsageRequest {
    readonly dimension: WorkflowUsageDimension;
}
export interface WorkflowStepUsageOrigin {
    readonly nodeId: string;
    readonly loopId: string;
    readonly itemIndex: string;
}
export interface WorkflowStepUsageIdentity {
    readonly nodeId: string;
    readonly invocationId: string;
    readonly attempt: string;
    readonly origin: WorkflowStepUsageOrigin | null;
}
export interface WorkflowAgentUsageIdentity {
    readonly nodeId: string;
    readonly agentId: string;
}
export interface WorkflowUsageGroup {
    readonly id: string;
    readonly identity: WorkflowStepUsageIdentity | WorkflowAgentUsageIdentity;
    readonly microcents: string;
    readonly entries: string;
    readonly pricing: readonly WorkflowSpendingBucket[];
    readonly lastReportedAtMs: string;
    readonly expiresAtMs: string;
}
/** Coverage can be partial when old writers never retained invocation/agent summaries. */
export interface WorkflowRunBreakdown extends WorkflowRunBreakdownRequest, WorkflowUsageEvidence {
    readonly runEntries: string;
    readonly groups: readonly WorkflowUsageGroup[];
    readonly groupCount: string;
    readonly next: string | null;
}
/** Labels come from the owned immutable graph; they do not choose the billing partition. */
export interface WorkflowUsageGroupLabel {
    readonly id: string;
    readonly label: string;
    readonly component: string;
}
export interface WorkflowRunBreakdownView extends WorkflowRunBreakdown {
    readonly simulated: boolean;
    readonly labels: readonly WorkflowUsageGroupLabel[];
}
