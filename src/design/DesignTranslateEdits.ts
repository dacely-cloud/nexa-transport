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

/** The native canvas and agent translation share one original world scene and one atomic result. */
export class DesignTranslateEdits {
    /** Selection ownership, locks, roots and exact text measurements are resolved before translation. */
    public constructor(public readonly context: DesignSelectionContext) {}

    /** Nested selections move once; flowing layers require an explicit departure from automatic layout. */
    public apply(operation: DesignTranslateOperation): readonly DesignNode[] {
        const targets: readonly DesignBox[] = this.context.roots.map(
            (node: DesignNode): DesignBox => {
                const box: DesignBox = this.context.box(node.id);
                return { ...box, x: box.x + operation.dx, y: box.y + operation.dy };
            },
        );
        const operations: readonly DesignOperation[] = new DesignWorldPositions(
            this.context,
            targets,
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
            return DesignPaths.resize(this.context.node(edit.id), edit.changes);
        });
    }
}
