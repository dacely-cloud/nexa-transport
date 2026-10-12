// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignVariantSet, DesignVariantValue } from './DesignVariantTypes.js';
import type { DesignMask } from './DesignMaskTypes.js';
import type { DesignBooleanMode } from './DesignBooleanTypes.js';

import type {
    DesignConstraint,
    DesignNode,
    DesignPage,
    DesignStyle,
    DesignLayout,
    DesignPlacement,
    DesignText,
    DesignPathCommand,
    DesignImage,
    DesignOverride,
    DesignKind,
    DesignToken,
    DesignInteraction,
    DesignComment,
    DesignDocument,
} from './DesignTypes.js';

/** Atomic scene operations shared by agents and the editor. */
export const DesignOperationKind = {
    Insert: 'insert',
    Update: 'update',
    Resize: 'resize',
    Position: 'position',
    Translate: 'translate',
    Rotate: 'rotate',
    Scale: 'scale',
    Text: 'text',
    Move: 'move',
    Remove: 'remove',
    Page: 'page',
    Metadata: 'metadata',
} as const;
/** Editable properties exclude identity and tree links, which have dedicated operations. */
export interface DesignNodeChanges {
    readonly contentScale?: number | null;
    /** A null value clears the operation when explicitly flattening a Boolean group. */
    readonly booleanMode?: DesignBooleanMode | null;
    /** Null clears masking when converting the container into an ordinary group. */
    readonly mask?: DesignMask | null;
    /** Null releases component-set metadata when converting its container. */
    readonly variants?: DesignVariantSet | null;
    /** Null releases a definition from its set. */
    readonly variant?: readonly DesignVariantValue[] | null;
    readonly name?: string;
    readonly kind?: DesignKind;
    readonly x?: number;
    readonly y?: number;
    readonly width?: number;
    readonly height?: number;
    readonly rotation?: number;
    readonly opacity?: number;
    readonly visible?: boolean;
    readonly locked?: boolean;
    readonly style?: DesignStyle;
    readonly layout?: DesignLayout;
    readonly placement?: DesignPlacement;
    readonly text?: DesignText | null;
    readonly path?: readonly DesignPathCommand[];
    readonly image?: DesignImage | null;
    readonly componentId?: string | null;
    readonly overrides?: readonly DesignOverride[];
}
/** Insert a standalone node at a precise location in a page or container. */
export interface DesignInsert {
    readonly op: typeof DesignOperationKind.Insert;
    readonly node: DesignNode;
    readonly parentId: string | null;
    readonly pageId: string;
    readonly index: number;
}
/** Update only chosen properties, preserving unrelated edits. */
export interface DesignUpdate {
    readonly op: typeof DesignOperationKind.Update;
    readonly id: string;
    readonly changes: DesignNodeChanges;
}
/** Replace text content while preserving typography and clipping existing rich-text ranges. */
export interface DesignTextOperation {
    readonly op: typeof DesignOperationKind.Text;
    readonly id: string;
    readonly content: string;
}
/** Explicit geometry edits fix requested axes and preserve absolute child constraints atomically. */
export interface DesignResizeOperation {
    readonly op: typeof DesignOperationKind.Resize;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly width?: number;
    readonly height?: number;
    /** Position edits accompany a single dragged layer and use its resolved parent coordinates. */
    readonly x?: number;
    readonly y?: number;
}
/** Visible parent-local coordinates and pin changes preserve the layer's resolved size. */
export interface DesignPositionChanges {
    readonly x?: number;
    readonly y?: number;
    readonly horizontal?: DesignConstraint;
    readonly vertical?: DesignConstraint;
    /** Explicitly leave or rejoin an auto-layout parent's flowing children. */
    readonly absolute?: boolean;
}
/** One layer has one coordinate space; batch positions share the save transaction and undo. */
export interface DesignPositionOperation extends DesignPositionChanges {
    readonly op: typeof DesignOperationKind.Position;
    readonly id: string;
    readonly pageId: string;
}
/** A selected flowing child changes its sibling slot without leaving automatic layout. */
export interface DesignFlowReorder {
    readonly id: string;
    readonly index: number;
}
/** Rotates topmost selected layers together around a world pivot; omitted pivots use their combined bounds. */
export interface DesignRotateOperation {
    readonly op: typeof DesignOperationKind.Rotate;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly angle: number;
    readonly pivotX?: number;
    readonly pivotY?: number;
}
/** Uniform artwork scaling preserves text and effect metrics, unlike resizing a container. */
export interface DesignScaleOperation {
    readonly op: typeof DesignOperationKind.Scale;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly factor: number;
    readonly pivotX?: number;
    readonly pivotY?: number;
}
/** Move a selection from one original scene, optionally reordering selected flow children in the same edit. */
export interface DesignTranslateOperation {
    readonly op: typeof DesignOperationKind.Translate;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly dx: number;
    readonly dy: number;
    readonly reorders?: readonly DesignFlowReorder[];
}
/** Reparent or reorder without breaking both sides of the tree. */
export interface DesignMove {
    readonly op: typeof DesignOperationKind.Move;
    readonly id: string;
    readonly parentId: string | null;
    readonly pageId: string;
    readonly index: number;
}
/** Delete a subtree and its anchored comments and prototype links. */
export interface DesignRemove {
    readonly op: typeof DesignOperationKind.Remove;
    readonly id: string;
}
/** Create, rename or remove a page. Root lists are managed by tree operations. */
export interface DesignPageOperation {
    readonly op: typeof DesignOperationKind.Page;
    readonly id: string;
    readonly name: string | null;
    readonly background: string;
}
/** Document properties and supporting design-system or collaboration records. */
export interface DesignMetadata {
    readonly op: typeof DesignOperationKind.Metadata;
    readonly name?: string;
    readonly tokens?: readonly DesignToken[];
    readonly interactions?: readonly DesignInteraction[];
    readonly comments?: readonly DesignComment[];
}
/** A transaction can contain different operation types. */
export type DesignOperation =
    | DesignInsert
    | DesignUpdate
    | DesignResizeOperation
    | DesignPositionOperation
    | DesignTranslateOperation
    | DesignRotateOperation
    | DesignScaleOperation
    | DesignTextOperation
    | DesignMove
    | DesignRemove
    | DesignPageOperation
    | DesignMetadata;
/** Before and after images provide conflict-safe undo and bounded deltas. */
export interface DesignEntityChange<T> {
    readonly id: string;
    readonly before: T | null;
    readonly after: T | null;
}
/** Supporting metadata is independent of scene entity changes. */
export interface DesignMetadataState {
    readonly name: string;
    readonly tokens: readonly DesignToken[];
    readonly interactions: readonly DesignInteraction[];
    readonly comments: readonly DesignComment[];
}
/** A commit records only touched entities, with exact preconditions. */
export interface DesignChangeSet {
    readonly nodes: readonly DesignEntityChange<DesignNode>[];
    readonly pages: readonly DesignEntityChange<DesignPage>[];
    readonly metadata: DesignEntityChange<DesignMetadataState> | null;
}
/** Result of an atomic scene transaction, prior to assigning its durable revision. */
export interface DesignEditResult {
    readonly document: DesignDocument;
    readonly changes: DesignChangeSet;
}
