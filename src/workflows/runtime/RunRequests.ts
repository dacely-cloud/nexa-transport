// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowObject } from '../WorkflowTypes.js';
import type { WorkflowRunMode, WorkflowRunSummary, WorkflowStepState } from './RunTypes.js';

/** Starts one idempotent run of an owned saved revision. */
export interface WorkflowRunStartRequest {
    readonly runId: string;
    readonly workflowId: string;
    readonly revision: string;
    readonly triggerNodeId: string;
    readonly mode: WorkflowRunMode;
    readonly input: WorkflowObject;
    readonly maxConcurrency: number;
    readonly timeoutMs: string;
}
/** Addresses a run within the authenticated principal. */
export interface WorkflowRunRequest {
    readonly runId: string;
}
/** Reads ordered journal events after an exclusive sequence. */
export interface WorkflowRunEventsRequest extends WorkflowRunRequest {
    readonly after: string;
    readonly limit: number;
}
/** Reads bounded step metadata after an exclusive node ID. */
export interface WorkflowRunStepsRequest extends WorkflowRunRequest {
    readonly afterNodeId: string | null;
    readonly limit: number;
}
/** Exposes step metadata without embedding potentially large result payloads. */
export interface WorkflowStepView extends Omit<WorkflowStepState, 'result'> {
    readonly hasResult: boolean;
    readonly label: string;
    readonly component: string;
}
/** A bounded step page and its continuation cursor. */
export interface WorkflowRunStepsPage {
    readonly items: readonly WorkflowStepView[];
    readonly next: string | null;
}
/** Addresses one exact attempt and a UTF-16 offset into its encoded result. */
export interface WorkflowRunOutputRequest extends WorkflowRunRequest {
    readonly nodeId: string;
    readonly invocationId: string;
    readonly offset: number;
}
/** A bounded JSON fragment with total length and continuation offset. */
export interface WorkflowRunOutputPage extends WorkflowRunOutputRequest {
    readonly content: string;
    readonly totalCharacters: number;
    readonly nextOffset: number | null;
}
/** Pages run history for one owned workflow. */
export interface WorkflowRunListRequest {
    readonly workflowId: string;
    readonly afterRunId: string | null;
    readonly limit: number;
}
/** A bounded history page ordered by creation time and run ID. */
export interface WorkflowRunListPage {
    readonly items: readonly WorkflowRunSummary[];
    readonly next: string | null;
}
