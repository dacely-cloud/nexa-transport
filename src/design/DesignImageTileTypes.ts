// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignImageTransform } from './DesignImageTransformTypes.js';

/** An original-image source rectangle, normalized independently of its repeat cell. */
export interface DesignImageTileClip {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/** The framing matrix places the cell; content places the original raster inside that cell. */
export interface DesignImageTile {
    readonly content: DesignImageTransform;
    /** Cropping occurs before source filtering and never replaces the original image bytes. */
    readonly clip?: DesignImageTileClip | null;
}
