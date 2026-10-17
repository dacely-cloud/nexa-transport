// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSummary } from './DesignRequests.js';

/** Null selects the whole document or either resolution state; offsets index only matching notes. */
export interface DesignCommentsRequest {
    readonly id: string;
    readonly revision: string;
    readonly pageId: string | null;
    readonly resolved: boolean | null;
    readonly offset: number;
    readonly limit: number;
}

/** An excerpt identifies a note without being an editable replacement for its saved body. */
export interface DesignCommentSummary {
    readonly id: string;
    readonly nodeId: string | null;
    readonly pageId: string | null;
    readonly x: number;
    readonly y: number;
    readonly author: string;
    readonly resolved: boolean;
    readonly characters: number;
    readonly sha256: string;
    readonly preview: string;
}

/** Pages preserve saved note order and return an exact continuation shortened by byte budgets. */
export interface DesignCommentsPage {
    readonly summary: DesignSummary;
    readonly pageId: string | null;
    readonly resolved: boolean | null;
    readonly offset: number;
    readonly total: number;
    readonly comments: readonly DesignCommentSummary[];
    readonly nextOffset: number | null;
}

/** A concrete page checks ownership of the note's anchor; null selects any note in the owned document. */
export interface DesignCommentTextRequest {
    readonly id: string;
    readonly revision: string;
    readonly pageId: string | null;
    readonly commentId: string;
    readonly offset: number;
    readonly limit: number;
}

/** Only one selected body window travels; pageId names its actual page, or null for a legacy document-wide note. */
export interface DesignCommentTextPage {
    readonly summary: DesignSummary;
    readonly pageId: string | null;
    readonly commentId: string;
    readonly offset: number;
    readonly content: string;
    readonly total: number;
    readonly sha256: string;
    readonly nextOffset: number | null;
}

/** Comment summaries use the authenticated read-only connection. */
export interface DesignCommentsMethod {
    readonly params: DesignCommentsRequest;
    readonly result: DesignCommentsPage;
}

/** Body windows retain the same owner and saved-revision fence as their summary. */
export interface DesignCommentTextMethod {
    readonly params: DesignCommentTextRequest;
    readonly result: DesignCommentTextPage;
}
