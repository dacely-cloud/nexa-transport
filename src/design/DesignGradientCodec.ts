// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import type {
    DesignGradientTransform,
    DesignGradientTransformChanges,
} from './DesignGradientTypes.js';

/** Closed finite coordinate records cannot carry arbitrary CSS or unrelated source bodies. */
export class DesignGradientCodec {
    /** Full saved transforms retain all six normalized coordinates. */
    public static parse(raw: unknown): DesignGradientTransform {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'startX',
            'startY',
            'endX',
            'endY',
            'axisX',
            'axisY',
        ]);
        return {
            startX: V.number(value['startX'], -10, 10),
            startY: V.number(value['startY'], -10, 10),
            endX: V.number(value['endX'], -10, 10),
            endY: V.number(value['endY'], -10, 10),
            axisX: V.number(value['axisX'], -10, 10),
            axisY: V.number(value['axisY'], -10, 10),
        };
    }
    /** A partial coordinate edit is nonempty and bounded just like its persisted transform. */
    public static changes(raw: unknown): DesignGradientTransformChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['startX', 'startY', 'endX', 'endY', 'axisX', 'axisY'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply at least one gradient coordinate.');
        }
        return {
            ...(value['startX'] === undefined
                ? {}
                : { startX: V.number(value['startX'], -10, 10) }),
            ...(value['startY'] === undefined
                ? {}
                : { startY: V.number(value['startY'], -10, 10) }),
            ...(value['endX'] === undefined ? {} : { endX: V.number(value['endX'], -10, 10) }),
            ...(value['endY'] === undefined ? {} : { endY: V.number(value['endY'], -10, 10) }),
            ...(value['axisX'] === undefined ? {} : { axisX: V.number(value['axisX'], -10, 10) }),
            ...(value['axisY'] === undefined ? {} : { axisY: V.number(value['axisY'], -10, 10) }),
        };
    }
}
