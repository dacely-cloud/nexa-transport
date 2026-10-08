// SPDX-License-Identifier: Apache-2.0

import type { WorkflowModelPolicyEvidence } from '../ModelPolicy.js';
import type { WorkflowRunSnapshot } from './RunTypes.js';

/** Resolution uses the selected provider only; policies require their own verified resolver. */
export const WorkflowModelSelection = { Exact: 'exact', Latest: 'latest-compatible' } as const;
/** Required operation capabilities for the text handler. */
export const WorkflowTextCapability = { Text: 'text', Reasoning: 'reasoning' } as const;
/** A supported text operation. */
export type WorkflowTextCapability =
    (typeof WorkflowTextCapability)[keyof typeof WorkflowTextCapability];
/** Immutable provider identity and price reference captured before acceptance. Never contains credentials. */
export interface WorkflowResolvedModel {
    readonly nodeId: string;
    readonly bindingId: string;
    readonly provider: string;
    readonly model: string;
    readonly selection: (typeof WorkflowModelSelection)[keyof typeof WorkflowModelSelection];
    readonly policy?: WorkflowModelPolicyEvidence;
    readonly capability: WorkflowTextCapability;
    readonly maxOutputTokens: number;
    /** Digest of the existing ledger rate card; null means unpriced. */
    readonly pricingReference: string | null;
}
/** The host resolves model configuration without running inference or saving the user's draft. */
export interface WorkflowRunPreparation {
    readonly prepare: (
        principal: string,
        snapshot: WorkflowRunSnapshot,
    ) => Promise<WorkflowRunSnapshot>;
}
