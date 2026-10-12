// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignSizing,
    type DesignNode,
    type DesignBox,
    type DesignPlacement,
} from './DesignTypes.js';
import type { DesignSizingOperation } from './DesignOperationTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignResizeEdits } from './DesignResizeEdits.js';
import { DesignLayoutCodec } from './DesignLayoutCodec.js';

/** Native limits merge with saved placement; switching to Fixed freezes the actual resolved axis. */
export class DesignSizingEdits {
    /** The context supplies exact owner-scoped text metrics and checks page ownership and locks. */
    public constructor(public readonly context: DesignSelectionContext) {}
    /** Constraint and descendant captures remain part of the same atomic, undoable command. */
    public apply(operation: DesignSizingOperation): readonly DesignNode[] {
        const node: DesignNode = this.context.node(operation.id);
        const placement: DesignPlacement = DesignLayoutCodec.placement({
            ...node.placement,
            ...operation.changes,
        });
        if (JSON.stringify(placement) === JSON.stringify(node.placement)) {
            return [];
        }
        const width: boolean =
            operation.changes.width === DesignSizing.Fixed &&
            node.placement.width !== DesignSizing.Fixed;
        const height: boolean =
            operation.changes.height === DesignSizing.Fixed &&
            node.placement.height !== DesignSizing.Fixed;
        const box: DesignBox = this.context.box(node.id);
        const resized: readonly DesignNode[] =
            width || height
                ? new DesignResizeEdits(this.context).apply({
                      op: 'resize',
                      pageId: operation.pageId,
                      selection: [node.id],
                      ...(width ? { width: box.width } : {}),
                      ...(height ? { height: box.height } : {}),
                  })
                : [];
        const changed: Map<string, DesignNode> = new Map(
            resized.map((entry: DesignNode): readonly [string, DesignNode] => [entry.id, entry]),
        );
        const current: DesignNode = changed.get(node.id) ?? node;
        changed.set(node.id, {
            ...current,
            placement: DesignLayoutCodec.placement({
                ...current.placement,
                ...operation.changes,
                minWidth: placement.minWidth,
                maxWidth: placement.maxWidth,
                minHeight: placement.minHeight,
                maxHeight: placement.maxHeight,
            }),
        });
        return [...changed.values()];
    }
}
