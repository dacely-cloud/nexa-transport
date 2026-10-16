// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignLayoutPreviewCodec } from '../src/design/DesignLayoutPreviewCodec.js';
import type {
    DesignLayoutPreviewCanvasRequest,
    DesignLayoutPreviewRequest,
} from '../src/design/DesignLayoutPreviewTypes.js';

it('round-trips resize drafts through the advertised wire union and closed portable decoder', (): void => {
    const request: DesignLayoutPreviewCanvasRequest = {
        action: 'canvas',
        key: null,
        operation: {
            op: 'resize',
            pageId: 'page-1',
            selection: ['frame'],
            x: 24,
            y: 32,
            width: 320,
            height: 240,
        },
        params: {
            id: 'design',
            revision: '7',
            pageId: 'page-1',
            cursor: null,
            includeIds: [],
            limit: 128,
        },
    };
    expect(methodValidators[Method.DesignLayoutPreview].params(request)).toBe(true);
    const raw: unknown = JSON.parse(JSON.stringify(request));
    const decoded: DesignLayoutPreviewRequest = DesignLayoutPreviewCodec.request(raw);
    expect(decoded).toEqual(request);
    expect(
        methodValidators[Method.DesignLayoutPreview].params({
            ...request,
            operation: { ...request.operation, selection: 'frame' },
        }),
    ).toBe(false);
    for (const invalid of [
        { ...request, operation: { ...request.operation, text: 'private source' } },
        { ...request, operation: { ...request.operation, width: Infinity } },
        { ...request, params: { ...request.params, includeIds: ['caption'] } },
        { ...request, operation: { op: 'text', id: 'caption', content: 'replacement' } },
    ]) {
        expect((): DesignLayoutPreviewRequest =>
            DesignLayoutPreviewCodec.request(invalid),
        ).toThrow();
    }
});
