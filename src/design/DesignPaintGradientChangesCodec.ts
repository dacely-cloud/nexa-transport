// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignGradientCodec } from './DesignGradientCodec.js';
import { DesignGradientGeometry } from './DesignGradientGeometry.js';
import type { DesignGradientStop } from './DesignTypes.js';
import type { DesignPaintGradientChanges } from './DesignOperationTypes.js';

/** Compact gradient geometry and bounded stops preserve other paint and layer fields. */
export class DesignPaintGradientChangesCodec {
    /** Non-gradient paint kinds, empty patches and unknown fields are rejected before mutation. */
    public static changes(raw: unknown): DesignPaintGradientChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['kind', 'angle', 'gradient', 'stops'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply at least one gradient property.');
        }
        return {
            ...(value['kind'] === undefined
                ? {}
                : {
                      kind: V.choice(value['kind'], DesignGradientGeometry.kinds),
                  }),
            ...(value['angle'] === undefined ? {} : { angle: V.number(value['angle'], -360, 360) }),
            ...(value['gradient'] === undefined
                ? {}
                : {
                      gradient:
                          value['gradient'] === null
                              ? null
                              : DesignGradientCodec.changes(value['gradient']),
                  }),
            ...(value['stops'] === undefined
                ? {}
                : {
                      stops: V.list(value['stops'], 64, (rawStop: unknown): DesignGradientStop => {
                          const stop: Readonly<Record<string, unknown>> = V.record(rawStop, [
                              'offset',
                              'color',
                          ]);
                          return {
                              offset: V.number(stop['offset'], 0, 1),
                              color: V.color(stop['color']),
                          };
                      }),
                  }),
        };
    }
}
