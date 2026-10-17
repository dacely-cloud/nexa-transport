// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import type { DesignSummary } from './DesignRequests.js';
import type {
    DesignCommentsRequest,
    DesignCommentsPage,
    DesignCommentSummary,
    DesignCommentTextRequest,
    DesignCommentTextPage,
} from './DesignCommentReadTypes.js';

/** Portable closed boundaries distinguish excerpts from complete editable note bodies. */
export class DesignCommentReadCodec {
    /** Omitted paging is bounded; explicit invalid values never acquire defaults. */
    public static commentsRequest(raw: unknown): DesignCommentsRequest {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['id', 'revision', 'pageId', 'resolved', 'offset', 'limit'],
            ['id', 'revision', 'pageId'],
        );
        return {
            id: V.id(value['id']),
            revision: V.revision(value['revision']),
            pageId: this.#page(value['pageId']),
            resolved: Object.hasOwn(value, 'resolved') ? this.#resolved(value['resolved']) : null,
            offset: Object.hasOwn(value, 'offset') ? V.number(value['offset'], 0, 10000, true) : 0,
            limit: Object.hasOwn(value, 'limit') ? V.number(value['limit'], 1, 128, true) : 32,
        };
    }

    /** UTF-16 windows are capped independently of the transport byte budget. */
    public static textRequest(raw: unknown): DesignCommentTextRequest {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['id', 'revision', 'pageId', 'commentId', 'offset', 'limit'],
            ['id', 'revision', 'pageId', 'commentId'],
        );
        return {
            id: V.id(value['id']),
            revision: V.revision(value['revision']),
            pageId: this.#page(value['pageId']),
            commentId: V.id(value['commentId']),
            offset: Object.hasOwn(value, 'offset') ? V.number(value['offset'], 0, 8000, true) : 0,
            limit: Object.hasOwn(value, 'limit') ? V.number(value['limit'], 2, 4000, true) : 2000,
        };
    }

    /** Reject truncated, duplicate, mismatched-scope or oversized metadata pages before publication. */
    public static commentsPage(raw: unknown): DesignCommentsPage {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'summary',
            'pageId',
            'resolved',
            'offset',
            'total',
            'comments',
            'nextOffset',
        ]);
        const pageId: string | null = this.#page(value['pageId']);
        const resolved: boolean | null = this.#resolved(value['resolved']);
        const offset: number = V.number(value['offset'], 0, 10000, true);
        const total: number = V.number(value['total'], offset, 10000, true);
        const comments: readonly DesignCommentSummary[] = V.list(
            value['comments'],
            128,
            (entry: unknown): DesignCommentSummary => this.comment(entry),
        );
        if (
            new Set(comments.map((note: DesignCommentSummary): string => note.id)).size !==
                comments.length ||
            comments.some(
                (note: DesignCommentSummary): boolean =>
                    (pageId !== null && note.pageId !== pageId) ||
                    (resolved !== null && note.resolved !== resolved),
            )
        ) {
            throw new Error('Comment metadata does not match its declared scope.');
        }
        const page: DesignCommentsPage = {
            summary: this.#summary(value['summary']),
            pageId,
            resolved,
            offset,
            total,
            comments,
            nextOffset: this.#next(value['nextOffset'], offset, comments.length, total),
        };
        this.#bounded(page);
        return page;
    }

    /** One note summary carries a bounded literal preview and full-body identity, never a text replacement. */
    public static comment(raw: unknown): DesignCommentSummary {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'nodeId',
            'pageId',
            'x',
            'y',
            'author',
            'resolved',
            'characters',
            'sha256',
            'preview',
        ]);
        const characters: number = V.number(value['characters'], 1, 8000, true);
        const preview: string = V.text(value['preview'], 160, true);
        const nodeId: string | null = V.optionalId(value['nodeId']);
        const pageId: string | null = this.#page(value['pageId']);
        if (
            (nodeId !== null && pageId === null) ||
            (characters <= 160
                ? preview.length !== characters
                : preview.length < 159 || preview.length > 160)
        ) {
            throw new Error('Invalid comment preview or anchor.');
        }
        return {
            id: V.id(value['id']),
            nodeId,
            pageId,
            x: V.number(value['x']),
            y: V.number(value['y']),
            author: V.text(value['author']),
            resolved: V.boolean(value['resolved']),
            characters,
            sha256: this.#hash(value['sha256']),
            preview,
        };
    }

    /** Body windows cannot silently truncate a continuation or introduce malformed Unicode. */
    public static textPage(raw: unknown): DesignCommentTextPage {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'summary',
            'pageId',
            'commentId',
            'offset',
            'content',
            'total',
            'sha256',
            'nextOffset',
        ]);
        const offset: number = V.number(value['offset'], 0, 8000, true);
        const total: number = V.number(value['total'], Math.max(1, offset), 8000, true);
        const content: string = V.text(value['content'], 4000, true);
        const page: DesignCommentTextPage = {
            summary: this.#summary(value['summary']),
            pageId: this.#page(value['pageId']),
            commentId: V.id(value['commentId']),
            offset,
            content,
            total,
            sha256: this.#hash(value['sha256']),
            nextOffset: this.#next(value['nextOffset'], offset, content.length, total),
        };
        this.#bounded(page);
        return page;
    }

    static #page(raw: unknown): string | null {
        return raw === null ? null : V.id(raw);
    }

    static #resolved(raw: unknown): boolean | null {
        return raw === null ? null : V.boolean(raw);
    }

    static #hash(raw: unknown): string {
        const hash: string = V.text(raw, 64);
        if (!/^[a-f0-9]{64}$/u.test(hash)) {
            throw new Error('Invalid comment source fingerprint.');
        }
        return hash;
    }

    static #next(raw: unknown, offset: number, count: number, total: number): number | null {
        const next: number | null = raw === null ? null : V.number(raw, offset + 1, total, true);
        if (
            offset + count > total ||
            (next === null
                ? offset + count !== total
                : count === 0 || next !== offset + count || next >= total)
        ) {
            throw new Error('Incomplete comment read continuation.');
        }
        return next;
    }

    static #summary(raw: unknown): DesignSummary {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'name',
            'revision',
            'nodeCount',
            'pageCount',
            'updatedAt',
        ]);
        const updatedAt: string = V.text(value['updatedAt'], 20);
        if (!/^(0|[1-9][0-9]*)$/u.test(updatedAt) || BigInt(updatedAt) > 9223372036854775807n) {
            throw new Error('Invalid comment document timestamp.');
        }
        return {
            id: V.id(value['id']),
            name: V.text(value['name']),
            revision: V.revision(value['revision']),
            nodeCount: V.number(value['nodeCount'], 0, 10000, true),
            pageCount: V.number(value['pageCount'], 1, 256, true),
            updatedAt,
        };
    }

    static #bounded(page: DesignCommentsPage | DesignCommentTextPage): void {
        if (new TextEncoder().encode(JSON.stringify(page)).byteLength > 192 * 1024) {
            throw new Error('Comment response exceeds its wire budget.');
        }
    }
}
