// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignGradientGeometry } from './DesignGradientGeometry.js';
import type { DesignGradientTransform } from './DesignGradientTypes.js';
import { DesignPaintKind, type DesignPaint, type DesignGradientStop } from './DesignTypes.js';

interface ColorStop {
    readonly offset: number;
    readonly channels: readonly number[];
}

/** Exported paint pixels use the same normalized basis and straight sRGB stop interpolation as WebGL. */
export class DesignGradientSampling {
    readonly #transform: DesignGradientTransform;
    readonly #stops: readonly ColorStop[];

    public constructor(public readonly paint: DesignPaint) {
        this.#transform = DesignGradientGeometry.resolve(paint);
        this.#stops = paint.stops.map((stop: DesignGradientStop): ColorStop => ({
            offset: stop.offset,
            channels: [
                parseInt(stop.color.slice(1, 3), 16),
                parseInt(stop.color.slice(3, 5), 16),
                parseInt(stop.color.slice(5, 7), 16),
                stop.color.length === 9 ? parseInt(stop.color.slice(7, 9), 16) : 255,
            ],
        }));
    }

    /** Angular colors progress clockwise in the authored basis; diamond distance follows four independent points. */
    public position(x: number, y: number): number {
        const g: DesignGradientTransform = this.#transform;
        const px: number = x - g.startX;
        const py: number = y - g.startY;
        const dx: number = g.endX - g.startX;
        const dy: number = g.endY - g.startY;
        const ax: number = g.axisX - g.startX;
        const ay: number = g.axisY - g.startY;
        const determinant: number = dx * ay - dy * ax;
        const u: number = (px * ay - py * ax) / determinant;
        const v: number = (dx * py - dy * px) / determinant;
        if (this.paint.kind === DesignPaintKind.Diamond) {
            return Math.abs(u) + Math.abs(v);
        }
        if (this.paint.kind === DesignPaintKind.Angular) {
            const angle: number = Math.atan2(v, u) / (2 * Math.PI);
            const wrapped: number = angle < 0 ? angle + 1 : angle;
            return wrapped >= 1 ? 0 : wrapped;
        }
        throw new Error('Raster export is reserved for angular and diamond gradients.');
    }

    /** Writes into a reused bounded row buffer without allocating a color object per pixel. */
    public write(position: number, destination: Uint8Array, offset: number): void {
        let low: number = 0;
        let high: number = this.#stops.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            const stop: ColorStop | undefined = this.#stops[middle];
            if (stop === undefined) {
                throw new Error('Missing gradient color stop.');
            }
            if (stop.offset <= position) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        const left: ColorStop | undefined = this.#stops[Math.max(0, low - 1)];
        const right: ColorStop | undefined = this.#stops[Math.min(this.#stops.length - 1, low)];
        if (left === undefined || right === undefined) {
            throw new Error('Missing gradient color stops.');
        }
        const weight: number =
            right.offset > left.offset
                ? Math.max(0, Math.min(1, (position - left.offset) / (right.offset - left.offset)))
                : 0;
        for (let channel: number = 0; channel < 4; channel++) {
            const start: number = left.channels[channel] ?? 0;
            destination[offset + channel] = Math.round(
                start + ((right.channels[channel] ?? 0) - start) * weight,
            );
        }
    }
}
