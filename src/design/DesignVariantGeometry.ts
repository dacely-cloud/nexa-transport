// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignFlow, type DesignDocument, type DesignNode } from './DesignTypes.js';
import { DesignEdits } from './DesignEdits.js';
import { DesignOperationKind as Op, type DesignOperation } from './DesignOperationTypes.js';
import type { DesignSelectionPlan, DesignSelectionGeometry } from './DesignSelectionTypes.js';
import { DesignSelectionContext as Context } from './DesignSelectionContext.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';

/** Auto-layout placement ignores authored container offsets, so growth needs a solved transform correction. */
export class DesignVariantGeometry {
    /** Preserves every original definition's world transform when a freeform set grows inside flowing layout. */
    public static flowingParent(
        context: Context,
        set: DesignNode,
        sourceId: string,
        plan: DesignSelectionPlan,
    ): DesignSelectionPlan {
        if (
            set.parentId === null ||
            set.placement.absolute ||
            context.node(set.parentId).layout.flow === DesignFlow.Absolute
        ) {
            return plan;
        }
        const resized: DesignDocument = DesignEdits.apply(
            context.document,
            plan.operations,
        ).document;
        const after: Context = new Context(resized, context.pageId, [set.id], context.measurer);
        const beforeSource: DesignSelectionGeometry = context.local(context.box(sourceId), set.id);
        const correctedSource: DesignSelectionGeometry = after.local(context.box(sourceId), set.id);
        const dx: number = correctedSource.x - beforeSource.x;
        const dy: number = correctedSource.y - beforeSource.y;
        const copyId: string | undefined = plan.selection[0];
        if (copyId === undefined) {
            throw new Error('Missing copied variant.');
        }
        const operations: DesignOperation[] = [...plan.operations];
        for (const id of set.children) {
            const node: DesignNode = context.node(id);
            operations.push({
                op: Op.Update,
                id,
                changes: {
                    ...after.local(context.box(id), set.id),
                    placement: DesignSelectionTree.fixed(node, true),
                },
            });
        }
        const copy: DesignNode = after.node(copyId);
        operations.push({ op: Op.Update, id: copyId, changes: { x: copy.x + dx, y: copy.y + dy } });
        return { operations, selection: plan.selection };
    }
}
