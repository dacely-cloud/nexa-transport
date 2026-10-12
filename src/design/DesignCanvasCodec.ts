// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import type { DesignCanvasMetricsRequest } from './DesignCanvasTypes.js';

/** Revision-pinned metric selectors cannot inject an owner or an unbounded output size. */
export class DesignCanvasCodec {
    /** Metric cursors index the prepared width-specific measurement table. */
    public static metrics(raw: unknown): DesignCanvasMetricsRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'revision',
            'pageId',
            'includeIds',
            'offset',
            'limit',
        ]);
        return {
            id: V.id(value['id']),
            revision: V.revision(value['revision']),
            pageId: value['pageId'] === null ? null : V.id(value['pageId']),
            includeIds: V.list(value['includeIds'], 256, (entry: unknown): string => V.id(entry)),
            offset: V.number(value['offset'], 0, 100000, true),
            limit: V.number(value['limit'], 1, 128, true),
        };
    }
}
