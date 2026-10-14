// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignImageFit, type DesignImageFraming, type DesignBox } from './DesignTypes.js';
import type { DesignImageTransform } from './DesignImageTransformTypes.js';

/** Intrinsic image placement in the local coordinate system of its painted box. */
export interface DesignImagePlacement {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/** One fitting calculation keeps SVG, glyph patterns and hardware sampling in agreement. */
export class DesignImageGeometry {
    /** Cover crops overflow; contain ignores latent crop settings and retains the complete image. */
    public static place(
        framing: DesignImageFraming | undefined,
        box: DesignBox,
        width: number,
        height: number,
    ): DesignImagePlacement {
        if (framing?.fit === DesignImageFit.Tile) {
            return { x: 0, y: 0, width: width * framing.scale, height: height * framing.scale };
        }
        if (framing?.fit === DesignImageFit.Stretch) {
            return { x: 0, y: 0, width: box.width, height: box.height };
        }
        const contain: boolean = framing?.fit === DesignImageFit.Contain;
        const radians: number = ((framing?.rotation ?? 0) * Math.PI) / 180;
        const cosine: number = Math.abs(Math.cos(radians));
        const sine: number = Math.abs(Math.sin(radians));
        const projectedWidth: number = cosine * box.width + sine * box.height;
        const projectedHeight: number = sine * box.width + cosine * box.height;
        const scale: number = contain
            ? Math.min(
                  box.width / (cosine * width + sine * height),
                  box.height / (sine * width + cosine * height),
              )
            : Math.max(projectedWidth / width, projectedHeight / height) * (framing?.scale ?? 1);
        const paintedWidth: number = width * scale;
        const paintedHeight: number = height * scale;
        return {
            width: paintedWidth,
            height: paintedHeight,
            x:
                (box.width - paintedWidth) / 2 -
                (contain
                    ? 0
                    : ((framing?.cropX ?? 0) * Math.max(0, paintedWidth - projectedWidth)) / 2),
            y:
                (box.height - paintedHeight) / 2 -
                (contain
                    ? 0
                    : ((framing?.cropY ?? 0) * Math.max(0, paintedHeight - projectedHeight)) / 2),
        };
    }

    /** Fit uses intrinsic axes; explicit affine placement replaces fit while retaining latent settings. */
    public static matrix(
        framing: DesignImageFraming | undefined,
        box: DesignBox,
        width: number,
        height: number,
    ): DesignImageTransform {
        if (box.width <= 0 || box.height <= 0) {
            return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
        }
        const placement: DesignImagePlacement = this.place(framing, box, width, height);
        const source: DesignImageTransform = framing?.transform ?? {
            a: placement.width / box.width,
            b: 0,
            c: 0,
            d: placement.height / box.height,
            tx: placement.x / box.width,
            ty: placement.y / box.height,
        };
        const radians: number = ((framing?.rotation ?? 0) * Math.PI) / 180;
        const cosine: number = Math.cos(radians);
        const sine: number = Math.sin(radians);
        const horizontal: number = framing?.flipX === true ? -1 : 1;
        const vertical: number = framing?.flipY === true ? -1 : 1;
        const orientation: DesignImageTransform = {
            a: cosine * horizontal,
            b: (sine * horizontal * box.width) / box.height,
            c: (-sine * vertical * box.height) / box.width,
            d: cosine * vertical,
            tx: 0,
            ty: 0,
        };
        const tx: number = 0.5 - (orientation.a + orientation.c) / 2;
        const ty: number = 0.5 - (orientation.b + orientation.d) / 2;
        return {
            a: orientation.a * source.a + orientation.c * source.b,
            b: orientation.b * source.a + orientation.d * source.b,
            c: orientation.a * source.c + orientation.c * source.d,
            d: orientation.b * source.c + orientation.d * source.d,
            tx: orientation.a * source.tx + orientation.c * source.ty + tx,
            ty: orientation.b * source.tx + orientation.d * source.ty + ty,
        };
    }

    /** Hardware texture sampling maps paint positions back to original image unit coordinates. */
    public static inverse(value: DesignImageTransform): DesignImageTransform {
        const determinant: number = value.a * value.d - value.b * value.c;
        if (!Number.isFinite(determinant) || determinant === 0) {
            throw new Error('Image transform cannot be inverted.');
        }
        return {
            a: value.d / determinant,
            b: -value.b / determinant,
            c: -value.c / determinant,
            d: value.a / determinant,
            tx: (value.c * value.ty - value.d * value.tx) / determinant,
            ty: (value.b * value.tx - value.a * value.ty) / determinant,
        };
    }
}
