// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignCodec } from './DesignCodec.js';
import { DesignValues as V } from './DesignValues.js';
import { DesignSelectionIndex } from './DesignSelectionIndex.js';
import type { DesignDocument, DesignComment, DesignPage } from './DesignTypes.js';
import type { DesignCommentOperation, DesignCommentChanges } from './DesignOperationTypes.js';

/** Small feedback writes preserve saved note order, authors and every unrelated body. */
export class DesignCommentEdits {
    /** The authenticated writer supplies attribution; browser input cannot impersonate an author. */
    public static apply(
        document: DesignDocument,
        operation: DesignCommentOperation,
        actor: string | null,
    ): readonly DesignComment[] {
        const before: DesignComment | undefined = document.comments.find(
            (note: DesignComment): boolean => note.id === operation.id,
        );
        if (
            operation.pageId !== null &&
            !document.pages.some((page: DesignPage): boolean => page.id === operation.pageId)
        ) {
            throw new Error('Design page not found.');
        }
        if (before !== undefined) {
            this.#scope(document, before, operation.pageId);
        }
        if (operation.changes === null) {
            if (before === undefined) {
                throw new Error('Design comment not found.');
            }
            return document.comments.filter(
                (note: DesignComment): boolean => note.id !== operation.id,
            );
        }
        const changes: DesignCommentChanges = operation.changes;
        if (
            before === undefined &&
            (changes.nodeId === undefined ||
                changes.x === undefined ||
                changes.y === undefined ||
                changes.text === undefined ||
                actor === null)
        ) {
            throw new Error('A new comment requires nodeId, x, y, text and host attribution.');
        }
        const nodeId: string | null =
            changes.nodeId === undefined ? (before?.nodeId ?? null) : changes.nodeId;
        const after: DesignComment = DesignCodec.comment({
            id: operation.id,
            nodeId,
            ...(nodeId === null && operation.pageId !== null ? { pageId: operation.pageId } : {}),
            x: changes.x ?? before?.x,
            y: changes.y ?? before?.y,
            text: changes.text ?? before?.text,
            author: before?.author ?? V.text(actor),
            resolved: changes.resolved ?? before?.resolved ?? false,
        });
        this.#scope(document, after, operation.pageId);
        return before === undefined
            ? [...document.comments, after]
            : document.comments.map((note: DesignComment): DesignComment =>
                  note.id === after.id ? after : note,
              );
    }

    /** Feedback may reference locked artwork; its page and authored layer identity must still match. */
    static #scope(document: DesignDocument, note: DesignComment, pageId: string | null): void {
        if (note.nodeId !== null) {
            if (pageId === null) {
                throw new Error('Anchored feedback requires its authored page.');
            }
            new DesignSelectionIndex(document, pageId, [note.nodeId], true);
        } else if ((note.pageId ?? null) !== pageId) {
            throw new Error('Comment belongs to another page.');
        }
    }
}
