// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import {
    DesignFlow,
    DesignAlign,
    DesignSizing,
    DesignConstraint,
    type DesignLayout,
    type DesignPlacement,
} from './DesignTypes.js';

/** Responsive layout settings remain portable between agent tooling and the browser. */
export class DesignLayoutCodec {
    /** Container layout. */
    public static layout(raw: unknown): DesignLayout {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'flow',
            'wrap',
            'gap',
            'rowGap',
            'padding',
            'align',
            'justify',
            'columns',
            'clip',
        ]);
        const padding: Readonly<Record<string, unknown>> = V.record(value['padding'], [
            'top',
            'right',
            'bottom',
            'left',
        ]);
        return {
            flow: V.choice(value['flow'], Object.values(DesignFlow)),
            wrap: V.boolean(value['wrap']),
            gap: V.number(value['gap'], 0, 10000),
            rowGap: V.number(value['rowGap'], 0, 10000),
            padding: {
                top: V.number(padding['top'], 0, 10000),
                right: V.number(padding['right'], 0, 10000),
                bottom: V.number(padding['bottom'], 0, 10000),
                left: V.number(padding['left'], 0, 10000),
            },
            align: V.choice(value['align'], Object.values(DesignAlign)),
            justify: V.choice(value['justify'], Object.values(DesignAlign)),
            columns: V.number(value['columns'], 1, 256, true),
            clip: V.boolean(value['clip']),
        };
    }
    /** Child placement and resizing constraints. */
    public static placement(raw: unknown): DesignPlacement {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'width',
            'height',
            'absolute',
            'horizontal',
            'vertical',
            'minWidth',
            'maxWidth',
            'minHeight',
            'maxHeight',
            'columnSpan',
            'rowSpan',
        ]);
        const result: DesignPlacement = {
            width: V.choice(value['width'], Object.values(DesignSizing)),
            height: V.choice(value['height'], Object.values(DesignSizing)),
            absolute: V.boolean(value['absolute']),
            horizontal: V.choice(value['horizontal'], Object.values(DesignConstraint)),
            vertical: V.choice(value['vertical'], Object.values(DesignConstraint)),
            minWidth: V.number(value['minWidth'], 0),
            maxWidth: V.number(value['maxWidth'], 0),
            minHeight: V.number(value['minHeight'], 0),
            maxHeight: V.number(value['maxHeight'], 0),
            columnSpan: V.number(value['columnSpan'], 1, 256, true),
            rowSpan: V.number(value['rowSpan'], 1, 256, true),
        };
        if (result.minWidth > result.maxWidth || result.minHeight > result.maxHeight) {
            throw new Error('Minimum layer size exceeds its maximum');
        }
        return result;
    }
}
