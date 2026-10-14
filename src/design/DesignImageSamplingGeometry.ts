// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignImageSamplingAlign,
    type DesignImageSampling,
    type DesignImageSampleRectangle,
} from './DesignImageSamplingTypes.js';

/** Sampling a cropped source cannot bleed colors from pixels outside its original viewport. */
export class DesignImageSamplingGeometry {
    /** Slice retains one full intrinsic axis, with its other crop aligned before any affine map. */
    public static rectangle(
        value: DesignImageSampling,
        width: number,
        height: number,
    ): DesignImageSampleRectangle {
        const cropWidth: number = Math.min(width, height * value.aspect);
        const cropHeight: number = Math.min(height, width / value.aspect);
        return {
            x: (width - cropWidth) * this.#anchor(value.alignX),
            y: (height - cropHeight) * this.#anchor(value.alignY),
            width: cropWidth,
            height: cropHeight,
        };
    }
    static #anchor(value: DesignImageSamplingAlign): number {
        return value === DesignImageSamplingAlign.Start
            ? 0
            : value === DesignImageSamplingAlign.End
              ? 1
              : 0.5;
    }
}
