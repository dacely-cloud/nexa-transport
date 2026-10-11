// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignBox, DesignNode } from './DesignTypes.js';
import {
    DesignOperationKind,
    type DesignOperation,
    type DesignTranslateOperation,
} from './DesignOperationTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignWorldPositions } from './DesignWorldPositions.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignFlowOrdering } from './DesignFlowOrdering.js';

/** The native canvas and agent translation share one original world scene and one atomic result. */
export class DesignTranslateEdits {
    /** Selection ownership, locks, roots and exact text measurements are resolved before translation. */
    public constructor(public readonly context: DesignSelectionContext) {}

    /** Flow ordering and free movement share the original scene instead of translating already reflowed artwork. */
    public apply(operation: DesignTranslateOperation): readonly DesignNode[] {
        const captured: ReadonlyMap<string, DesignNode> =
            operation.reorders === undefined
                ? new Map()
                : DesignFlowOrdering.capture(this.context, operation.reorders);
        const targets: readonly DesignBox[] = this.context.roots
            .filter(
                (node: DesignNode): boolean =>
                    operation.reorders === undefined || !this.context.flowing(node.id),
            )
            .map((node: DesignNode): DesignBox => {
                const box: DesignBox = this.context.box(node.id);
                return { ...box, x: box.x + operation.dx, y: box.y + operation.dy };
            });
        const operations: readonly DesignOperation[] = new DesignWorldPositions(
            this.context,
            targets,
            captured,
            this.context,
        ).operations();
        if (operations.length > 512) {
            throw new Error(
                'Split this translation into smaller selections to retain the atomic edit limit.',
            );
        }
        return operations.map((edit: DesignOperation): DesignNode => {
            if (edit.op !== DesignOperationKind.Update) {
                throw new Error('World translation requires captured layer updates.');
            }
            return DesignPaths.resize(
                captured.get(edit.id) ?? this.context.node(edit.id),
                edit.changes,
            );
        });
    }
}
