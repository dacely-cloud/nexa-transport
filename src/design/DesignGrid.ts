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
import {
    DesignGridPacking,
    type DesignGridCell,
    type DesignGridPackingResult,
} from './DesignGridPacking.js';
import { DesignStackGeometry, type DesignStackPlacement } from './DesignStackGeometry.js';

/** Resolved tracks also expose natural height for hug containers. */
export interface DesignGridResult {
    readonly boxes: readonly DesignLocalBox[];
    readonly height: number;
}

/** Bounded dense grid placement with independent row and column spans. */
export class DesignGrid {
    /**
     * Packs logical cells without collisions while signed gaps may overlap their painted tracks.
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
        const packing: DesignGridPackingResult = DesignGridPacking.arrange(items, columns);
        const cells: DesignGridCell[] = [...packing.cells];
        const rows: number = packing.rows;
        const trackWidth: number = Math.max(
            0,
            (width - layout.padding.left - layout.padding.right - layout.gap * (columns - 1)) /
                columns,
        );
        for (let index: number = 0; index < cells.length; index++) {
            const cell: DesignGridCell | undefined = cells[index];
            if (
                cell === undefined ||
                (measureAllocated === null &&
                    (measurer === null || cell.item.node.text === null)) ||
                cell.item.node.placement.height !== DesignSizing.Hug
            ) {
                continue;
            }
            const placement: DesignPlacement = cell.item.node.placement;
            const cellWidth: number = DesignStackGeometry.uniform(
                trackWidth,
                cell.columns,
                layout.gap,
            );
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
        const natural: number = DesignStackGeometry.span(heights, layout.rowGap);
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
            const growth: number = DesignStackGeometry.growth(heights, layout.rowGap, available);
            for (let row: number = 0; row < rows; row++) {
                heights[row] = (heights[row] ?? 0) + growth;
            }
        }
        const tracks: DesignStackPlacement = DesignStackGeometry.arrange(heights, layout.rowGap);
        const step: number = trackWidth + layout.gap;
        const columnOrigin: number = -Math.min(0, (columns - 1) * step);
        const boxes: DesignLocalBox[] = cells.map((cell: DesignGridCell): DesignLocalBox => {
            const cellWidth: number = DesignStackGeometry.uniform(
                trackWidth,
                cell.columns,
                layout.gap,
            );
            let top: number = Infinity;
            let bottom: number = -Infinity;
            for (let row: number = cell.row; row < cell.row + cell.rows; row++) {
                const offset: number = tracks.offsets[row] ?? 0;
                top = Math.min(top, offset);
                bottom = Math.max(bottom, offset + (heights[row] ?? 0));
            }
            const cellHeight: number = bottom - top;
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
                    columnOrigin +
                    Math.min(cell.column * step, (cell.column + cell.columns - 1) * step) +
                    this.#align(layout.justify, cellWidth - itemWidth),
                y: layout.padding.top + top + this.#align(layout.align, cellHeight - itemHeight),
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
    static #align(align: string, spare: number): number {
        return align === DesignAlign.Center
            ? Math.max(0, spare) / 2
            : align === DesignAlign.End
              ? Math.max(0, spare)
              : 0;
    }
}
