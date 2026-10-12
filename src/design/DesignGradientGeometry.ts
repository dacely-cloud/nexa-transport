// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignPaintKind, type DesignPaint } from './DesignTypes.js';
import type { DesignGradientTransform } from './DesignGradientTypes.js';

/** The native exporter, browser shader and editing handles share the same gradient coordinate contract. */
export class DesignGradientGeometry {
    /** Legacy angle-only paints retain their exact original coverage without migrating stored records. */
    public static resolve(paint: DesignPaint): DesignGradientTransform {
        if (paint.gradient != null) {
            return paint.gradient;
        }
        if (paint.kind === DesignPaintKind.Radial) {
            return { startX: 0.5, startY: 0.5, endX: 1, endY: 0.5, axisX: 0.5, axisY: 1 };
        }
        const angle: number = (paint.angle * Math.PI) / 180;
        const x: number = Math.cos(angle) / 2;
        const y: number = -Math.sin(angle) / 2;
        return {
            startX: 0.5 - x,
            startY: 0.5 - y,
            endX: 0.5 + x,
            endY: 0.5 + y,
            axisX: 0.5 - x - y,
            axisY: 0.5 - y + x,
        };
    }
    /** Zero-length segments and singular radial axes have no finite inverse and are rejected atomically. */
    public static validate(value: DesignGradientTransform, kind: DesignPaintKind): void {
        const x: number = value.endX - value.startX;
        const y: number = value.endY - value.startY;
        if (x * x + y * y < 1e-12) {
            throw new Error('Gradient endpoints must be distinct.');
        }
        const determinant: number =
            x * (value.axisY - value.startY) - y * (value.axisX - value.startX);
        if (kind === DesignPaintKind.Radial && Math.abs(determinant) < 1e-6) {
            throw new Error('Radial gradient axes must span an area.');
        }
    }
    /** Angles use the original normalized coordinate convention, counterclockwise from the right in an upward Y axis. */
    public static angle(value: DesignGradientTransform): number {
        return (Math.atan2(value.startY - value.endY, value.endX - value.startX) * 180) / Math.PI;
    }
    /** A linear gradient rotates about its midpoint; radial axes rotate together around the center. */
    public static rotate(
        value: DesignGradientTransform,
        kind: DesignPaintKind,
        angle: number,
    ): DesignGradientTransform {
        const radians: number = ((angle - this.angle(value)) * Math.PI) / 180;
        const cosine: number = Math.cos(radians);
        const sine: number = Math.sin(radians);
        const centerX: number =
            kind === DesignPaintKind.Radial ? value.startX : (value.startX + value.endX) / 2;
        const centerY: number =
            kind === DesignPaintKind.Radial ? value.startY : (value.startY + value.endY) / 2;
        const x: (px: number, py: number) => number = (px: number, py: number): number =>
            centerX + (px - centerX) * cosine + (py - centerY) * sine;
        const y: (px: number, py: number) => number = (px: number, py: number): number =>
            centerY - (px - centerX) * sine + (py - centerY) * cosine;
        return {
            startX: x(value.startX, value.startY),
            startY: y(value.startX, value.startY),
            endX: x(value.endX, value.endY),
            endY: y(value.endX, value.endY),
            axisX: x(value.axisX, value.axisY),
            axisY: y(value.axisX, value.axisY),
        };
    }
}
