// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignImageTransformCodec } from './DesignImageTransformCodec.js';
import { DesignImageAdjustmentCodec } from './DesignImageAdjustmentCodec.js';
import { DesignImageFit, type DesignImageFraming } from './DesignTypes.js';

/** Validates the same bounded framing for image layers, fills and strokes. */
export class DesignImageFramingCodec {
    /** Framing is a complete record; unknown fields and executable accessors are rejected. */
    public static parse(raw: unknown): DesignImageFraming {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            [
                'fit',
                'cropX',
                'cropY',
                'scale',
                'rotation',
                'flipX',
                'flipY',
                'transform',
                'adjustments',
            ],
            ['fit', 'cropX', 'cropY', 'scale'],
        );
        return {
            fit: V.choice(value['fit'], Object.values(DesignImageFit)),
            cropX: V.number(value['cropX'], -1, 1),
            cropY: V.number(value['cropY'], -1, 1),
            scale: V.number(value['scale'], 0.01, 100),
            ...(value['adjustments'] === undefined
                ? {}
                : {
                      adjustments:
                          value['adjustments'] === null
                              ? null
                              : DesignImageAdjustmentCodec.parse(value['adjustments']),
                  }),
            ...(value['rotation'] === undefined
                ? {}
                : { rotation: V.number(value['rotation'], -360, 360) }),
            ...(value['flipX'] === undefined ? {} : { flipX: V.boolean(value['flipX']) }),
            ...(value['flipY'] === undefined ? {} : { flipY: V.boolean(value['flipY']) }),
            ...(value['transform'] === undefined
                ? {}
                : {
                      transform:
                          value['transform'] === null
                              ? null
                              : DesignImageTransformCodec.parse(value['transform']),
                  }),
        };
    }
}
