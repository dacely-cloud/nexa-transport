// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignImageSamplingAlign, type DesignImageSampling } from './DesignImageSamplingTypes.js';

/** Source crops are bounded metadata, never replacement pixels or executable image references. */
export class DesignImageSamplingCodec {
    /** The complete small record preserves source fitting across native storage and exports. */
    public static parse(raw: unknown): DesignImageSampling {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'aspect',
            'alignX',
            'alignY',
        ]);
        return {
            aspect: V.number(value['aspect'], 1e-7, 1e7),
            alignX: V.choice(value['alignX'], Object.values(DesignImageSamplingAlign)),
            alignY: V.choice(value['alignY'], Object.values(DesignImageSamplingAlign)),
        };
    }
}
