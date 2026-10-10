// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    DesignNode,
    DesignPage,
    DesignToken,
    DesignInteraction,
    DesignComment,
    DesignBox,
} from './DesignTypes.js';
import type { DesignOperation } from './DesignOperationTypes.js';

/** Scene entities have independent transport identities. */
export const DesignRecordKind = {
    Node: 'node',
    Page: 'page',
    Token: 'token',
    Interaction: 'interaction',
    Comment: 'comment',
} as const;
/** Entity family. */
export type DesignRecordKind = (typeof DesignRecordKind)[keyof typeof DesignRecordKind];
/** One complete entity, or a tombstone in a delta page. */
export type DesignRecord =
    | DesignNodeRecord
    | DesignPageRecord
    | DesignTokenRecord
    | DesignInteractionRecord
    | DesignCommentRecord;
/** Layer record. */
export interface DesignNodeRecord {
    readonly kind: typeof DesignRecordKind.Node;
    readonly id: string;
    readonly value: DesignNode | null;
}
/** Page record. */
export interface DesignPageRecord {
    readonly kind: typeof DesignRecordKind.Page;
    readonly id: string;
    readonly value: DesignPage | null;
}
/** Token record. */
export interface DesignTokenRecord {
    readonly kind: typeof DesignRecordKind.Token;
    readonly id: string;
    readonly value: DesignToken | null;
}
/** Prototype record. */
export interface DesignInteractionRecord {
    readonly kind: typeof DesignRecordKind.Interaction;
    readonly id: string;
    readonly value: DesignInteraction | null;
}
/** Comment record. */
export interface DesignCommentRecord {
    readonly kind: typeof DesignRecordKind.Comment;
    readonly id: string;
    readonly value: DesignComment | null;
}
/** Tiny management projection. Timestamps and revisions retain full integer precision. */
export interface DesignSummary {
    readonly id: string;
    readonly name: string;
    readonly revision: string;
    readonly nodeCount: number;
    readonly pageCount: number;
    readonly updatedAt: string;
}
/** Empty document creation is durable and idempotent. */
export interface DesignCreateRequest {
    readonly id: string;
    readonly name: string;
    readonly commandId: string;
}
/** Record and UTF-16 character offsets allow large entities to remain bounded on the wire. */
export interface DesignCursor {
    readonly record: number;
    readonly character: number;
}
/** Strictly revision-pinned pagination prevents merging chunks from different documents. */
export interface DesignReadRequest {
    readonly id: string;
    readonly revision: string | null;
    readonly cursor: DesignCursor | null;
    readonly limit: number;
}
/** Large records use contiguous fragments, decoded only after complete assembly. */
export interface DesignRecordFragment {
    readonly kind: DesignRecordKind;
    readonly id: string;
    readonly offset: number;
    readonly total: number;
    readonly text: string;
}
/** Independently bounded entity page with at most one partial record. */
export interface DesignRecordPage {
    readonly summary: DesignSummary;
    readonly records: readonly DesignRecord[];
    readonly fragment: DesignRecordFragment | null;
    readonly nextCursor: DesignCursor | null;
}
/** Patch uses optimistic concurrency and a durable retry identity. */
export interface DesignSaveRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
    readonly operations: readonly DesignOperation[];
}
/** Undo names the committed transaction rather than accepting an untrusted state snapshot. */
export interface DesignUndoRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
    readonly targetCommandId: string;
}
/** Commit acknowledgements contain no large text or scene snapshot. */
export interface DesignReceipt {
    readonly summary: DesignSummary;
    readonly commandId: string;
    readonly previousRevision: string | null;
    readonly actor: string;
    readonly undoable: boolean;
}
/** Owner-scoped document listing. */
export interface DesignListRequest {
    readonly after: string | null;
    readonly limit: number;
}
/** Bounded library page. */
export interface DesignListPage {
    readonly items: readonly DesignSummary[];
    readonly nextAfter: string | null;
}
/** Users and agents consume the same durable revision journal. */
export interface DesignEventsRequest {
    readonly id: string;
    readonly afterRevision: string;
    readonly limit: number;
}
/** A missed retained revision requires a fresh paged snapshot. */
export interface DesignEventsPage {
    readonly summary: DesignSummary;
    readonly commits: readonly DesignReceipt[];
    readonly reset: boolean;
}
/** Changed entities exclude undo preimages. */
export interface DesignChangesRequest {
    readonly id: string;
    readonly commandId: string;
    readonly cursor: DesignCursor | null;
    readonly limit: number;
}
/** Agent geometry inspection is revision-pinned and separately paged. */
export interface DesignLayoutRequest {
    readonly id: string;
    readonly revision: string;
    readonly pageId: string;
    readonly offset: number;
    readonly limit: number;
}
/** Native geometry uses the same layout engine as the canvas. */
export interface DesignLayoutPage {
    readonly summary: DesignSummary;
    readonly boxes: readonly DesignBox[];
    readonly nextOffset: number | null;
}

/** Revision-fenced document removal with an exact retry identity. */
export interface DesignDeleteRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
}
/** Host confirmation that the exact document revision was removed. */
export interface DesignDeleteReceipt {
    readonly id: string;
    readonly revision: string;
    readonly deleted: true;
}
