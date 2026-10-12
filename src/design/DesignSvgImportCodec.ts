// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignSvgImportLimits, type DesignSvgImportRequest } from './DesignSvgImportTypes.js';

/** Closed imports keep ownership, revision and insertion position on the same native command. */
export class DesignSvgImportCodec {
    public static request(raw: unknown): DesignSvgImportRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'expectedRevision',
            'commandId',
            'pageId',
            'parentId',
            'index',
            'x',
            'y',
            'name',
            'source',
        ]);
        const source: string = V.text(value['source'], DesignSvgImportLimits.characters);
        if (BigInt(new TextEncoder().encode(source).byteLength) > DesignSvgImportLimits.bytes) {
            throw new Error('SVG source exceeds its 2 MiB import budget.');
        }
        return {
            id: V.id(value['id']),
            expectedRevision: V.revision(value['expectedRevision']),
            commandId: V.id(value['commandId']),
            pageId: V.id(value['pageId']),
            parentId: value['parentId'] === null ? null : V.id(value['parentId']),
            index: value['index'] === null ? null : V.number(value['index'], 0, 10000, true),
            x: V.number(value['x']),
            y: V.number(value['y']),
            name: V.text(value['name'], 512),
            source,
        };
    }
}
