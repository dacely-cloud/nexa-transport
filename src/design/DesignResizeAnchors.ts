// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignBox, DesignNode, DesignDocument } from './DesignTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignWorldPositions } from './DesignWorldPositions.js';
import { DesignBooleanTransforms } from './DesignBooleanTransforms.js';
import { DesignPaths } from './DesignPaths.js';
import {
    DesignOperationKind,
    type DesignOperation,
    type DesignResizeOperation,
} from './DesignOperationTypes.js';
import type { DesignSelectionGeometry } from './DesignSelectionTypes.js';

/** Resized source geometry and automatic ancestor origins commit together instead of drifting after reflow. */
export class DesignResizeAnchors {
    /** Owns the original constraint scene and the resize's already captured descendant geometry. */
    public constructor(
        public readonly context: DesignSelectionContext,
        public readonly captured: ReadonlyMap<string, DesignNode>,
    ) {}

    /** Free layers keep their resolved parent-local position; flowing layers retain the parent's layout control. */
    public apply(operation: DesignResizeOperation): readonly DesignNode[] {
        const document: DesignDocument = {
            ...this.context.document,
            nodes: this.context.document.nodes.map(
                (node: DesignNode): DesignNode => this.captured.get(node.id) ?? node,
            ),
        };
        const working: DesignSelectionContext = new DesignSelectionContext(
            document,
            this.context.pageId,
            this.context.roots.map((node: DesignNode): string => node.id),
            this.context.measurer,
        );
        const targets: DesignBox[] = [];
        for (const node of this.context.roots) {
            if (this.context.flowing(node.id) || !this.context.boxes.has(node.id)) {
                continue;
            }
            const current: DesignBox = working.box(node.id);
            const previous: DesignSelectionGeometry = this.context.local(
                this.context.box(node.id),
                node.parentId,
            );
            const parent: DesignBox | null =
                node.parentId === null
                    ? null
                    : DesignSelectionContext.atCorner(
                          working.box(node.parentId),
                          DesignSelectionContext.corner(this.context.box(node.parentId)),
                      );
            targets.push(
                DesignBooleanTransforms.world(
                    node.id,
                    {
                        x: operation.x ?? previous.x,
                        y: operation.y ?? previous.y,
                        width: current.width,
                        height: current.height,
                        rotation: previous.rotation,
                    },
                    parent,
                ),
            );
        }
        return new DesignWorldPositions(this.context, targets, this.captured)
            .operations()
            .map((edit: DesignOperation): DesignNode => {
                if (edit.op !== DesignOperationKind.Update) {
                    throw new Error('Resizing requires captured layer updates.');
                }
                return DesignPaths.resize(this.context.node(edit.id), edit.changes);
            });
    }
}
