// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignDefaults } from './DesignDefaults.js';
import {
    DesignKind,
    type DesignStyle,
    type DesignOverride,
    type DesignNode,
    type DesignPaint,
} from './DesignTypes.js';
import type { DesignPaintColorTarget } from './DesignOperationTypes.js';

/** An authored layer and paint slot are verified before any compact paint property is changed. */
export interface DesignPaintReference {
    readonly id: string;
    readonly pageId: string;
    readonly target: DesignPaintColorTarget;
    readonly index: number;
}
/** Shared paint authority retains instance-root overrides, stack order and unrelated style fields. */
export class DesignPaintLayerEdit {
    /** A first fill may be created; stroke editing requires an existing stroke at index zero. */
    public static apply(
        authority: DesignLayerAuthority,
        reference: DesignPaintReference,
        edit: (paint: DesignPaint) => DesignPaint,
    ): DesignNode {
        const node: DesignNode = authority.node(reference.id, reference.pageId);
        const component: DesignNode | undefined =
            node.kind === DesignKind.Instance
                ? authority.nodes.get(node.componentId ?? '')
                : undefined;
        const override: DesignOverride | undefined =
            component === undefined
                ? undefined
                : node.overrides.find(
                      (entry: DesignOverride): boolean => entry.nodeId === component.id,
                  );
        const style: DesignStyle =
            component === undefined ? node.style : (override?.style ?? component.style);
        const stroke: boolean = reference.target === 'stroke';
        const before: DesignPaint | undefined = stroke
            ? style.stroke?.paint
            : style.fills[reference.index];
        if (stroke && (reference.index !== 0 || before === undefined)) {
            throw new Error('Choose index 0 on an existing stroke.');
        }
        if (!stroke && before === undefined && (reference.index !== 0 || style.fills.length > 0)) {
            throw new Error('Fill paint index is outside the layer.');
        }
        const source: DesignPaint = before ?? DesignDefaults.paint();
        const paint: DesignPaint = edit(source);
        const next: DesignStyle = {
            ...style,
            ...(stroke && style.stroke !== null
                ? { stroke: { ...style.stroke, paint } }
                : {
                      fills:
                          before === undefined
                              ? [paint]
                              : style.fills.map((entry: DesignPaint, index: number): DesignPaint =>
                                    index === reference.index ? paint : entry,
                                ),
                  }),
        };
        if (component === undefined) {
            return { ...node, style: next };
        }
        const replaced: DesignOverride =
            override === undefined
                ? { nodeId: component.id, name: null, text: null, style: next, visible: null }
                : { ...override, style: next };
        return {
            ...node,
            overrides:
                override === undefined
                    ? [...node.overrides, replaced]
                    : node.overrides.map((entry: DesignOverride): DesignOverride =>
                          entry.nodeId === component.id ? replaced : entry,
                      ),
        };
    }
}
