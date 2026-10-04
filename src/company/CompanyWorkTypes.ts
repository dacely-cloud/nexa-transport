// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Project progress is independent of whether an owner has an open browser. */
export type CompanyWorkPhase =
    'draft' | 'planning' | 'plan-review' | 'running' | 'delivery-review' | 'accepted' | 'blocked';
/** An assignment retains its identity across reviewed correction rounds. */
export interface CompanyTask {
    readonly id: string;
    readonly kind: 'plan' | 'work' | 'review';
    readonly employeeId: string;
    readonly title: string;
    readonly instructions: string;
    readonly acceptance: readonly string[];
    readonly dependsOn: readonly string[];
    readonly status: 'queued' | 'running' | 'done' | 'blocked';
}
/** Captured files are immutable content references, never arbitrary browser-readable paths. */
export interface CompanyArtifact {
    readonly path: string;
    readonly digest: string;
    readonly bytes: bigint;
}
/** Only the host records tool evidence after matching it to the completed execution. */
export interface CompanyEvidence {
    readonly callId: string;
    readonly tool: string;
    readonly summary: string;
}
/** Execution history records the employee who actually worked, even after reassignment. */
export interface CompanyWorkAttempt {
    readonly id: string;
    readonly taskId: string;
    readonly employeeId: string;
    readonly holder: string;
    readonly expires: bigint;
    readonly started: bigint;
    readonly finished: bigint;
    readonly status: 'running' | 'done' | 'blocked' | 'interrupted';
    readonly summary: string;
    readonly sessionId: string;
    readonly inputTokens: bigint;
    readonly outputTokens: bigint;
    readonly artifacts: readonly CompanyArtifact[];
    readonly evidence: readonly CompanyEvidence[];
}
/** Bounded private execution state; visitor snapshots project only generic activity. */
export interface CompanyWork {
    readonly projectId: string;
    readonly revision: bigint;
    readonly phase: CompanyWorkPhase;
    readonly workspaceId: string;
    readonly reviewerId: string;
    readonly plan: string;
    readonly proposedLimit: bigint;
    readonly allowanceId: string;
    readonly allowanceRevision: bigint;
    readonly limit: bigint;
    readonly concurrency: number;
    readonly maxIterations: number;
    readonly paused: boolean;
    readonly priority: number;
    readonly feedback: string;
    readonly decision: string;
    readonly acceptedAt: bigint;
    readonly tasks: readonly CompanyTask[];
    readonly attempts: readonly CompanyWorkAttempt[];
}
/** The manager proposes work; proposing it does not authorize dispatch. */
export interface CompanyProposedTask {
    readonly id: string;
    readonly employeeId: string;
    readonly title: string;
    readonly instructions: string;
    readonly acceptance: readonly string[];
    readonly dependsOn: readonly string[];
}
/** Complete manager proposal, validated against owned staffing and dependency cycles. */
export interface CompanyProposal {
    readonly summary: string;
    readonly limit: bigint;
    readonly tasks: readonly CompanyProposedTask[];
}
/** A replayed command must carry the same revision and body. */
export interface CompanyWorkRequest {
    readonly id: string;
    readonly revision: bigint;
}
/** Owner-approved limits for planning or implementation, separate from cosmetic progression. */
export interface CompanyWorkLimits extends CompanyWorkRequest {
    readonly limit: bigint;
    readonly allowanceRevision: bigint;
    readonly concurrency: number;
    readonly maxIterations: number;
}
/** Authorize only the manager's planning assignment. */
export interface CompanyPlan extends CompanyWorkLimits {
    readonly kind: 'plan';
    readonly reviewerId: string;
}
/** Authorize the reviewed proposal and its task graph. */
export interface CompanyApprove extends CompanyWorkLimits {
    readonly kind: 'approve';
}
/** Request another implementation and independent review round without erasing earlier receipts. */
export interface CompanyCorrect extends CompanyWorkRequest {
    readonly kind: 'correct';
    readonly feedback: string;
}
/** Accept a verified delivery, with the owner's recorded decision. */
export interface CompanyAccept extends CompanyWorkRequest {
    readonly kind: 'accept';
    readonly evidence: string;
}
/** Change queued assignments without interrupting a running tool call. */
export interface CompanyAssign extends CompanyWorkRequest {
    readonly kind: 'assign';
    readonly taskId: string;
    readonly employeeId: string;
}
/** Pause future dispatch or change priority; in-flight work retains its claim. */
export interface CompanySchedule extends CompanyWorkRequest {
    readonly kind: 'schedule';
    readonly paused: boolean;
    readonly priority: number;
}
/** All commands are private and take their owner from the authenticated connection. */
export type CompanyWorkCommand =
    CompanyPlan | CompanyApprove | CompanyCorrect | CompanyAccept | CompanyAssign | CompanySchedule;
/** Exact completed-run receipts passed by the host, never by an owner or visitor command. */
export interface CompanyWorkResult {
    readonly succeeded: boolean;
    readonly summary: string;
    readonly sessionId: string;
    readonly inputTokens: bigint;
    readonly outputTokens: bigint;
    readonly artifacts: readonly CompanyArtifact[];
    readonly evidence: readonly CompanyEvidence[];
    readonly proposal?: CompanyProposal;
}
/** A durable ready-project key contains no private prompt or output content. */
export interface CompanyReadyWork {
    readonly principal: string;
    readonly project: string;
}
