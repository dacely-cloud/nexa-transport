// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Observed engine operations, independent of presentation timing. */
export const RedTeamActionKind = {
    Read: 'read',
    Tool: 'tool',
    Edit: 'edit',
    Wait: 'wait',
    Delegate: 'delegate',
    Result: 'result',
    Verify: 'verify',
    Error: 'error',
} as const;
export type RedTeamActionKind = (typeof RedTeamActionKind)[keyof typeof RedTeamActionKind];
/** Authoritative action lifecycle, including unsuccessful and cancelled operations. */
export const RedTeamActionState = {
    Started: 'started',
    Progress: 'progress',
    Succeeded: 'succeeded',
    Failed: 'failed',
    Cancelled: 'cancelled',
    Unconfirmed: 'unconfirmed',
    Waiting: 'waiting',
} as const;
export type RedTeamActionState = (typeof RedTeamActionState)[keyof typeof RedTeamActionState];
/** Content remains a dot; its original session supplies its inspectable details. */
export const RedTeamTargetKind = {
    File: 'file',
    Tool: 'tool',
    Terminal: 'terminal',
    Task: 'task',
    Result: 'result',
    Finding: 'finding',
    Plan: 'plan',
} as const;
export type RedTeamTargetKind = (typeof RedTeamTargetKind)[keyof typeof RedTeamTargetKind];
/** Exact native worker frames selected within their original parent archive and response stream. */
export interface RedTeamHistorySelection {
    readonly workerId: string;
    readonly streamId: string;
}
/** A stable owner-scoped reference, never authority to read an arbitrary filesystem path. */
export interface RedTeamActionTarget {
    /** Native descendants retain their actual parent archive rather than synthetic child sessions. */
    readonly historySelection?: RedTeamHistorySelection;
    readonly targetId: string;
    readonly kind: RedTeamTargetKind;
    readonly label: string;
    readonly sessionKey: string;
    readonly toolCallId: string | null;
    readonly fileId: string | null;
    readonly path: string | null;
    readonly line: number | null;
}
/** One exact engine action, ordered by its containing coordination event sequence. */
export interface RedTeamExecutionAction {
    readonly effortId: string;
    readonly agentId: string;
    readonly parentAgentId: string | null;
    readonly actionId: string;
    readonly kind: RedTeamActionKind;
    readonly state: RedTeamActionState;
    readonly target: RedTeamActionTarget;
    readonly relatedTargetId: string | null;
}
