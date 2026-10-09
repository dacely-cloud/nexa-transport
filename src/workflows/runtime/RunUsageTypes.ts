// SPDX-License-Identifier: Apache-2.0
import type { ChargeKind } from '../../credit/ChargeKind.js';
import type { PricingTariff } from '../../credit/PricingTypes.js';
import type { WorkflowSpendingBucket } from './RunSpendingTypes.js';

/** Only the owned run and a bounded page may be selected by a client. */
export interface WorkflowRunUsageRequest {
    readonly runId: string;
    readonly offset: string;
}
/** Exact counters; missing dimensions were not reported. */
export interface WorkflowUsageDimensions {
    readonly inputTokens?: string;
    readonly outputTokens?: string;
    readonly cachedInputTokens?: string;
    readonly reasoningTokens?: string;
}
/** Actual executed identity and original tariff, never current catalog prices. */
export interface WorkflowModelUsage extends WorkflowSpendingBucket {
    readonly id: string;
    readonly provider: string | null;
    readonly model: string | null;
    readonly kind: ChargeKind;
    readonly unitLabel: string | null;
    readonly tariff: PricingTariff | null;
    readonly lastReportedAtMs: string;
    readonly expiresAtMs: string;
    readonly units: string | null;
    readonly unitEntries: string;
    readonly usage: WorkflowUsageDimensions;
    readonly usageEntries: WorkflowUsageDimensions;
}
/** Retained evidence shared by whole-run and attributed breakdowns. */
export interface WorkflowUsageEvidence {
    readonly runId: string;
    readonly workflowId: string;
    readonly revision: string;
    readonly observedAtMs: string;
    readonly reportedMicrocents: string | null;
    readonly entries: string;
    readonly lastReportedAtMs: string | null;
    readonly retainedFromMs: string | null;
    readonly expiresAtMs: string | null;
    readonly pricing: readonly WorkflowSpendingBucket[];
}
/** One consistent retained total and at most ten groups from that same observation. */
export interface WorkflowRunUsage extends WorkflowRunUsageRequest, WorkflowUsageEvidence {
    readonly models: readonly WorkflowModelUsage[];
    readonly modelCount: string;
    readonly next: string | null;
}
/** Mock executions cannot supply live metering evidence. */
export interface WorkflowRunUsageView extends WorkflowRunUsage {
    readonly simulated: boolean;
}
