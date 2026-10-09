// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Supported answer shapes for the initial owner question component. */
export const WorkflowAnswerType = { Text: 'text', Choice: 'choice', Boolean: 'boolean' } as const;
export type WorkflowAnswerType = (typeof WorkflowAnswerType)[keyof typeof WorkflowAnswerType];
/** A validated question bound to one recorded invocation. */
export interface WorkflowHumanQuestion {
    readonly question: string;
    readonly answerType: WorkflowAnswerType;
    readonly choices: readonly string[];
    readonly timeoutMs: string;
}
/** Exact invocation identity; the authenticated principal is never supplied by clients. */
export interface WorkflowHumanIdentity {
    readonly runId: string;
    readonly nodeId: string;
    readonly invocationId: string;
}
/** An idempotent explicit answer command. */
export interface WorkflowHumanAnswer extends WorkflowHumanIdentity {
    readonly commandId: string;
    readonly answer: string | boolean;
}
/** Terminal outcomes never infer an answer from silence. */
export const WorkflowHumanOutcome = { Answered: 'answered', Expired: 'expired' } as const;
export type WorkflowHumanOutcome = (typeof WorkflowHumanOutcome)[keyof typeof WorkflowHumanOutcome];
/** Request presentation state also reflects whole-run cancellation. */
export const WorkflowHumanStatus = {
    Pending: 'pending',
    Answered: 'answered',
    Expired: 'expired',
    Cancelled: 'cancelled',
} as const;
export type WorkflowHumanStatus = (typeof WorkflowHumanStatus)[keyof typeof WorkflowHumanStatus];
/** Recorded response evidence; expiry contains no actor or answer. */
export interface WorkflowHumanResponse {
    readonly commandId: string | null;
    readonly answer: string | boolean | null;
    readonly actor: string | null;
    readonly atMs: string;
    readonly outcome: WorkflowHumanOutcome;
}
/** Bounded persisted metadata alongside the immutable invocation. */
export interface WorkflowHumanRecord extends WorkflowHumanQuestion {
    readonly createdAtMs: string;
    readonly expiresAtMs: string;
    readonly response: WorkflowHumanResponse | null;
}
/** Public owner-scoped read, shared by pending-run views and future inbox navigation. */
export interface WorkflowHumanRequest extends WorkflowHumanIdentity, WorkflowHumanRecord {
    readonly label: string;
    readonly recipient: string;
    readonly status: WorkflowHumanStatus;
    readonly canAnswer: boolean;
}
/** Pending questions are capped per run and returned without completed output bodies. */
export interface WorkflowHumanPage {
    readonly runId: string;
    readonly observedAtMs: string;
    readonly items: readonly WorkflowHumanRequest[];
}
