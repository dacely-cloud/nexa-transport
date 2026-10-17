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
            flow: V.choice(value['flow'], Object.values(DesignFlow), 'layout.flow'),
            wrap: V.boolean(value['wrap']),
            gap: V.number(value['gap'], -10000, 10000),
            rowGap: V.number(value['rowGap'], -10000, 10000),
            padding: {
                top: V.number(padding['top'], 0, 10000),
                right: V.number(padding['right'], 0, 10000),
                bottom: V.number(padding['bottom'], 0, 10000),
                left: V.number(padding['left'], 0, 10000),
            },
            align: V.choice(value['align'], Object.values(DesignAlign), 'layout.align'),
            justify: V.choice(value['justify'], Object.values(DesignAlign), 'layout.justify'),
            columns: V.number(value['columns'], 1, 256, true),
            clip: V.boolean(value['clip']),
        };
    }
    /** Child placement and resizing constraints. */
    public static placement(raw: unknown): DesignPlacement {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            [
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
                'referenceWidth',
                'referenceHeight',
                'contentReferenceWidth',
                'contentReferenceHeight',
            ],
            [
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
            ],
        );
        const result: DesignPlacement = {
            width: V.choice(value['width'], Object.values(DesignSizing), 'placement.width'),
            height: V.choice(value['height'], Object.values(DesignSizing), 'placement.height'),
            absolute: V.boolean(value['absolute']),
            horizontal: V.choice(
                value['horizontal'],
                Object.values(DesignConstraint),
                'placement.horizontal',
            ),
            vertical: V.choice(
                value['vertical'],
                Object.values(DesignConstraint),
                'placement.vertical',
            ),
            minWidth: V.number(value['minWidth'], 0),
            maxWidth: V.number(value['maxWidth'], 0),
            minHeight: V.number(value['minHeight'], 0),
            maxHeight: V.number(value['maxHeight'], 0),
            columnSpan: V.number(value['columnSpan'], 1, 256, true),
            rowSpan: V.number(value['rowSpan'], 1, 256, true),
            ...(value['referenceWidth'] === undefined
                ? {}
                : { referenceWidth: V.number(value['referenceWidth'], 0.01, 100000) }),
            ...(value['referenceHeight'] === undefined
                ? {}
                : { referenceHeight: V.number(value['referenceHeight'], 0.01, 100000) }),
            ...(value['contentReferenceWidth'] === undefined
                ? {}
                : {
                      contentReferenceWidth: V.number(value['contentReferenceWidth'], 0.01, 100000),
                  }),
            ...(value['contentReferenceHeight'] === undefined
                ? {}
                : {
                      contentReferenceHeight: V.number(
                          value['contentReferenceHeight'],
                          0.01,
                          100000,
                      ),
                  }),
        };
        if (result.minWidth > result.maxWidth || result.minHeight > result.maxHeight) {
            throw new Error('Minimum layer size exceeds its maximum');
        }
        return result;
    }
}
