// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowPublicationReference } from './PublicationTypes.js';
import type { WorkflowGroup, WorkflowGroupReference } from './WorkflowGroupTypes.js';
import type { ResourceBinding } from './ResourceTypes.js';

/** JSON configuration is data, not an executable plan or authorization. */
export interface WorkflowObject {
    readonly [key: string]: WorkflowValue;
}
/** Large integers and financial values must use decimal strings. */
export type WorkflowValue =
    null | boolean | string | number | readonly WorkflowValue[] | WorkflowObject;
/** User-owned descriptive fields, independent of run and automation state. */
export interface WorkflowDetails {
    readonly name: string;
    readonly description: string;
    readonly tags: readonly string[];
    readonly folder: string | null;
}
/** Versioned component configuration; unsupported or incomplete components can be saved. */
export interface WorkflowNode {
    readonly id: string;
    readonly component: string;
    readonly componentVersion: string;
    readonly label: string;
    readonly configuration: WorkflowObject;
    readonly resources: readonly ResourceBinding[];
}
/** Personal viewport is excluded; these positions belong to the workflow itself. */
export interface WorkflowPosition {
    readonly id: string;
    readonly x: number;
    readonly y: number;
}
/** Execution, values, and resource attachments have separate connection semantics. */
export const WorkflowEdgeKind = { Flow: 'flow', Data: 'data', Resource: 'resource' } as const;
/** Connection purpose does not depend on visual position. */
export type WorkflowEdgeKind = (typeof WorkflowEdgeKind)[keyof typeof WorkflowEdgeKind];
/** Stable endpoint identities survive cosmetic renames. */
export interface WorkflowEndpoint {
    readonly node: string;
    readonly port: string;
}
/** A draft can retain a dangling edge so validation can explain an unfinished edit. */
export interface WorkflowEdge {
    readonly id: string;
    readonly kind: WorkflowEdgeKind;
    readonly from: WorkflowEndpoint;
    readonly to: WorkflowEndpoint;
}
/** A bounded edit; layout changes never include node configuration. */
export interface WorkflowPatch {
    /** Present together on hierarchy-aware edits; omission denotes a legacy writer. */
    readonly groups?: readonly WorkflowGroup[];
    readonly removeGroups?: readonly string[];
    readonly details: WorkflowDetails | null;
    readonly nodes: readonly WorkflowNode[];
    readonly positions: readonly WorkflowPosition[];
    readonly edges: readonly WorkflowEdge[];
    readonly removeNodes: readonly string[];
    readonly removeEdges: readonly string[];
}
/** Result retained by command receipts, including after subsequent edits. */
export interface WorkflowReceipt {
    readonly workflowId: string;
    readonly revision: string;
}
/** Small management projection; contains no graph, prompts, or run histories. */
export interface WorkflowSummary extends WorkflowReceipt {
    readonly publication?: WorkflowPublicationReference;
    readonly details: WorkflowDetails;
    readonly createdAtMs: string;
    readonly updatedAtMs: string;
    readonly nodeCount: number;
    readonly edgeCount: number;
}
/** Record families share bounded storage while preserving typed reads. */
export const WorkflowRecordKind = {
    Node: 'node',
    Position: 'position',
    Edge: 'edge',
    Group: 'group',
} as const;
/** Stored graph record family. */
export type WorkflowRecordKind = (typeof WorkflowRecordKind)[keyof typeof WorkflowRecordKind];
/** One node's immutable content and independently versioned layout. */
export interface WorkflowNodeReference {
    readonly id: string;
    readonly content: string;
    readonly position: string;
}
/** One immutable connection. */
export interface WorkflowEdgeReference {
    readonly id: string;
    readonly content: string;
}
/** Immutable revision manifest. Large manifests themselves use bounded payload storage. */
export interface WorkflowManifest extends WorkflowReceipt {
    readonly groups?: readonly WorkflowGroupReference[];
    readonly format: 1;
    readonly details: WorkflowDetails;
    readonly nodes: readonly WorkflowNodeReference[];
    readonly edges: readonly WorkflowEdgeReference[];
}
/** Cursor uses a timestamp plus stable identity to handle equal update times. */
export interface WorkflowListCursor {
    readonly updatedAtMs: string;
    readonly workflowId: string;
}
/** Bounded management page. */
export interface WorkflowListPage {
    readonly items: readonly WorkflowSummary[];
    readonly next: WorkflowListCursor | null;
}

/** Decoded values for bounded editor or executor reads. */
export interface WorkflowReadNode {
    readonly reference: string;
    readonly kind: typeof WorkflowRecordKind.Node;
    readonly value: WorkflowNode;
}
/** Decoded layout contains no execution configuration. */
export interface WorkflowReadPosition {
    readonly reference: string;
    readonly kind: typeof WorkflowRecordKind.Position;
    readonly value: WorkflowPosition;
}
/** Decoded edge retains its declared semantic kind. */
export interface WorkflowReadEdge {
    readonly reference: string;
    readonly kind: typeof WorkflowRecordKind.Edge;
    readonly value: WorkflowEdge;
}
/** Decoded group layout contains no run state or executable configuration. */
export interface WorkflowReadGroup {
    readonly reference: string;
    readonly kind: typeof WorkflowRecordKind.Group;
    readonly value: WorkflowGroup;
}
/** The reader can select only the record families it needs. */
export type WorkflowReadRecord =
    WorkflowReadNode | WorkflowReadPosition | WorkflowReadEdge | WorkflowReadGroup;
