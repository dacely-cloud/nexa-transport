// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import type { DesignImageTransform } from './DesignImageTransformTypes.js';

/** Closed finite transforms retain reflected axes but reject unstable inverse sampling. */
export class DesignImageTransformCodec {
    /** Unit-coordinate bounds cannot contain executable fields or singular transformations. */
    public static parse(raw: unknown): DesignImageTransform {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'a',
            'b',
            'c',
            'd',
            'tx',
            'ty',
        ]);
        const result: DesignImageTransform = {
            a: V.number(value['a'], -1000, 1000),
            b: V.number(value['b'], -1000, 1000),
            c: V.number(value['c'], -1000, 1000),
            d: V.number(value['d'], -1000, 1000),
            tx: V.number(value['tx'], -1000, 1000),
            ty: V.number(value['ty'], -1000, 1000),
        };
        const axes: number = Math.hypot(result.a, result.b) * Math.hypot(result.c, result.d);
        if (axes < 1e-12 || Math.abs(result.a * result.d - result.b * result.c) <= axes * 1e-8) {
            throw new Error('Image transform must have independent nonzero axes.');
        }
        return result;
    }
}
