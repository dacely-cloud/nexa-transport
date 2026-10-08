// SPDX-License-Identifier: Apache-2.0

import type {
    WorkflowDetails,
    WorkflowNode,
    WorkflowPosition,
    WorkflowEdge,
    WorkflowPatch,
} from '../WorkflowTypes.js';
import type { GraphValidation } from '../GraphTypes.js';

/** Unsaved editor state is planning context, never an execution plan or permission grant. */
export interface PlanningDocument {
    readonly details: WorkflowDetails;
    readonly nodes: readonly WorkflowNode[];
    readonly positions: readonly WorkflowPosition[];
    readonly edges: readonly WorkflowEdge[];
}
export const RequirementState = {
    Drafted: 'drafted',
    Missing: 'missing',
    Question: 'question',
} as const;
export type RequirementState = (typeof RequirementState)[keyof typeof RequirementState];
/** Links the user's intent to stable component identities without claiming execution readiness. */
export interface PlanningRequirement {
    readonly id: string;
    readonly text: string;
    readonly nodeIds: readonly string[];
    readonly state: RequirementState;
}
export interface PlanningQuestion {
    readonly id: string;
    readonly text: string;
    readonly choices: readonly string[];
}
/** A bounded product brief; unanswered operational choices remain explicit. */
export interface PlanningBrief {
    readonly goal: string;
    readonly requirements: readonly PlanningRequirement[];
    readonly sources: readonly string[];
    readonly outputs: readonly string[];
    readonly boundaries: readonly string[];
    readonly assumptions: readonly string[];
    readonly questions: readonly PlanningQuestion[];
    readonly schedule: string | null;
    readonly budget: string | null;
}
/** Exactly one model reply. Only the server adds graph validation. */
export interface PlanningProposal {
    readonly message: string;
    readonly brief: PlanningBrief;
    readonly patch: WorkflowPatch | null;
}
/** Fingerprint pins the proposal to unsaved state as well as the persisted base revision. */
export interface PlanningReply extends PlanningProposal {
    readonly workflowId: string;
    readonly baseRevision: string;
    readonly draftHash: string;
    readonly validation: GraphValidation;
}
export interface PlanningRequest {
    /** Explicit metadata selections; never resource grants. Omitted by older clients. */
    readonly sourceIds?: readonly string[];
    readonly workflowId: string;
    readonly requestId: string;
    readonly baseRevision: string;
    readonly previousRequestId: string | null;
    readonly message: string;
    readonly document: PlanningDocument;
}
export const PlanningStatus = {
    Working: 'working',
    Complete: 'complete',
    Failed: 'failed',
    Canceled: 'canceled',
} as const;
export type PlanningStatus = (typeof PlanningStatus)[keyof typeof PlanningStatus];
/** A turn is a separate bounded record, not an ever-growing workflow field. */
export interface PlanningTurn {
    /** Explicit metadata selections retained with this conversation turn. */
    readonly sourceIds?: readonly string[];
    readonly workflowId: string;
    readonly requestId: string;
    readonly previousRequestId: string | null;
    readonly message: string;
    readonly createdAtMs: string;
    readonly status: PlanningStatus;
    readonly reply: PlanningReply | null;
    readonly error: string | null;
}
export interface PlanningTurnRef {
    readonly workflowId: string;
    readonly requestId: string;
}
export interface PlanningHistoryRequest {
    readonly workflowId: string;
    readonly beforeRequestId: string | null;
}
export interface PlanningHistory {
    readonly turns: readonly PlanningTurn[];
    readonly nextRequestId: string | null;
}
export const PlanningLimits = {
    requestBytes: 1_048_576,
    responseBytes: 524_288,
    nodes: 1000,
    edges: 4000,
    messageCharacters: 16_000,
    timeoutMs: 180_000,
} as const;
