// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignFrameGridKind,
    DesignFrameGridDistribution,
    type DesignFrameGrid,
} from './DesignTypes.js';

/** One repeating pattern paints arbitrarily many cells without creating a shape per cell. */
export interface DesignFrameGridPattern {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly stepX: number;
    readonly stepY: number;
    readonly areaWidth: number;
    readonly areaHeight: number;
}
/** Pure local geometry keeps viewport rendering independent of document size and automatic layout. */
export class DesignFrameGridGeometry {
    /** Track sizes resolve from the current frame while margins and fixed metrics retain their saved units. */
    public static pattern(
        grid: DesignFrameGrid,
        width: number,
        height: number,
    ): DesignFrameGridPattern | null {
        if (!grid.visible || width <= 0 || height <= 0) {
            return null;
        }
        if (grid.kind === DesignFrameGridKind.Square) {
            return {
                x: grid.offset,
                y: grid.offset,
                width: grid.size,
                height: grid.size,
                stepX: grid.size,
                stepY: grid.size,
                areaWidth: width,
                areaHeight: height,
            };
        }
        const columns: boolean = grid.kind === DesignFrameGridKind.Columns;
        const extent: number = columns ? width : height;
        const available: number = Math.max(0, extent - grid.margin * 2);
        const size: number =
            grid.distribution === DesignFrameGridDistribution.Stretch
                ? Math.max(0, (available - grid.gutter * (grid.count - 1)) / grid.count)
                : grid.size;
        if (size <= 0) {
            return null;
        }
        const total: number = size * grid.count + grid.gutter * (grid.count - 1);
        const spare: number = available - total;
        const offset: number =
            grid.margin +
            grid.offset +
            (grid.distribution === DesignFrameGridDistribution.Center
                ? spare / 2
                : grid.distribution === DesignFrameGridDistribution.End
                  ? spare
                  : 0);
        return {
            x: columns ? offset : 0,
            y: columns ? 0 : offset,
            width: columns ? size : width,
            height: columns ? height : size,
            stepX: columns ? size + grid.gutter : width,
            stepY: columns ? height : size + grid.gutter,
            areaWidth: columns ? total : width,
            areaHeight: columns ? height : total,
        };
    }
    /** Fine square lines thin out at low zoom instead of becoming an opaque moire pattern. */
    public static squareStep(size: number, zoom: number): number {
        return size * 2 ** Math.max(0, Math.ceil(Math.log2(4 / (size * zoom))));
    }
}
