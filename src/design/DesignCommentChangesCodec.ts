// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import type { DesignCommentChanges } from './DesignOperationTypes.js';

/** Closed per-note patches keep author attribution and unrelated saved bodies out of client writes. */
export class DesignCommentChangesCodec {
    /** Omitted fields preserve current values; an empty patch cannot accidentally create a note. */
    public static changes(raw: unknown): DesignCommentChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['nodeId', 'x', 'y', 'text', 'resolved'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Specify at least one comment property.');
        }
        return {
            ...(Object.hasOwn(value, 'nodeId') ? { nodeId: V.optionalId(value['nodeId']) } : {}),
            ...(Object.hasOwn(value, 'x') ? { x: V.number(value['x']) } : {}),
            ...(Object.hasOwn(value, 'y') ? { y: V.number(value['y']) } : {}),
            ...(Object.hasOwn(value, 'text') ? { text: V.text(value['text'], 8000) } : {}),
            ...(Object.hasOwn(value, 'resolved') ? { resolved: V.boolean(value['resolved']) } : {}),
        };
    }
}
