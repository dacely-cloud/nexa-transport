// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignFlowItem } from './DesignLayoutTypes.js';

/** Logical cell ownership is independent of resolved track positions and overlap. */
export interface DesignGridCell {
    readonly item: DesignFlowItem;
    readonly row: number;
    readonly column: number;
    readonly rows: number;
    readonly columns: number;
}
/** One canonical occupancy plan supports native layout and bounded browser controls. */
export interface DesignGridPackingResult {
    readonly cells: readonly DesignGridCell[];
    readonly rows: number;
}

/** Dense span-aware packing preserves painter order without rescanning equal shapes. */
export class DesignGridPacking {
    /** Each occupied cell is reserved once; the existing 4096-row budget remains enforced. */
    public static arrange(
        items: readonly DesignFlowItem[],
        columns: number,
    ): DesignGridPackingResult {
        const occupied: Set<number> = new Set();
        const cells: DesignGridCell[] = [];
        const cursors: Map<number, number> = new Map();
        let rows: number = 0;
        for (const item of items) {
            const span: number = Math.min(columns, item.node.placement.columnSpan);
            const rowSpan: number = item.node.placement.rowSpan;
            const shape: number = rowSpan * 257 + span;
            let cursor: number = cursors.get(shape) ?? 0;
            let placed: boolean = false;
            while (cursor < columns * 4096) {
                const column: number = cursor % columns;
                const row: number = Math.floor(cursor / columns);
                if (
                    column + span <= columns &&
                    row + rowSpan <= 4096 &&
                    this.#free(occupied, row, column, rowSpan, span, columns)
                ) {
                    for (let y: number = row; y < row + rowSpan; y++) {
                        for (let x: number = column; x < column + span; x++) {
                            occupied.add(y * columns + x);
                        }
                    }
                    cells.push({ item, row, column, rows: rowSpan, columns: span });
                    rows = Math.max(rows, row + rowSpan);
                    cursors.set(shape, cursor + 1);
                    placed = true;
                    break;
                }
                cursor++;
            }
            if (!placed) {
                throw new Error('Grid exceeds its track budget');
            }
        }
        return { cells, rows };
    }
    static #free(
        occupied: ReadonlySet<number>,
        row: number,
        column: number,
        rows: number,
        span: number,
        columns: number,
    ): boolean {
        for (let y: number = row; y < row + rows; y++) {
            for (let x: number = column; x < column + span; x++) {
                if (occupied.has(y * columns + x)) {
                    return false;
                }
            }
        }
        return true;
    }
}
