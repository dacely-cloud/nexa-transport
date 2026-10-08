// SPDX-License-Identifier: Apache-2.0

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
