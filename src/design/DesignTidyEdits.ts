// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignBox, DesignNode } from './DesignTypes.js';
import type { DesignOperation, DesignTidyOperation } from './DesignOperationTypes.js';
import { DesignOperationKind } from './DesignOperationTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignSelectionBounds } from './DesignSelectionTypes.js';
import { DesignWorldPositions } from './DesignWorldPositions.js';
import { DesignPaths } from './DesignPaths.js';
import {
    DesignTidyGeometry,
    type DesignTidyCell,
    type DesignTidyLayout,
} from './DesignTidyGeometry.js';

/** Coordinate frames retain parent axes when possible and use world axes across separate containers. */
export interface DesignTidyInspection {
    readonly parent: DesignBox | null;
    readonly layout: DesignTidyLayout;
}

/** The native planner moves selected roots without regrouping or replacing any source bodies. */
export class DesignTidyEdits {
    /** Source geometry is resolved once with native or already supplied canvas metrics. */
    public constructor(public readonly context: DesignSelectionContext) {}

    /** Selection order is admitted only after page, visibility, lock and flow validation. */
    public inspect(selection: readonly string[], columns?: number): DesignTidyInspection {
        if (this.context.roots.some((node: DesignNode): boolean => this.context.flowing(node.id))) {
            throw new Error(
                'Auto layout controls these positions. Tidy their container or enable absolute positioning first.',
            );
        }
        const roots: ReadonlySet<string> = new Set(
            this.context.roots.map((node: DesignNode): string => node.id),
        );
        const ordered: readonly string[] = selection.filter((id: string): boolean => roots.has(id));
        const first: DesignNode | undefined = this.context.roots[0];
        if (first === undefined) {
            throw new Error('Select layers to tidy.');
        }
        const parentId: string | null = this.context.roots.every(
            (node: DesignNode): boolean => node.parentId === first.parentId,
        )
            ? first.parentId
            : null;
        const parent: DesignBox | null = parentId === null ? null : this.context.box(parentId);
        const cells: readonly DesignTidyCell[] = ordered.map((id: string): DesignTidyCell => {
            const box: DesignBox = this.context.box(id);
            const bounds: DesignSelectionBounds = DesignSelectionContext.bounds(
                DesignSelectionContext.relative(box, parent),
            );
            return {
                id,
                x: bounds.left,
                y: bounds.top,
                width: bounds.right - bounds.left,
                height: bounds.bottom - bounds.top,
            };
        });
        return { parent, layout: DesignTidyGeometry.inspect(cells, columns) };
    }

    /** All target poses and dependent ancestor captures share one native save and Undo. */
    public apply(operation: DesignTidyOperation): readonly DesignNode[] {
        const { parent, layout }: DesignTidyInspection = this.inspect(
            operation.selection,
            operation.columns,
        );
        const source: readonly DesignTidyCell[] =
            operation.columns === undefined
                ? layout.cells
                : operation.selection.flatMap((id: string): readonly DesignTidyCell[] => {
                      const cell: DesignTidyCell | undefined = layout.cells.find(
                          (value: DesignTidyCell): boolean => value.id === id,
                      );
                      return cell === undefined ? [] : [cell];
                  });
        const placed: readonly DesignTidyCell[] = DesignTidyGeometry.place(source, {
            columns: operation.columns ?? layout.columns,
            gapX: operation.gapX ?? Math.max(0, layout.gapX),
            gapY: operation.gapY ?? Math.max(0, layout.gapY),
        });
        if (!DesignTidyGeometry.changed(source, placed)) {
            return [];
        }
        const targets: readonly DesignBox[] = placed.map(
            (cell: DesignTidyCell, index: number): DesignBox => {
                const before: DesignTidyCell | undefined = source[index];
                if (before === undefined) {
                    throw new Error('Missing tidy source cell.');
                }
                const box: DesignBox = this.context.box(cell.id);
                const angle: number = ((parent?.rotation ?? 0) * Math.PI) / 180;
                const x: number = cell.x - before.x;
                const y: number = cell.y - before.y;
                return {
                    ...box,
                    x: box.x + x * Math.cos(angle) - y * Math.sin(angle),
                    y: box.y + x * Math.sin(angle) + y * Math.cos(angle),
                };
            },
        );
        return new DesignWorldPositions(this.context, targets)
            .operations()
            .map((edit: DesignOperation): DesignNode => {
                if (edit.op !== DesignOperationKind.Update) {
                    throw new Error('Tidy requires captured position updates.');
                }
                return DesignPaths.resize(this.context.node(edit.id), edit.changes);
            });
    }
}
