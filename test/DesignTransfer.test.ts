// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignTransferCodec } from '../src/design/DesignTransferCodec.js';
import type { DesignTransferRequest } from '../src/design/DesignTransferTypes.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

const request: DesignTransferRequest = {
    id: 'target',
    expectedRevision: '5',
    commandId: 'copy',
    sourceId: 'source',
    sourceRevision: '7',
    sourcePageId: 'page-1',
    selection: ['hero'],
    pageId: 'page-2',
    parentId: null,
    x: 48,
    y: 48,
};

it('exposes the native reference-only transfer method with exact transport contracts', (): void => {
    expect(Method.DesignTransfer).toBe('design.transfer');
    expect(methodValidators[Method.DesignTransfer].params(request)).toBe(true);
    expect(DesignTransferCodec.request(request)).toEqual(request);
    expect(JSON.stringify(request).length).toBeLessThan(400);
    expect(methodValidators[Method.DesignTransfer].params({ ...request, sourceRevision: 7 })).toBe(
        false,
    );
    expect(
        methodValidators[Method.DesignTransfer].params({ ...request, selection: undefined }),
    ).toBe(false);
    expect((): DesignTransferRequest =>
        DesignTransferCodec.request({ ...request, sourceText: 'body' }),
    ).toThrow('Unexpected');
    expect((): DesignTransferRequest =>
        DesignTransferCodec.request({ ...request, selection: [] }),
    ).toThrow('Select');
    expect((): DesignTransferRequest =>
        DesignTransferCodec.request({ ...request, x: Infinity }),
    ).toThrow();
});
