// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignMaskMode, type DesignMask } from './DesignMaskTypes.js';
import { DesignValues as V } from './DesignValues.js';

/** Validates the mask record at document and transaction trust boundaries. */
export class DesignMaskCodec {
    /** Empty sources deliberately hide content until an editable child is assigned. */
    public static parse(raw: unknown): DesignMask {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['mode', 'sourceId']);
        return {
            mode: V.choice(value['mode'], Object.values(DesignMaskMode)),
            sourceId: V.optionalId(value['sourceId']),
        };
    }
}
