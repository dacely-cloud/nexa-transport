// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowObject } from '../WorkflowTypes.js';
import type { WorkflowHumanIdentity } from './RunHumanTypes.js';

/** Explicit decisions; absence of a decision never grants permission. */
export const WorkflowApprovalChoice = {
    Approve: 'approved',
    Reject: 'rejected',
    RequestChanges: 'changes_requested',
    Cancel: 'cancelled',
} as const;
/** Supported owner review choices. */
export type WorkflowApprovalChoice =
    (typeof WorkflowApprovalChoice)[keyof typeof WorkflowApprovalChoice];
/** Exact material action data presented for review. */
export interface WorkflowApprovalContent {
    readonly action: string;
    readonly destination: string;
    readonly content: WorkflowObject;
}
/** Immutable canonical content identified by a server-computed SHA-256 revision. */
export interface WorkflowApprovalProposal extends WorkflowApprovalContent {
    readonly revision: string;
}
/** One explicit authenticated decision on one exact proposal and invocation. */
export interface WorkflowApprovalDecision extends WorkflowHumanIdentity {
    readonly commandId: string;
    readonly proposalRevision: string;
    readonly decision: WorkflowApprovalChoice;
    readonly comment: string;
}
/** Configured owner review with in-app delivery, independent of external notification adapters. */
export interface WorkflowApprovalConfiguration extends WorkflowApprovalContent {
    readonly timeoutMs: string;
    readonly reviewer: 'owner';
    readonly notification: 'in-app';
}
