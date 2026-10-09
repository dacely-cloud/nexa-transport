// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Inbox views share authoritative execution records, never copied request state. */
export const WorkflowAttentionCategory = { Requests: 'requests', Failures: 'failures' } as const;
/** Supported attention sources. */
export type WorkflowAttentionCategory =
    (typeof WorkflowAttentionCategory)[keyof typeof WorkflowAttentionCategory];
/** Stable owner-scoped position, still usable after the preceding request is answered. */
export interface WorkflowAttentionCursor {
    readonly runId: string;
    readonly nodeId: string | null;
}
/** Bounded metadata query; the authenticated owner is not client input. */
export interface WorkflowAttentionQuery {
    readonly category: WorkflowAttentionCategory;
    readonly after: WorkflowAttentionCursor | null;
    readonly limit: number;
}
/** Display metadata points to an exact invocation; proposal bodies are loaded only on review. */
export interface WorkflowAttentionItem {
    readonly kind: 'question' | 'approval' | 'failure';
    readonly workflowId: string;
    readonly workflowRevision: string;
    readonly workflowName: string | null;
    readonly runId: string;
    readonly nodeId: string | null;
    readonly invocationId: string | null;
    readonly title: string;
    readonly detail: string;
    readonly recipient: string;
    readonly createdAtMs: string;
    readonly expiresAtMs: string | null;
    readonly status: 'pending' | 'expired' | 'failed';
    readonly canRespond: boolean;
}
/** Stable pagination may return an empty page with a continuation after stale records are filtered. */
export interface WorkflowAttentionPage {
    readonly category: WorkflowAttentionCategory;
    readonly observedAtMs: string;
    readonly items: readonly WorkflowAttentionItem[];
    readonly next: WorkflowAttentionCursor | null;
}
