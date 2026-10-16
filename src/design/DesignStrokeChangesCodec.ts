// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignStrokeCap, DesignStrokeJoin } from './DesignStrokeTypes.js';
import type { DesignStrokeChanges } from './DesignOperationTypes.js';

/** Compact borders preserve their paint and every unrelated layer property. */
export class DesignStrokeChangesCodec {
    /** Closed nonempty fields share the limits of saved stroke records. */
    public static parse(raw: unknown): DesignStrokeChanges | null {
        if (raw === null) {
            return null;
        }
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['width', 'dash', 'dashOffset', 'cap', 'join', 'miterLimit'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply at least one stroke property.');
        }
        return {
            ...(value['dashOffset'] === undefined
                ? {}
                : { dashOffset: V.number(value['dashOffset'], -1000000, 1000000) }),
            ...(value['width'] === undefined ? {} : { width: V.number(value['width'], 0, 1000) }),
            ...(value['dash'] === undefined
                ? {}
                : {
                      dash: V.list(value['dash'], 16, (entry: unknown): number =>
                          V.number(entry, 0.01, 1000),
                      ),
                  }),
            ...(value['cap'] === undefined
                ? {}
                : { cap: V.choice(value['cap'], Object.values(DesignStrokeCap)) }),
            ...(value['join'] === undefined
                ? {}
                : { join: V.choice(value['join'], Object.values(DesignStrokeJoin)) }),
            ...(value['miterLimit'] === undefined
                ? {}
                : { miterLimit: V.number(value['miterLimit'], 1, 100) }),
        };
    }
}
