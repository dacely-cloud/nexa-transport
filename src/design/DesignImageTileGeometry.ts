// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignImageTileClip } from './DesignImageTileTypes.js';
import type { DesignImage } from './DesignTypes.js';
import { DesignImageSamplingGeometry } from './DesignImageSamplingGeometry.js';
import { DesignImageSamplingAlign, type DesignImageSampling } from './DesignImageSamplingTypes.js';

/** Source cropping is independent of cell placement and shared by image layers, fills and glyph rasters. */
export class DesignImageTileGeometry {
    /** SVG slice viewports retain source-filter clamping for the three supported source anchors. */
    public static sampling(
        clip: DesignImageTileClip,
        width: number,
        height: number,
    ): DesignImageSampling | null {
        if (Math.abs(clip.width - 1) > 1e-10 && Math.abs(clip.height - 1) > 1e-10) {
            return null;
        }
        const x: DesignImageSamplingAlign | null = this.#anchor(
            clip.width >= 1 ? 0 : clip.x / (1 - clip.width),
        );
        const y: DesignImageSamplingAlign | null = this.#anchor(
            clip.height >= 1 ? 0 : clip.y / (1 - clip.height),
        );
        return x === null || y === null
            ? null
            : { aspect: (clip.width * width) / (clip.height * height), alignX: x, alignY: y };
    }

    static #anchor(value: number): DesignImageSamplingAlign | null {
        return Math.abs(value) < 1e-10
            ? DesignImageSamplingAlign.Start
            : Math.abs(value - 0.5) < 1e-10
              ? DesignImageSamplingAlign.Center
              : Math.abs(value - 1) < 1e-10
                ? DesignImageSamplingAlign.End
                : null;
    }
    public static clip(
        image: DesignImage,
        width: number,
        height: number,
    ): DesignImageTileClip | null {
        const tile: DesignImageTileClip | null =
            image.fit === 'tile' ? (image.tile?.clip ?? null) : null;
        if (image.sampling == null) {
            return tile;
        }
        const rectangle: ReturnType<typeof DesignImageSamplingGeometry.rectangle> =
            DesignImageSamplingGeometry.rectangle(image.sampling, width, height);
        const x: number = Math.max(tile?.x ?? 0, rectangle.x / width);
        const y: number = Math.max(tile?.y ?? 0, rectangle.y / height);
        const right: number = Math.min(
            (tile?.x ?? 0) + (tile?.width ?? 1),
            (rectangle.x + rectangle.width) / width,
        );
        const bottom: number = Math.min(
            (tile?.y ?? 0) + (tile?.height ?? 1),
            (rectangle.y + rectangle.height) / height,
        );
        return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
    }
}
