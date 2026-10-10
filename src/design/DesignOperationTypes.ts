// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
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
    Text: 'text',
    Move: 'move',
    Remove: 'remove',
    Page: 'page',
    Metadata: 'metadata',
} as const;
/** Editable properties exclude identity and tree links, which have dedicated operations. */
export interface DesignNodeChanges {
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
