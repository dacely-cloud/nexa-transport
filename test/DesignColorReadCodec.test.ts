// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignColorReadCodec } from '../src/design/DesignColorReadCodec.js';
import type {
    DesignColorReadRequest,
    DesignColorReadPage,
} from '../src/design/DesignColorReadTypes.js';

const request: DesignColorReadRequest = {
    id: 'doc',
    revision: '9007199254740993',
    pageId: 'page',
    selection: ['a', 'b'],
    offset: 0,
    limit: 24,
};
const page: DesignColorReadPage = {
    id: request.id,
    revision: request.revision,
    pageId: request.pageId,
    selectionSha256: 'a'.repeat(64),
    offset: 0,
    total: 2,
    colors: [{ color: '#112233', layers: 10 }],
    nextOffset: 1,
};
it('retains decimal revisions and admits bounded body-free color pages', (): void => {
    expect(DesignColorReadCodec.request(request)).toEqual(request);
    expect(DesignColorReadCodec.page(page)).toEqual(page);
    expect(DesignColorReadCodec.page({ ...page, offset: 1, nextOffset: null })).toMatchObject({
        offset: 1,
    });
    expect(
        DesignColorReadCodec.page({ ...page, colors: [], total: 0, nextOffset: null }),
    ).toMatchObject({ colors: [] });
});
it('rejects invalid fields, unbounded or duplicate selections, colors and incoherent continuation metadata', (): void => {
    for (const invalid of [
        { ...request, owner: 'other' },
        { ...request, selection: [] },
        { ...request, selection: ['a', 'a'] },
        {
            ...request,
            selection: Array.from(
                { length: 129 },
                (_: unknown, index: number): string => 'a' + String(index),
            ),
        },
        { ...request, limit: 65 },
        { ...request, offset: -1 },
        { ...request, revision: null },
    ]) {
        expect((): void => {
            DesignColorReadCodec.request(invalid);
        }).toThrow();
    }
    for (const invalid of [
        { ...page, content: 'private' },
        { ...page, selectionSha256: 'bad' },
        { ...page, nextOffset: 0 },
        { ...page, nextOffset: 2 },
        { ...page, nextOffset: null },
        { ...page, colors: [] },
        { ...page, colors: [{ color: 'red', layers: 1 }] },
        { ...page, colors: [{ color: '#112233', layers: 10001 }] },
        {
            ...page,
            colors: [
                { color: '#112233', layers: 1 },
                { color: '#112233', layers: 2 },
            ],
            nextOffset: null,
        },
    ]) {
        expect((): void => {
            DesignColorReadCodec.page(invalid);
        }).toThrow();
    }
});
