// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignCommentReadCodec as Codec } from '../src/design/DesignCommentReadCodec.js';
import type {
    DesignCommentsRequest,
    DesignCommentsPage,
    DesignCommentTextRequest,
    DesignCommentTextPage,
} from '../src/design/DesignCommentReadTypes.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

const request: DesignCommentsRequest = {
    id: 'doc',
    revision: '9007199254740993',
    pageId: 'page-1',
    resolved: null,
    offset: 0,
    limit: 32,
};
const page: DesignCommentsPage = {
    summary: {
        id: request.id,
        name: 'Feedback',
        revision: request.revision,
        nodeCount: 2,
        pageCount: 1,
        updatedAt: '9007199254740993',
    },
    pageId: request.pageId,
    resolved: null,
    offset: 0,
    total: 2,
    comments: [
        {
            id: 'note',
            nodeId: 'button',
            pageId: 'page-1',
            x: 10,
            y: 20,
            author: 'Owner',
            resolved: false,
            characters: 8000,
            sha256: 'a'.repeat(64),
            preview: 'a'.repeat(159),
        },
    ],
    nextOffset: 1,
};

test('portable feedback decoding and generated wire validators retain exact revisions and selected scopes', (): void => {
    expect(
        Codec.commentsRequest({
            id: request.id,
            revision: request.revision,
            pageId: request.pageId,
        }),
    ).toEqual(request);
    expect(Codec.commentsPage(page)).toEqual(page);
    expect(methodValidators[Method.DesignComments].params(request)).toBe(true);
    expect(methodValidators[Method.DesignComments].result(page)).toBe(true);
    const selected: DesignCommentTextRequest = {
        id: request.id,
        revision: request.revision,
        pageId: null,
        commentId: 'note',
        offset: 0,
        limit: 2000,
    };
    expect(
        Codec.textRequest({
            id: request.id,
            revision: request.revision,
            pageId: null,
            commentId: 'note',
        }),
    ).toEqual(selected);
    const body: DesignCommentTextPage = {
        summary: page.summary,
        pageId: 'page-1',
        commentId: 'note',
        offset: 0,
        content: '😀',
        total: 8000,
        sha256: 'a'.repeat(64),
        nextOffset: 2,
    };
    expect(Codec.textPage(body)).toEqual(body);
    expect(methodValidators[Method.DesignCommentText].params(selected)).toBe(true);
    expect(methodValidators[Method.DesignCommentText].result(body)).toBe(true);
    expect(Codec.textPage({ ...body, offset: 8000, content: '', nextOffset: null })).toMatchObject({
        content: '',
        nextOffset: null,
    });
});

test('portable feedback boundaries reject owner injection, invalid cursors and mixed page summaries', (): void => {
    for (const invalid of [
        { ...request, owner: 'another' },
        { ...request, revision: Number.MAX_SAFE_INTEGER + 2 },
        { ...request, resolved: 'false' },
        { ...request, pageId: undefined },
        { ...request, limit: 129 },
    ]) {
        expect((): DesignCommentsRequest => Codec.commentsRequest(invalid)).toThrow();
    }
    for (const invalid of [
        { ...page, nextOffset: null },
        { ...page, nextOffset: 2 },
        { ...page, comments: [] },
        { ...page, pageId: 'page-2' },
        { ...page, resolved: true },
        { ...page, comments: [page.comments[0], page.comments[0]], nextOffset: null },
        { ...page, records: [] },
    ]) {
        expect((): DesignCommentsPage => Codec.commentsPage(invalid)).toThrow();
    }
    const body: DesignCommentTextPage = {
        summary: page.summary,
        pageId: null,
        commentId: 'note',
        offset: 0,
        content: 'a',
        total: 8000,
        sha256: 'a'.repeat(64),
        nextOffset: 1,
    };
    for (const invalid of [
        { ...body, content: '\ud800' },
        { ...body, nextOffset: null },
        { ...body, sha256: 'bad' },
        { ...body, content: 'a'.repeat(4001) },
    ]) {
        expect((): DesignCommentTextPage => Codec.textPage(invalid)).toThrow();
    }
});
