// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignImageTileClip } from './DesignImageTileTypes.js';
import type { DesignSvgPatternRaster } from './DesignSvgPatternImage.js';
import { DesignSvgPatternImage } from './DesignSvgPatternImage.js';
import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';

/** Intrinsic image placement and its source viewport remain separate from the pattern's repeat cell. */
export interface DesignSvgPatternPlacementResult {
    readonly matrix: DesignSvgMatrix;
    readonly clip: DesignImageTileClip | null;
}

export class DesignSvgPatternPlacement {
    public static image(
        raster: DesignSvgPatternRaster,
        width: number,
        height: number,
    ): DesignSvgPatternPlacementResult | null {
        const a: Readonly<Record<string, string>> = {
            ...raster.element.attributes,
            ...raster.style,
        };
        const rawWidth: string = a['width'] ?? 'auto';
        const rawHeight: string = a['height'] ?? 'auto';
        let w: number | null =
            rawWidth === 'auto' ? null : DesignSvgNumbers.length(rawWidth, width);
        let h: number | null =
            rawHeight === 'auto' ? null : DesignSvgNumbers.length(rawHeight, height);
        if (w === null && h === null) {
            w = raster.asset.width;
            h = raster.asset.height;
        } else if (w === null) {
            w = ((h ?? raster.asset.height) * raster.asset.width) / raster.asset.height;
        } else if (h === null) {
            h = (w * raster.asset.height) / raster.asset.width;
        }
        if (w === null || h === null || w < 0 || h < 0) {
            throw new DesignSvgInputError('SVG pattern image dimensions must be nonnegative.');
        }
        if (w === 0 || h === 0) {
            return null;
        }
        const viewport: DesignSvgMatrix = T.viewport(
            w,
            h,
            `0 0 ${raster.asset.width} ${raster.asset.height}`,
            (a['preserveAspectRatio'] ?? 'xMidYMid meet').replace(/^defer\s+/u, ''),
        ).matrix;
        const pixelWidth: number = viewport.a * raster.asset.width;
        const pixelHeight: number = viewport.d * raster.asset.height;
        const x: number = Math.max(0, -viewport.e / pixelWidth);
        const y: number = Math.max(0, -viewport.f / pixelHeight);
        const right: number = Math.min(1, (w - viewport.e) / pixelWidth);
        const bottom: number = Math.min(1, (h - viewport.f) / pixelHeight);
        const overflow: string = a['overflow'] ?? 'hidden';
        if (!['hidden', 'clip', 'visible'].includes(overflow)) {
            throw new DesignSvgInputError('Unsupported SVG pattern image overflow.');
        }
        const clip: DesignImageTileClip | null =
            overflow === 'visible' || (x === 0 && y === 0 && right === 1 && bottom === 1)
                ? null
                : { x, y, width: right - x, height: bottom - y };
        return {
            matrix: T.multiply(
                DesignSvgPatternImage.matrix(raster, width, height),
                T.multiply(
                    {
                        ...T.identity,
                        e: DesignSvgNumbers.length(a['x'] ?? '0', width),
                        f: DesignSvgNumbers.length(a['y'] ?? '0', height),
                    },
                    T.multiply(viewport, {
                        ...T.identity,
                        a: raster.asset.width,
                        d: raster.asset.height,
                    }),
                ),
            ),
            clip,
        };
    }
}
