// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowGraph } from '../GraphTypes.js';
import type {
    WorkflowNode,
    WorkflowEdge,
    WorkflowObject,
    WorkflowValue,
} from '../WorkflowTypes.js';
import type { ComponentDefinition } from '../ComponentTypes.js';

export const WorkflowRunMode = { LiveTest: 'live-test', MockTest: 'mock-test' } as const;
export type WorkflowRunMode = (typeof WorkflowRunMode)[keyof typeof WorkflowRunMode];
export const WorkflowRunStatus = {
    Queued: 'queued',
    Running: 'running',
    Succeeded: 'succeeded',
    Failed: 'failed',
    Cancelled: 'cancelled',
} as const;
export type WorkflowRunStatus = (typeof WorkflowRunStatus)[keyof typeof WorkflowRunStatus];
export const WorkflowStepStatus = {
    Running: 'running',
    Succeeded: 'succeeded',
    Failed: 'failed',
    Skipped: 'skipped',
    Interrupted: 'interrupted',
    Uncertain: 'uncertain',
    Cancelled: 'cancelled',
} as const;
export type WorkflowStepStatus = (typeof WorkflowStepStatus)[keyof typeof WorkflowStepStatus];
export const WorkflowRunEventKind = {
    Accepted: 'accepted',
    Claimed: 'claimed',
    StepStarted: 'step-started',
    StepFinished: 'step-finished',
    Finished: 'finished',
    Cancelled: 'cancelled',
} as const;
export type WorkflowRunEventKind = (typeof WorkflowRunEventKind)[keyof typeof WorkflowRunEventKind];

/** Immutable semantic snapshot; no canvas layout, credentials, or mutable draft pointer. */
export interface WorkflowRunSnapshot {
    readonly format: 1;
    readonly graph: WorkflowGraph;
    readonly triggerNodeId: string;
    readonly mode: WorkflowRunMode;
    readonly input: WorkflowObject;
    readonly maxConcurrency: number;
    readonly timeoutMs: string;
}
/** Resolved contracts exist separately from the persisted graph and mutable run state. */
export interface WorkflowPlanStep {
    readonly node: WorkflowNode;
    readonly definition: ComponentDefinition;
    readonly incoming: readonly WorkflowEdge[];
}
export interface WorkflowExecutionPlan {
    readonly snapshot: WorkflowRunSnapshot;
    readonly steps: readonly WorkflowPlanStep[];
}
export interface WorkflowNamedResult {
    readonly name: string;
    readonly value: WorkflowValue;
}
export interface WorkflowStepResult {
    readonly outputs: WorkflowObject;
    readonly routes: readonly string[];
    readonly result: WorkflowNamedResult | null;
}
export interface WorkflowStepState {
    readonly nodeId: string;
    readonly invocationId: string;
    readonly attempt: number;
    readonly status: WorkflowStepStatus;
    readonly startedAtMs: string;
    readonly finishedAtMs: string | null;
    readonly result: WorkflowStepResult | null;
    readonly message: string | null;
}
/** A lease epoch is a fencing token, not a revision of the workflow definition. */
export interface WorkflowRunLease {
    readonly principal: string;
    readonly runId: string;
    readonly workerId: string;
    readonly epoch: string;
}
export interface WorkflowRunSummary {
    readonly runId: string;
    readonly workflowId: string;
    readonly workflowRevision: string;
    readonly mode: WorkflowRunMode;
    readonly status: WorkflowRunStatus;
    readonly createdAtMs: string;
    readonly updatedAtMs: string;
    readonly sequence: string;
    readonly message: string | null;
}
export interface WorkflowRunEvent {
    readonly runId: string;
    readonly sequence: string;
    readonly atMs: string;
    readonly kind: WorkflowRunEventKind;
    readonly nodeId: string | null;
    readonly invocationId: string | null;
    readonly status: WorkflowRunStatus | WorkflowStepStatus;
    readonly message: string | null;
}
