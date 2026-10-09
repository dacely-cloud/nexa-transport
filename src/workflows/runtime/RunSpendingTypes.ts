// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { PricingBasis } from '../../credit/PricingBasis.js';

/** Legacy reporting never infers a pricing classification from its amount. */
export const WorkflowSpendingBasis = { ...PricingBasis, Legacy: 'legacy' } as const;
/** A bounded classification independent of mutable provider pricing. */
export type WorkflowSpendingBasis =
    (typeof WorkflowSpendingBasis)[keyof typeof WorkflowSpendingBasis];
/** Exact subtotal and usage count; buckets partition the recorded amount, never add another charge. */
export interface WorkflowSpendingBucket {
    readonly basis: WorkflowSpendingBasis;
    readonly microcents: string;
    readonly entries: string;
}

/** Select one authored loop in an owned immutable run. */
export interface WorkflowLoopSpendingRequest {
    readonly runId: string;
    readonly loopId: string;
}

/** Exact credit-authority evidence. Null reported cost means no retained report, never a known zero. */
export interface WorkflowLoopSpending extends WorkflowLoopSpendingRequest {
    /** Present only on the negotiated classified-report method. */
    readonly pricing?: readonly WorkflowSpendingBucket[];
    readonly workflowId: string;
    readonly revision: string;
    readonly observedAtMs: string;
    readonly reportedMicrocents: string | null;
    readonly reservedMicrocents: string;
    readonly reservationCount: number;
    readonly entries: string;
    readonly lastReportedAtMs: string | null;
    readonly limitMicrocents: string | null;
    readonly deadlineAtMs: string | null;
}

/** The public projection adds run-pinned configuration and explicitly marks mocked execution. */
export interface WorkflowLoopSpendingView extends WorkflowLoopSpending {
    readonly simulated: boolean;
}
