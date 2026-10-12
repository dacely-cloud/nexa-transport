// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import type { DesignTransferRequest } from './DesignTransferTypes.js';

/** Exact bounded reference contract for cross-document copying. */
export class DesignTransferCodec {
    /** Validates both revision pins without accepting source bodies or owner overrides. */
    public static request(raw: unknown): DesignTransferRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'expectedRevision',
            'commandId',
            'sourceId',
            'sourceRevision',
            'sourcePageId',
            'selection',
            'pageId',
            'parentId',
            'x',
            'y',
        ]);
        const selection: readonly string[] = V.list(
            value['selection'],
            128,
            (id: unknown): string => V.id(id),
        );
        if (selection.length === 0 || new Set(selection).size !== selection.length) {
            throw new Error('Select 1 to 128 distinct source layers.');
        }
        return {
            id: V.id(value['id']),
            expectedRevision: V.revision(value['expectedRevision']),
            commandId: V.id(value['commandId']),
            sourceId: V.id(value['sourceId']),
            sourceRevision: V.revision(value['sourceRevision']),
            sourcePageId: V.id(value['sourcePageId']),
            selection,
            pageId: V.id(value['pageId']),
            parentId: V.optionalId(value['parentId']),
            x: V.number(value['x']),
            y: V.number(value['y']),
        };
    }
}
