// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignAlign, DesignFlow, DesignSizing, type DesignLayout } from './DesignTypes.js';
import type { DesignFlowItem, DesignLocalBox } from './DesignLayoutTypes.js';

/** Deterministic wrapping and bounded flex sizing for row and column auto layout. */
export class DesignFlex {
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
        const lines: DesignFlowItem[][] = [[]];
        let used: number = 0;
        for (const item of items) {
            let line: DesignFlowItem[] | undefined = lines.at(-1);
            if (line === undefined) {
                throw new Error('Invalid flex line');
            }
            const length: number = row ? item.width : item.height;
            if (layout.wrap && line.length > 0 && used + layout.gap + length > main) {
                line = [];
                lines.push(line);
                used = 0;
            }
            used += (line.length > 0 ? layout.gap : 0) + length;
            line.push(item);
        }
        const output: DesignLocalBox[] = [];
        let lineOffset: number = 0;
        for (const line of lines) {
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
            const available: number = Math.max(0, main - layout.gap * (line.length - 1));
            for (let pass: number = 0; pass <= line.length && flexible.size > 0; pass++) {
                const fixed: number = lengths.reduce(
                    (total: number, length: number, index: number): number =>
                        total + (flexible.has(index) ? 0 : length),
                    0,
                );
                const share: number = Math.max(0, (available - fixed) / flexible.size);
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
            const consumed: number =
                lengths.reduce((sum: number, length: number): number => sum + length, 0) +
                layout.gap * (line.length - 1);
            const spare: number = Math.max(0, main - consumed);
            const gap: number =
                layout.justify === DesignAlign.Between && line.length > 1
                    ? layout.gap + spare / (line.length - 1)
                    : layout.gap;
            let cursor: number =
                layout.justify === DesignAlign.Center
                    ? spare / 2
                    : layout.justify === DesignAlign.End
                      ? spare
                      : 0;
            const lineCross: number =
                lines.length === 1
                    ? cross
                    : Math.max(
                          ...line.map((item: DesignFlowItem): number =>
                              row ? item.height : item.width,
                          ),
                      );
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
                    x: layout.padding.left + (row ? cursor : lineOffset + offset),
                    y: layout.padding.top + (row ? lineOffset + offset : cursor),
                    width: row ? length : sizeCross,
                    height: row ? sizeCross : length,
                });
                cursor += length + gap;
            }
            lineOffset += lineCross + layout.rowGap;
        }
        return output;
    }
}
