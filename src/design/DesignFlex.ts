// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignAlign, DesignFlow, DesignSizing, type DesignLayout } from './DesignTypes.js';
import { DesignStackGeometry, type DesignStackPlacement } from './DesignStackGeometry.js';
import type { DesignFlowItem, DesignLocalBox } from './DesignLayoutTypes.js';

/** Deterministic wrapping and bounded flex sizing for row and column auto layout. */
export class DesignFlex {
    /** Distributed spacing never creates accidental overlaps when fixed children overflow. */
    public static gap(layout: DesignLayout): number {
        return layout.justify === DesignAlign.Between ? Math.max(0, layout.gap) : layout.gap;
    }
    /** Logical lines use occupied extents and retain original item identity for canvas controls. */
    public static lines(
        items: readonly DesignFlowItem[],
        layout: DesignLayout,
        main: number,
    ): readonly (readonly DesignFlowItem[])[] {
        const row: boolean = layout.flow === DesignFlow.Row;
        const lines: DesignFlowItem[][] = [[]];
        const itemGap: number = this.gap(layout);
        let used: number = 0;
        let minimum: number = 0;
        let maximum: number = 0;
        for (const item of items) {
            let line: DesignFlowItem[] | undefined = lines.at(-1);
            if (line === undefined) {
                throw new Error('Invalid flex line');
            }
            const length: number = row ? item.width : item.height;
            let start: number = line.length > 0 ? used + itemGap : 0;
            if (
                layout.wrap &&
                line.length > 0 &&
                Math.max(maximum, start + length) - Math.min(minimum, start) > main
            ) {
                line = [];
                lines.push(line);
                start = 0;
                minimum = 0;
                maximum = 0;
            }
            used = start + length;
            minimum = Math.min(minimum, start);
            maximum = Math.max(maximum, used);
            line.push(item);
        }
        return lines;
    }

    /** Places rows or columns, including fill children, min/max clamps and distributed gaps. */
    public static arrange(
        items: readonly DesignFlowItem[],
        layout: DesignLayout,
        width: number,
        height: number,
    ): readonly DesignLocalBox[] {
        const row: boolean = layout.flow === DesignFlow.Row;
        const main: number = Math.max(
            0,
            row
                ? width - layout.padding.left - layout.padding.right
                : height - layout.padding.top - layout.padding.bottom,
        );
        const cross: number = Math.max(
            0,
            row
                ? height - layout.padding.top - layout.padding.bottom
                : width - layout.padding.left - layout.padding.right,
        );
        const itemGap: number = this.gap(layout);
        const lines: readonly (readonly DesignFlowItem[])[] = this.lines(items, layout, main);
        const output: DesignLocalBox[] = [];
        const crossLengths: readonly number[] = lines.map(
            (line: readonly DesignFlowItem[]): number =>
                lines.length === 1
                    ? cross
                    : Math.max(
                          0,
                          ...line.map((item: DesignFlowItem): number =>
                              row ? item.height : item.width,
                          ),
                      ),
        );
        const linePositions: DesignStackPlacement = DesignStackGeometry.arrange(
            crossLengths,
            layout.rowGap,
        );
        for (let lineIndex: number = 0; lineIndex < lines.length; lineIndex++) {
            const line: readonly DesignFlowItem[] = lines[lineIndex] ?? [];
            if (line.length === 0) {
                continue;
            }
            const lengths: number[] = line.map((item: DesignFlowItem): number =>
                row ? item.width : item.height,
            );
            const flexible: Set<number> = new Set();
            for (let index: number = 0; index < line.length; index++) {
                const item: DesignFlowItem | undefined = line[index];
                if (
                    item !== undefined &&
                    (row ? item.node.placement.width : item.node.placement.height) ===
                        DesignSizing.Fill
                ) {
                    flexible.add(index);
                }
            }
            const available: number = Math.max(0, main - itemGap * (line.length - 1));
            for (let pass: number = 0; pass <= line.length && flexible.size > 0; pass++) {
                const fixed: number = lengths.reduce(
                    (total: number, length: number, index: number): number =>
                        total + (flexible.has(index) ? 0 : length),
                    0,
                );
                const preferred: number = Math.max(0, (available - fixed) / flexible.size);
                const share: number =
                    itemGap < 0
                        ? DesignStackGeometry.fill(lengths, flexible, itemGap, main, preferred)
                        : preferred;
                let clamped: boolean = false;
                for (const index of [...flexible]) {
                    const item: DesignFlowItem | undefined = line[index];
                    if (item === undefined) {
                        throw new Error('Invalid flexible item');
                    }
                    const minimum: number = row
                        ? item.node.placement.minWidth
                        : item.node.placement.minHeight;
                    const maximum: number = row
                        ? item.node.placement.maxWidth
                        : item.node.placement.maxHeight;
                    lengths[index] = Math.max(minimum, Math.min(maximum, share));
                    if (share < minimum || share > maximum) {
                        flexible.delete(index);
                        clamped = true;
                    }
                }
                if (!clamped) {
                    break;
                }
            }
            const consumed: number = DesignStackGeometry.span(lengths, itemGap);
            const spare: number = Math.max(0, main - consumed);
            const gap: number =
                layout.justify === DesignAlign.Between && line.length > 1
                    ? itemGap + spare / (line.length - 1)
                    : itemGap;
            const offsetMain: number =
                layout.justify === DesignAlign.Center
                    ? spare / 2
                    : layout.justify === DesignAlign.End
                      ? spare
                      : 0;
            const positions: DesignStackPlacement = DesignStackGeometry.arrange(lengths, gap);
            const lineCross: number = crossLengths[lineIndex] ?? 0;
            const lineOffset: number = linePositions.offsets[lineIndex] ?? 0;
            for (let index: number = 0; index < line.length; index++) {
                const item: DesignFlowItem | undefined = line[index];
                const length: number | undefined = lengths[index];
                if (item === undefined || length === undefined) {
                    throw new Error('Invalid flex placement');
                }
                const fillCross: boolean =
                    (row ? item.node.placement.height : item.node.placement.width) ===
                        DesignSizing.Fill || layout.align === DesignAlign.Stretch;
                const naturalCross: number = row ? item.height : item.width;
                const minimum: number = row
                    ? item.node.placement.minHeight
                    : item.node.placement.minWidth;
                const maximum: number = row
                    ? item.node.placement.maxHeight
                    : item.node.placement.maxWidth;
                const sizeCross: number = Math.max(
                    minimum,
                    Math.min(maximum, fillCross ? lineCross : naturalCross),
                );
                const spareCross: number = Math.max(0, lineCross - sizeCross);
                const offset: number =
                    layout.align === DesignAlign.Center
                        ? spareCross / 2
                        : layout.align === DesignAlign.End
                          ? spareCross
                          : 0;
                output.push({
                    id: item.node.id,
                    x:
                        layout.padding.left +
                        (row ? offsetMain + (positions.offsets[index] ?? 0) : lineOffset + offset),
                    y:
                        layout.padding.top +
                        (row ? lineOffset + offset : offsetMain + (positions.offsets[index] ?? 0)),
                    width: row ? length : sizeCross,
                    height: row ? sizeCross : length,
                });
            }
        }
        return output;
    }
}
