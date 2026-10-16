// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignStroke } from './DesignTypes.js';
import { DesignStrokeCap, DesignStrokeJoin } from './DesignStrokeTypes.js';

/** A normalized dash phase refers to the even repeated pattern, including odd source lists. */
export interface DesignStrokePhase {
    readonly index: number;
    readonly remaining: number;
}

/** Conservative painted extents are shared by native export and browser visibility. */
export class DesignStrokeGeometry {
    /** SVG offsets consume signed distance and restart independently on each subpath. */
    public static dashPhase(pattern: readonly number[], offset: number = 0): DesignStrokePhase {
        if (
            !Number.isFinite(offset) ||
            pattern.some((value: number): boolean => !Number.isFinite(value) || value < 0)
        ) {
            throw new Error('Invalid stroke dash phase.');
        }
        const count: number = pattern.length % 2 === 0 ? pattern.length : pattern.length * 2;
        const total: number =
            pattern.reduce((sum: number, value: number): number => sum + value, 0) *
            (count === pattern.length ? 1 : 2);
        if (total === 0) {
            return { index: 0, remaining: 0 };
        }
        let distance: number = ((offset % total) + total) % total;
        for (let index: number = 0; index < count; index++) {
            const length: number = pattern[index % pattern.length] ?? 0;
            if (distance < length) {
                return { index, remaining: length - distance };
            }
            distance -= length;
        }
        throw new Error('Stroke dash phase exceeds its pattern.');
    }
    /** Square caps may project diagonally and miter joins extend by their bounded ratio. */
    public static padding(stroke: DesignStroke | null): number {
        if (stroke === null) {
            return 0;
        }
        return (
            (stroke.width / 2) *
            Math.max(
                stroke.cap === DesignStrokeCap.Square ? Math.SQRT2 : 1,
                stroke.join === DesignStrokeJoin.Miter ? (stroke.miterLimit ?? 4) : 1,
            )
        );
    }
}
