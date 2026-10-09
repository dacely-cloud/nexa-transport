// SPDX-License-Identifier: Apache-2.0

import type { WorkflowStepStatus } from './RunTypes.js';

/** Public immutable file metadata; neither storage paths nor global media IDs cross this boundary. */
export interface WorkflowRunArtifact {
    readonly artifactId: string;
    readonly name: string;
    readonly contentType: string;
    readonly bytes: string;
    readonly sha256: string;
    readonly expiresAtMs: string | null;
}
/** One exact operation's artifact, addressed within the authenticated account and run. */
export interface WorkflowRunArtifactRequest {
    readonly runId: string;
    readonly artifactId: string;
    readonly offset: number;
}
/** A bounded binary fragment; clients verify the complete SHA-256 after assembling all fragments. */
export interface WorkflowRunArtifactPage extends WorkflowRunArtifactRequest {
    readonly artifact: WorkflowRunArtifact;
    readonly base64: string;
    readonly nextOffset: number | null;
}
/** Exclusive position in the run's immutable invocation manifests. */
export interface WorkflowArtifactCursor {
    readonly nodeId: string;
    readonly invocationId: string;
}
/** Lists metadata only, with at most six publications of at most 32 files each. */
export interface WorkflowArtifactListRequest {
    readonly runId: string;
    readonly after: WorkflowArtifactCursor | null;
    readonly limit: number;
}
/** Recorded producing identity and public file metadata, without storage identifiers. */
export interface WorkflowArtifactPublication extends WorkflowArtifactCursor {
    readonly label: string;
    readonly attempt: number | null;
    readonly status: WorkflowStepStatus | null;
    readonly createdAtMs: string | null;
    readonly artifacts: readonly WorkflowRunArtifact[];
}
/** Expiry is interpreted against the server observation time; bytes are retrieved separately. */
export interface WorkflowArtifactListPage {
    readonly runId: string;
    readonly observedAtMs: string;
    readonly items: readonly WorkflowArtifactPublication[];
    readonly next: WorkflowArtifactCursor | null;
}
