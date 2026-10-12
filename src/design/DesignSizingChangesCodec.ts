// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignSizing } from './DesignTypes.js';
import type { DesignSizingChanges } from './DesignOperationTypes.js';

/** Partial sizing edits retain omitted modes, limits, grid spans and constraint baselines. */
export class DesignSizingChangesCodec {
    /** Cross-field limits are checked against the real saved placement before committing. */
    public static parse(raw: unknown): DesignSizingChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply at least one sizing change.');
        }
        return {
            ...(value['width'] === undefined
                ? {}
                : { width: V.choice(value['width'], Object.values(DesignSizing)) }),
            ...(value['height'] === undefined
                ? {}
                : { height: V.choice(value['height'], Object.values(DesignSizing)) }),
            ...(value['minWidth'] === undefined
                ? {}
                : { minWidth: V.number(value['minWidth'], 0, 100000) }),
            ...(value['maxWidth'] === undefined
                ? {}
                : { maxWidth: V.number(value['maxWidth'], 0, 100000) }),
            ...(value['minHeight'] === undefined
                ? {}
                : { minHeight: V.number(value['minHeight'], 0, 100000) }),
            ...(value['maxHeight'] === undefined
                ? {}
                : { maxHeight: V.number(value['maxHeight'], 0, 100000) }),
        };
    }
}
