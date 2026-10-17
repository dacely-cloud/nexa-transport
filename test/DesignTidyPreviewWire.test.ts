// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { Method } from '../src/protocol/Protocol.js';
import { DesignLayoutPreviewCodec } from '../src/design/DesignLayoutPreviewCodec.js';
import type { DesignLayoutPreviewCanvasRequest } from '../src/design/DesignLayoutPreviewTypes.js';
import type { DesignTidyOperation } from '../src/design/DesignOperationTypes.js';

test('generated preview RPC and portable codec admit the same compact Tidy operation', (): void => {
    const operation: DesignTidyOperation = {
        op: 'tidy',
        pageId: 'page-1',
        selection: ['a', 'b', 'c'],
        columns: 3,
        gapX: -24,
        gapY: 32,
    };
    const request: DesignLayoutPreviewCanvasRequest = {
        action: 'canvas',
        key: null,
        operation,
        params: {
            id: 'design',
            revision: '2',
            pageId: 'page-1',
            includeIds: [],
            cursor: null,
            limit: 1,
        },
    };
    expect(methodValidators[Method.DesignLayoutPreview].params(request)).toBe(true);
    expect(DesignLayoutPreviewCodec.request(request)).toEqual(request);
    for (const changed of [
        { ...operation, columns: 'three' },
        { ...operation, gapX: '-24' },
        { ...operation, selection: 'a' },
    ]) {
        expect(
            methodValidators[Method.DesignLayoutPreview].params({ ...request, operation: changed }),
        ).toBe(false);
        expect((): void => {
            DesignLayoutPreviewCodec.request({ ...request, operation: changed });
        }).toThrow();
    }
    for (const changed of [
        { ...operation, columns: 0 },
        { ...operation, gapX: -10001 },
        { ...operation, selection: ['a'] },
        { ...operation, content: 'Source replacement' },
    ]) {
        expect((): void => {
            DesignLayoutPreviewCodec.request({ ...request, operation: changed });
        }).toThrow();
    }
    expect((): void => {
        DesignLayoutPreviewCodec.request({
            ...request,
            params: { ...request.params, includeIds: ['copy'] },
        });
    }).toThrow('hydrate');
});
