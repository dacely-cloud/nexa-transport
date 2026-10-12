// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignSvgImport } from '../src/design/DesignSvgImport.js';
import { DesignSvgImportCodec } from '../src/design/DesignSvgImportCodec.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import type { DesignSvgImportRequest } from '../src/design/DesignSvgImportTypes.js';
import type { DesignDocument } from '../src/design/DesignTypes.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';

const request: DesignSvgImportRequest = {
    id: 'svg',
    expectedRevision: '1',
    commandId: 'import',
    pageId: 'page-1',
    parentId: null,
    index: null,
    x: 40,
    y: 20,
    name: 'SVG artboard',
    source: '<svg width="100" height="80"><path id="shape" d="M10 10H90V70H10Z" fill="rebeccapurple"/></svg>',
};
it('the existing typed socket supports the new bounded SVG import request', (): void => {
    expect(Method.DesignSvgImport).toBe('design.svg.import');
    expect(methodValidators[Method.DesignSvgImport].params(request)).toBe(true);
    expect(methodValidators[Method.DesignSvgImport].params({ ...request, source: 123 })).toBe(
        false,
    );
    expect((): DesignSvgImportRequest =>
        DesignSvgImportCodec.request({ ...request, owner: 'bob' }),
    ).toThrow();
});
it('portable imports preserve their source document and undo the complete editable forest', async (): Promise<void> => {
    const before: DesignDocument = DesignDefaults.document('svg');
    const result: DesignEditResult = await DesignSvgImport.apply(
        before,
        request,
        (key: string): string => 'svg-' + key.replaceAll(':', '-'),
    );
    expect(result.document.nodes).toHaveLength(2);
    expect(result.document.nodes[0]).toMatchObject({
        kind: 'frame',
        x: 40,
        y: 20,
        width: 100,
        height: 80,
    });
    expect(result.document.nodes[1]?.style.fills[0]?.color).toBe('#663399');
    expect(result.selection).toEqual(['svg-root']);
    expect(DesignEdits.restore(result.document, result.changes).document).toEqual(before);
});
