// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignDefaults } from './DesignDefaults.js';
import {
    DesignTokenCategory,
    DesignKind,
    type DesignStyle,
    type DesignOverride,
    type DesignNode,
    type DesignPaint,
    type DesignToken,
} from './DesignTypes.js';
import type { DesignPaintColorOperation } from './DesignOperationTypes.js';

/** Color-property edits preserve source text, vectors, paint modes and unrelated style records. */
export class DesignPaintColorEdits {
    /** Contextual authority rejects virtual children, wrong pages and locked ancestry. */
    public static apply(
        authority: DesignLayerAuthority,
        tokens: readonly DesignToken[],
        operation: DesignPaintColorOperation,
    ): DesignNode {
        const node: DesignNode = authority.node(operation.id, operation.pageId);
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
        const stroke: boolean = operation.target === 'stroke';
        const before: DesignPaint | undefined = stroke
            ? style.stroke?.paint
            : style.fills[operation.index];
        if (stroke && (operation.index !== 0 || before === undefined)) {
            throw new Error('Choose index 0 on an existing stroke.');
        }
        if (!stroke && before === undefined && (operation.index !== 0 || style.fills.length > 0)) {
            throw new Error('Fill paint index is outside the layer.');
        }
        const source: DesignPaint = before ?? DesignDefaults.paint();
        const detached: string | undefined =
            operation.changes.tokenId === null &&
            operation.changes.color === undefined &&
            source.tokenId !== null
                ? tokens.find(
                      (token): boolean =>
                          token.id === source.tokenId &&
                          token.category === DesignTokenCategory.Color,
                  )?.value
                : undefined;
        const paint: DesignPaint = DesignStyleCodec.paint({
            ...source,
            ...(detached === undefined ? {} : { color: detached }),
            ...operation.changes,
        });
        const next: DesignStyle = {
            ...style,
            ...(stroke && style.stroke !== null
                ? { stroke: { ...style.stroke, paint } }
                : {
                      fills:
                          before === undefined
                              ? [paint]
                              : style.fills.map((entry: DesignPaint, index: number): DesignPaint =>
                                    index === operation.index ? paint : entry,
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
