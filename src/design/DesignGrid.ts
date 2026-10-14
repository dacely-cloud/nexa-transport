// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignAlign,
    DesignSizing,
    type DesignLayout,
    type DesignPlacement,
} from './DesignTypes.js';
import type {
    DesignAllocatedMeasurer,
    DesignFlowItem,
    DesignLocalBox,
    DesignTextMeasurer,
} from './DesignLayoutTypes.js';

interface GridCell {
    readonly item: DesignFlowItem;
    readonly row: number;
    readonly column: number;
    readonly rows: number;
    readonly columns: number;
}
/** Resolved tracks also expose natural height for hug containers. */
export interface DesignGridResult {
    readonly boxes: readonly DesignLocalBox[];
    readonly height: number;
}

/** Bounded dense grid placement with independent row and column spans. */
export class DesignGrid {
    /**
     * Places cells without overlaps, retaining authored size unless fill or stretch is selected.
     * @remarks Failed candidates stay occupied. A cursor per shape backfills holes without
     * rescanning uniform grids.
     */
    public static arrange(
        items: readonly DesignFlowItem[],
        layout: DesignLayout,
        width: number,
        height: number | null,
        measurer: DesignTextMeasurer | null = null,
        measureAllocated: DesignAllocatedMeasurer | null = null,
    ): DesignGridResult {
        const columns: number = layout.columns;
        const occupied: Set<number> = new Set();
        const cells: GridCell[] = [];
        const cursors: Map<number, number> = new Map();
        let rows: number = 0;
        for (const item of items) {
            const span: number = Math.min(columns, item.node.placement.columnSpan);
            const rowSpan: number = item.node.placement.rowSpan;
            const shape: number = rowSpan * 129 + span;
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
        const trackWidth: number = Math.max(
            0,
            (width - layout.padding.left - layout.padding.right - layout.gap * (columns - 1)) /
                columns,
        );
        for (let index: number = 0; index < cells.length; index++) {
            const cell: GridCell | undefined = cells[index];
            if (
                cell === undefined ||
                (measureAllocated === null &&
                    (measurer === null || cell.item.node.text === null)) ||
                cell.item.node.placement.height !== DesignSizing.Hug
            ) {
                continue;
            }
            const placement: DesignPlacement = cell.item.node.placement;
            const cellWidth: number = trackWidth * cell.columns + layout.gap * (cell.columns - 1);
            const targetWidth: number = Math.max(
                placement.minWidth,
                Math.min(
                    placement.maxWidth,
                    placement.width === DesignSizing.Fill || layout.align === DesignAlign.Stretch
                        ? cellWidth
                        : cell.item.width,
                ),
            );
            const height: number = Math.max(
                placement.minHeight,
                Math.min(
                    placement.maxHeight,
                    measureAllocated !== null
                        ? measureAllocated(cell.item.node, targetWidth).height
                        : measurer !== null && cell.item.node.text !== null
                          ? measurer.measure(cell.item.node.text, targetWidth, cell.item.node.id)
                                .height
                          : cell.item.height,
                ),
            );
            cells[index] = { ...cell, item: { ...cell.item, height } };
        }
        const heights: number[] = Array.from({ length: rows }, (): number => 0);
        for (const cell of cells) {
            const share: number = Math.max(
                0,
                (cell.item.height - layout.rowGap * (cell.rows - 1)) / cell.rows,
            );
            for (let row: number = cell.row; row < cell.row + cell.rows; row++) {
                heights[row] = Math.max(heights[row] ?? 0, share);
            }
        }
        const natural: number =
            heights.reduce((sum: number, track: number): number => sum + track, 0) +
            Math.max(0, rows - 1) * layout.rowGap;
        const available: number =
            height === null
                ? natural
                : Math.max(0, height - layout.padding.top - layout.padding.bottom);
        const stretchRows: boolean =
            layout.align === DesignAlign.Stretch ||
            items.some(
                (item: DesignFlowItem): boolean => item.node.placement.height === DesignSizing.Fill,
            );
        if (stretchRows && rows > 0 && available > natural) {
            for (let row: number = 0; row < rows; row++) {
                heights[row] = (heights[row] ?? 0) + (available - natural) / rows;
            }
        }
        const offsets: number[] = [];
        let offset: number = layout.padding.top;
        for (const track of heights) {
            offsets.push(offset);
            offset += track + layout.rowGap;
        }
        const boxes: DesignLocalBox[] = cells.map((cell: GridCell): DesignLocalBox => {
            const cellWidth: number = trackWidth * cell.columns + layout.gap * (cell.columns - 1);
            let cellHeight: number = layout.rowGap * (cell.rows - 1);
            for (let row: number = cell.row; row < cell.row + cell.rows; row++) {
                cellHeight += heights[row] ?? 0;
            }
            const placement: DesignPlacement = cell.item.node.placement;
            const itemWidth: number = Math.max(
                placement.minWidth,
                Math.min(
                    placement.maxWidth,
                    placement.width === DesignSizing.Fill || layout.align === DesignAlign.Stretch
                        ? cellWidth
                        : cell.item.width,
                ),
            );
            const itemHeight: number = Math.max(
                placement.minHeight,
                Math.min(
                    placement.maxHeight,
                    placement.height === DesignSizing.Fill || layout.align === DesignAlign.Stretch
                        ? cellHeight
                        : cell.item.height,
                ),
            );
            return {
                id: cell.item.node.id,
                x:
                    layout.padding.left +
                    cell.column * (trackWidth + layout.gap) +
                    this.#align(layout.justify, cellWidth - itemWidth),
                y:
                    (offsets[cell.row] ?? layout.padding.top) +
                    this.#align(layout.align, cellHeight - itemHeight),
                width: itemWidth,
                height: itemHeight,
            };
        });
        return {
            boxes,
            height:
                Math.max(natural, stretchRows ? available : natural) +
                layout.padding.top +
                layout.padding.bottom,
        };
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
    static #align(align: string, spare: number): number {
        return align === DesignAlign.Center
            ? Math.max(0, spare) / 2
            : align === DesignAlign.End
              ? Math.max(0, spare)
              : 0;
    }
}
