// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignImageSamplingAlign, type DesignImageSampling } from './DesignImageSamplingTypes.js';
import type { DesignSvgViewport } from './DesignSvgTransforms.js';
import type { DesignAsset } from './DesignAssetTypes.js';

/** Retains the original SVG slice viewport separately from transformed image positioning. */
export class DesignSvgImageSampling {
    /** Meet and stretch have no pre-filter crop; slice keeps its authored aspect and anchors. */
    public static from(
        viewport: DesignSvgViewport,
        width: number,
        height: number,
        asset: DesignAsset,
    ): DesignImageSampling | null {
        const paintedWidth: number = asset.width * viewport.matrix.a;
        const paintedHeight: number = asset.height * viewport.matrix.d;
        if (paintedWidth <= width + 1e-9 && paintedHeight <= height + 1e-9) {
            return null;
        }
        return {
            aspect: width / height,
            alignX: this.#anchor(
                paintedWidth > width ? viewport.matrix.e / (width - paintedWidth) : 0,
            ),
            alignY: this.#anchor(
                paintedHeight > height ? viewport.matrix.f / (height - paintedHeight) : 0,
            ),
        };
    }
    static #anchor(value: number): DesignImageSamplingAlign {
        return value < 0.25
            ? DesignImageSamplingAlign.Start
            : value > 0.75
              ? DesignImageSamplingAlign.End
              : DesignImageSamplingAlign.Center;
    }
}
