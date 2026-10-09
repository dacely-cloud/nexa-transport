import type { GraphIssue } from './GraphTypes.js';
import type { WorkflowObject } from './WorkflowTypes.js';

/** Immutable publication identity, distinct from its source draft revision. */
export interface WorkflowPublicationReference {
    readonly publicationId: string;
    readonly version: string;
    readonly revision: string;
}
/** Limits reviewed before publication; run callers cannot override them. */
export interface WorkflowPublicationPolicy {
    readonly triggerNodeId: string;
    readonly maxConcurrency: number;
    readonly timeoutMs: string;
}
/** A complete immutable manifest points to retained graph records, never a mutable draft. */
export interface WorkflowPublication extends WorkflowPublicationReference {
    readonly format: 1;
    readonly workflowId: string;
    readonly name: string;
    readonly publishedAtMs: string;
    readonly policy: WorkflowPublicationPolicy;
}
export interface WorkflowPublicationCheckRequest {
    readonly workflowId: string;
    readonly revision: string;
    readonly policy: WorkflowPublicationPolicy;
}
export interface WorkflowPublishRequest extends WorkflowPublicationCheckRequest {
    readonly commandId: string;
    readonly expectedDraftRevision: string;
    readonly expectedPublicationId: string | null;
}
/** Validation is an observation; publishing and execution each recheck current access. */
export interface WorkflowPublicationCheck {
    readonly workflowId: string;
    readonly revision: string;
    readonly checkedAtMs: string;
    readonly valid: boolean;
    readonly issues: readonly GraphIssue[];
}
export interface WorkflowPublishResult {
    readonly publication: WorkflowPublication | null;
    readonly check: WorkflowPublicationCheck;
}
export interface WorkflowPublicationReadRequest {
    readonly workflowId: string;
    readonly publicationId: string | null;
}
export interface WorkflowPublicationListRequest {
    readonly workflowId: string;
    readonly afterVersion: string | null;
    readonly limit: number;
}
export interface WorkflowPublicationPage {
    readonly items: readonly WorkflowPublication[];
    readonly next: string | null;
}
/** Explicitly selected immutable version, with server-owned execution limits. */
export interface WorkflowPublishedRunRequest {
    readonly runId: string;
    readonly workflowId: string;
    readonly publicationId: string;
    readonly input: WorkflowObject;
}
