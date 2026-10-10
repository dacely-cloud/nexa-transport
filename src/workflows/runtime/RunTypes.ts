// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowScheduleSource } from '../schedule/ScheduleTypes.js';
import type { WorkflowPublicationReference } from '../PublicationTypes.js';
import type { WorkflowResolvedModel } from './RunModelTypes.js';
import type { WorkflowResolvedImage } from './RunImageTypes.js';
import type { WorkflowGraph } from '../GraphTypes.js';
import type {
    WorkflowNode,
    WorkflowEdge,
    WorkflowObject,
    WorkflowValue,
} from '../WorkflowTypes.js';
import type { ComponentDefinition } from '../ComponentTypes.js';

export const WorkflowRunMode = {
    LiveTest: 'live-test',
    MockTest: 'mock-test',
    Published: 'published',
} as const;
export type WorkflowRunMode = (typeof WorkflowRunMode)[keyof typeof WorkflowRunMode];
export const WorkflowRunStatus = {
    Queued: 'queued',
    Running: 'running',
    Waiting: 'waiting',
    Succeeded: 'succeeded',
    Failed: 'failed',
    Cancelled: 'cancelled',
} as const;
export type WorkflowRunStatus = (typeof WorkflowRunStatus)[keyof typeof WorkflowRunStatus];
export const WorkflowStepStatus = {
    Running: 'running',
    Waiting: 'waiting',
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
    StepWaiting: 'step-waiting',
    Suspended: 'suspended',
    Resumed: 'resumed',
    StepFinished: 'step-finished',
    Finished: 'finished',
    Cancelled: 'cancelled',
} as const;
export type WorkflowRunEventKind = (typeof WorkflowRunEventKind)[keyof typeof WorkflowRunEventKind];

/** Immutable semantic snapshot; no canvas layout, credentials, or mutable draft pointer. */
export interface WorkflowRunSnapshot {
    /** The submitting account approved unattended execution of this exact immutable snapshot. */
    readonly accountAuthorization?: true;
    /** Present only on scheduled published runs. */
    readonly schedule?: WorkflowScheduleSource;
    readonly publication?: WorkflowPublicationReference;
    /** Image settings and prices resolved by the host before acceptance. */
    readonly imageModels?: readonly WorkflowResolvedImage[];
    /** Host-resolved exact bindings pinned before acceptance; absent on deterministic runs. */
    readonly models?: readonly WorkflowResolvedModel[];
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
/** Optional presentation is captured with the result, independently of later draft edits. */
export const WorkflowOutputView = {
    Automatic: 'auto',
    Text: 'text',
    Table: 'table',
    Data: 'data',
} as const;
export type WorkflowOutputView = (typeof WorkflowOutputView)[keyof typeof WorkflowOutputView];
export interface WorkflowNamedResult {
    readonly view?: WorkflowOutputView;
    readonly name: string;
    readonly value: WorkflowValue;
}
export interface WorkflowStepResult {
    readonly outputs: WorkflowObject;
    readonly routes: readonly string[];
    readonly result: WorkflowNamedResult | null;
}
/** An execution instance points back to the immutable authored card and its collection item. */
export interface WorkflowStepOrigin {
    readonly nodeId: string;
    readonly loopId: string;
    readonly itemIndex: number;
}
export interface WorkflowStepState {
    /** Only repeated instances carry this provenance; nodeId identifies the execution instance. */
    readonly origin?: WorkflowStepOrigin;
    /** Persisted timer target; retained after completion or cancellation as timing evidence. */
    readonly wakeAtMs?: string;
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
    /** Present only on scheduled published runs. */
    readonly schedule?: WorkflowScheduleSource;
    readonly publication?: WorkflowPublicationReference;
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
    readonly origin?: WorkflowStepOrigin;
    readonly runId: string;
    readonly sequence: string;
    readonly atMs: string;
    readonly kind: WorkflowRunEventKind;
    readonly nodeId: string | null;
    readonly invocationId: string | null;
    readonly status: WorkflowRunStatus | WorkflowStepStatus;
    readonly message: string | null;
}
