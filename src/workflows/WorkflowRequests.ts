// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowGroupReference } from './WorkflowGroupTypes.js';
import type {
    WorkflowDetails,
    WorkflowPatch,
    WorkflowListCursor,
    WorkflowNodeReference,
    WorkflowEdgeReference,
} from './WorkflowTypes.js';
import type { ComponentDefinition } from './ComponentTypes.js';

/** Catalog format is separate from saved component versions and draft storage format. */
export interface WorkflowCatalog {
    readonly format: 1;
    readonly components: readonly ComponentDefinition[];
}
/** Authoritative validation always names one immutable saved revision. */
export interface WorkflowValidateRequest {
    readonly workflowId: string;
    readonly revision: string;
}

/** Bounded draft transport. Large writes require a separate staged-upload capability. */
export const WorkflowGatewayLimits = {
    patchBytes: 1_048_576,
    textChunkCharacters: 65_536,
    manifestNodes: 128,
    manifestEdges: 256,
    manifestGroups: 128,
} as const;

/** Client-chosen identities make an unacknowledged create safe to retry. */
export interface WorkflowCreateRequest {
    readonly workflowId: string;
    readonly commandId: string;
    readonly details: WorkflowDetails;
}
/** Command identity and expected revision serve different purposes. */
export interface WorkflowSaveRequest {
    readonly workflowId: string;
    readonly commandId: string;
    readonly expectedRevision: string;
    readonly patch: WorkflowPatch;
}
/** Metadata pagination carries no node payloads. */
export interface WorkflowListRequest {
    readonly limit: number;
    readonly cursor: WorkflowListCursor | null;
}
/** Null resolves the current revision only for the first page. Subsequent pages pin it. */
export interface WorkflowReadRequest {
    readonly groupOffset?: number;
    readonly workflowId: string;
    readonly revision: string | null;
    readonly nodeOffset: number;
    readonly edgeOffset: number;
}
/** Bounded manifest page; offsets count references, never bytes or revisions. */
export interface WorkflowManifestPage {
    readonly groups?: readonly WorkflowGroupReference[];
    readonly nextGroupOffset?: number | null;
    readonly format: 1;
    readonly workflowId: string;
    readonly revision: string;
    readonly details: WorkflowDetails;
    readonly nodes: readonly WorkflowNodeReference[];
    readonly edges: readonly WorkflowEdgeReference[];
    readonly nextNodeOffset: number | null;
    readonly nextEdgeOffset: number | null;
}
/** A reference identifies immutable content within the authenticated owner's workflow. */
export interface WorkflowRecordRequest {
    readonly workflowId: string;
    readonly reference: string;
    readonly offset: number;
}
/** JSON text chunks are concatenated before parsing. Offsets count UTF-16 code units. */
export interface WorkflowRecordPage {
    readonly workflowId: string;
    readonly reference: string;
    readonly offset: number;
    readonly totalCharacters: number;
    readonly content: string;
    readonly nextOffset: number | null;
}
