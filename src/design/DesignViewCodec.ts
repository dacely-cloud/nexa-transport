// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignRequestCodec } from './DesignRequestCodec.js';
import type { DesignViewRequest } from './DesignViewTypes.js';

/** View selectors are validated at the authenticated RPC boundary before native storage is accessed. */
export class DesignViewCodec {
    /** Retains the normal read envelope and caps explicit hydration selectors. */
    public static request(raw: unknown): DesignViewRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'revision',
            'cursor',
            'limit',
            'pageId',
            'includeIds',
        ]);
        return {
            ...DesignRequestCodec.read({
                id: value['id'],
                revision: value['revision'],
                cursor: value['cursor'],
                limit: value['limit'],
            }),
            pageId: value['pageId'] === null ? null : V.id(value['pageId']),
            includeIds: V.list(value['includeIds'], 256, (entry: unknown): string => V.id(entry)),
        };
    }
}
