// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignPaintKind,
    type DesignNode,
    type DesignPaint,
    type DesignStyle,
} from './DesignTypes.js';

/** Source dependencies include base paints, rich ranges and instance style overrides. */
export class DesignPatternReferences {
    /** Same-document forest duplication remaps linked artwork only when its definition is copied too. */
    public static remap(node: DesignNode, identify: (id: string) => string): DesignNode {
        return this.map(node, (value: DesignPaint): DesignPaint =>
            value.patternId == null ? value : { ...value, patternId: identify(value.patternId) },
        );
    }
    /** Paint changes traverse rich runs and root overrides without touching source text or topology. */
    public static map(node: DesignNode, paint: (value: DesignPaint) => DesignPaint): DesignNode {
        const style: (value: DesignStyle) => DesignStyle = (value: DesignStyle): DesignStyle => ({
            ...value,
            fills: value.fills.map(paint),
            stroke:
                value.stroke === null
                    ? null
                    : { ...value.stroke, paint: paint(value.stroke.paint) },
        });
        return {
            ...node,
            style: style(node.style),
            text:
                node.text === null
                    ? null
                    : {
                          ...node.text,
                          runs: node.text.runs.map((run): typeof run => ({
                              ...run,
                              ...(run.fills == null ? {} : { fills: run.fills.map(paint) }),
                          })),
                      },
            overrides: node.overrides.map((override): typeof override => ({
                ...override,
                style: override.style === null ? null : style(override.style),
            })),
        };
    }
    /** Returns authored references without expanding source bodies or repeated occurrences. */
    public static ids(node: DesignNode): readonly string[] {
        const result: Set<string> = new Set();
        const paint: (value: DesignPaint) => void = (value: DesignPaint): void => {
            if (value.kind === DesignPaintKind.Pattern && value.patternId != null) {
                result.add(value.patternId);
            }
        };
        const style: (value: DesignStyle) => void = (value: DesignStyle): void => {
            value.fills.forEach(paint);
            if (value.stroke !== null) {
                paint(value.stroke.paint);
            }
        };
        style(node.style);
        for (const run of node.text?.runs ?? []) {
            run.fills?.forEach(paint);
        }
        for (const override of node.overrides) {
            if (override.style !== null) {
                style(override.style);
            }
        }
        return [...result];
    }
}
