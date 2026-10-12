// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignFlow,
    DesignKind,
    DesignSizing,
    type DesignNode,
    type DesignBox,
    type DesignLayout,
} from './DesignTypes.js';
import type { DesignLayoutOperation } from './DesignOperationTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignPaths } from './DesignPaths.js';
import type { DesignSize } from './DesignLayoutTypes.js';
import type { DesignSelectionGeometry } from './DesignSelectionTypes.js';

/** Layout fields merge on the workspace; returning to freeform freezes the actual visible composition. */
export class DesignLayoutEdits {
    /** The context supplies exact admitted font metrics and rejects wrong pages or locked ancestry. */
    public constructor(public readonly context: DesignSelectionContext) {}

    /** Source bodies, styles, hidden children and linked definitions remain untouched. */
    public apply(operation: DesignLayoutOperation): readonly DesignNode[] {
        const node: DesignNode = this.context.node(operation.id);
        if (
            ![
                DesignKind.Frame,
                DesignKind.Group,
                DesignKind.Component,
                DesignKind.ComponentSet,
                DesignKind.Mask,
                DesignKind.Boolean,
            ].some((kind: DesignKind): boolean => kind === node.kind)
        ) {
            throw new Error('Select a layout container.');
        }
        const layout: DesignLayout = {
            ...node.layout,
            ...operation.changes,
            padding: { ...node.layout.padding, ...operation.changes.padding },
        };
        if (JSON.stringify(layout) === JSON.stringify(node.layout)) {
            return [];
        }
        if (node.layout.flow === DesignFlow.Absolute || layout.flow !== DesignFlow.Absolute) {
            return [{ ...node, layout }];
        }
        const box: DesignBox = this.context.box(node.id);
        const changed: DesignNode[] = [];
        for (const id of node.children) {
            const child: DesignNode = this.context.node(id);
            const childBox: DesignBox | undefined = this.context.boxes.get(id);
            if (childBox === undefined) {
                continue;
            }
            if (child.locked) {
                throw new Error('Unlock the container’s children before removing auto layout.');
            }
            if (child.placement.absolute) {
                continue;
            }
            const geometry: DesignSelectionGeometry = this.context.local(childBox, node.id);
            const natural: DesignSize = this.context.measure(id);
            changed.push(
                DesignPaths.resize(child, {
                    ...geometry,
                    placement: {
                        ...child.placement,
                        width:
                            child.placement.width === DesignSizing.Hug &&
                            Math.abs(natural.width - geometry.width) < 0.000001
                                ? DesignSizing.Hug
                                : DesignSizing.Fixed,
                        height:
                            child.placement.height === DesignSizing.Hug &&
                            Math.abs(natural.height - geometry.height) < 0.000001
                                ? DesignSizing.Hug
                                : DesignSizing.Fixed,
                        referenceWidth: box.width,
                        referenceHeight: box.height,
                        contentReferenceWidth: child.placement.contentReferenceWidth ?? child.width,
                        contentReferenceHeight:
                            child.placement.contentReferenceHeight ?? child.height,
                    },
                }),
            );
        }
        changed.push({
            ...node,
            layout,
            width: box.width,
            height: box.height,
            placement: {
                ...node.placement,
                width:
                    node.placement.width === DesignSizing.Hug
                        ? DesignSizing.Fixed
                        : node.placement.width,
                height:
                    node.placement.height === DesignSizing.Hug
                        ? DesignSizing.Fixed
                        : node.placement.height,
                contentReferenceWidth: node.placement.contentReferenceWidth ?? node.width,
                contentReferenceHeight: node.placement.contentReferenceHeight ?? node.height,
            },
        });
        return changed;
    }
}
