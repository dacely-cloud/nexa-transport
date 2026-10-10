// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignBooleanMode as Mode } from './DesignBooleanTypes.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';
import type { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignSelectionPlan } from './DesignSelectionTypes.js';
import {
    DesignKind,
    DesignPaintKind,
    type DesignNode,
    type DesignStyle,
    type DesignPaint,
} from './DesignTypes.js';
import { DesignOperationKind as Op, type DesignOperation } from './DesignOperationTypes.js';

/** Boolean selection commands preserve editable source identity and use the normal atomic edit path. */
export class DesignBooleanSelection {
    /** A single Boolean selection changes its mode; new groups retain the selected sibling forest. */
    public static plan(
        context: DesignSelectionContext,
        mode: Mode,
        id: string,
    ): DesignSelectionPlan {
        const first: DesignNode | undefined = context.roots[0];
        if (first === undefined) {
            throw new Error('Select layers to combine.');
        }
        if (context.roots.length === 1 && first.kind === DesignKind.Boolean) {
            return {
                operations: [{ op: Op.Update, id: first.id, changes: { booleanMode: mode } }],
                selection: [first.id],
            };
        }
        if (context.roots.length < 2) {
            throw new Error('Select at least two shapes to combine.');
        }
        for (const node of context.roots) {
            if (
                ![
                    DesignKind.Rectangle,
                    DesignKind.Ellipse,
                    DesignKind.Line,
                    DesignKind.Polygon,
                    DesignKind.Path,
                    DesignKind.Image,
                    DesignKind.Group,
                    DesignKind.Boolean,
                ].some((kind: DesignKind): boolean => kind === node.kind)
            ) {
                throw new Error(
                    'Boolean operations require shapes or editable vector groups. Outline text before combining it.',
                );
            }
        }
        const base: DesignNode = mode === Mode.Subtract ? first : (context.roots.at(-1) ?? first);
        const paint: DesignNode = this.#paint(context, base);
        const fills: readonly DesignPaint[] =
            paint.image === null
                ? paint.style.fills
                : [
                      {
                          ...DesignDefaults.paint(),
                          kind: DesignPaintKind.Image,
                          assetId: paint.image.assetId,
                          framing: {
                              fit: paint.image.fit,
                              cropX: paint.image.cropX,
                              cropY: paint.image.cropY,
                              scale: paint.image.scale,
                          },
                      },
                  ];
        const style: DesignStyle = {
            ...paint.style,
            fills:
                fills.length > 0
                    ? fills
                    : paint.style.stroke === null
                      ? []
                      : [paint.style.stroke.paint],
            stroke: null,
            corners: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
        };
        const group: DesignSelectionPlan = DesignSelectionTree.group(context, id);
        return {
            ...group,
            operations: group.operations.map((operation: DesignOperation): DesignOperation =>
                operation.op === Op.Insert && operation.node.id === id
                    ? {
                          ...operation,
                          node: {
                              ...operation.node,
                              kind: DesignKind.Boolean,
                              booleanMode: mode,
                              name:
                                  mode === 'union'
                                      ? 'Union'
                                      : mode === 'subtract'
                                        ? 'Subtract'
                                        : mode === 'intersect'
                                          ? 'Intersect'
                                          : 'Exclude',
                              style,
                              opacity: base.opacity,
                          },
                      }
                    : operation,
            ),
        };
    }

    /** Flatten explicitly removes sources while retaining the group's identity, paints and derived path. */
    public static flatten(context: DesignSelectionContext): DesignSelectionPlan {
        const operations: DesignOperation[] = [];
        for (const node of context.roots) {
            if (node.kind !== DesignKind.Boolean) {
                throw new Error('Select Boolean groups to flatten.');
            }
            for (const id of node.children) {
                operations.push({ op: Op.Remove, id });
            }
            operations.push({
                op: Op.Update,
                id: node.id,
                changes: { kind: DesignKind.Path, booleanMode: null },
            });
        }
        return { operations, selection: context.roots.map((node: DesignNode): string => node.id) };
    }

    static #paint(context: DesignSelectionContext, node: DesignNode): DesignNode {
        if (node.image !== null || node.style.fills.length > 0 || node.style.stroke !== null) {
            return node;
        }
        for (const id of node.children.toReversed()) {
            const painted: DesignNode = this.#paint(context, context.node(id));
            if (
                painted.image !== null ||
                painted.style.fills.length > 0 ||
                painted.style.stroke !== null
            ) {
                return painted;
            }
        }
        return node;
    }
}
