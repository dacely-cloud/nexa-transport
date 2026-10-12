// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignBox, DesignNode } from './DesignTypes.js';
import {
    DesignOperationKind,
    type DesignOperation,
    type DesignRotateOperation,
} from './DesignOperationTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignWorldPositions } from './DesignWorldPositions.js';
import { DesignPaths } from './DesignPaths.js';
import type { DesignSelectionBounds } from './DesignSelectionTypes.js';

/** Agent commands and canvas gestures rotate one original selection forest in one atomic transaction. */
export class DesignRotateEdits {
    public constructor(public readonly context: DesignSelectionContext) {}

    public apply(operation: DesignRotateOperation): readonly DesignNode[] {
        const delta: number = this.#signed(operation.angle);
        if (Math.abs(delta) < 0.00000001) {
            return [];
        }
        const boxes: readonly DesignBox[] = this.context.roots.map((node: DesignNode): DesignBox =>
            this.context.box(node.id),
        );
        const first: DesignBox | undefined = boxes[0];
        if (first === undefined) {
            throw new Error('Select a visible layer to rotate.');
        }
        let bounds: DesignSelectionBounds = DesignSelectionContext.bounds(first);
        for (const box of boxes.slice(1)) {
            const area: DesignSelectionBounds = DesignSelectionContext.bounds(box);
            bounds = {
                left: Math.min(bounds.left, area.left),
                top: Math.min(bounds.top, area.top),
                right: Math.max(bounds.right, area.right),
                bottom: Math.max(bounds.bottom, area.bottom),
            };
        }
        const pivotX: number = operation.pivotX ?? (bounds.left + bounds.right) / 2;
        const pivotY: number = operation.pivotY ?? (bounds.top + bounds.bottom) / 2;
        const sole: DesignNode | undefined = this.context.roots[0];
        if (
            sole !== undefined &&
            boxes.length === 1 &&
            this.context.flowing(sole.id) &&
            Math.hypot(pivotX - first.x - first.width / 2, pivotY - first.y - first.height / 2) <
                0.00000001
        ) {
            return [{ ...sole, rotation: this.#signed(sole.rotation + delta) }];
        }
        const radians: number = (delta * Math.PI) / 180;
        const targets: readonly DesignBox[] = boxes.map((box: DesignBox): DesignBox => {
            const dx: number = box.x + box.width / 2 - pivotX;
            const dy: number = box.y + box.height / 2 - pivotY;
            return {
                ...box,
                x: pivotX + dx * Math.cos(radians) - dy * Math.sin(radians) - box.width / 2,
                y: pivotY + dx * Math.sin(radians) + dy * Math.cos(radians) - box.height / 2,
                rotation: box.rotation + delta,
            };
        });
        const operations: readonly DesignOperation[] = new DesignWorldPositions(
            this.context,
            targets,
        ).operations();
        if (operations.length > 512) {
            throw new Error(
                'Split this rotation into smaller selections to retain the atomic edit limit.',
            );
        }
        return operations.map((edit: DesignOperation): DesignNode => {
            if (edit.op !== DesignOperationKind.Update) {
                throw new Error('World rotation requires captured layer updates.');
            }
            return DesignPaths.resize(this.context.node(edit.id), edit.changes);
        });
    }
    #signed(angle: number): number {
        return ((((angle + 180) % 360) + 360) % 360) - 180;
    }
}
