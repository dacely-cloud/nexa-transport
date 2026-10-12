// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignStroke } from './DesignTypes.js';
import { DesignStrokeCap, DesignStrokeJoin } from './DesignStrokeTypes.js';

/** Conservative painted extents are shared by native export and browser visibility. */
export class DesignStrokeGeometry {
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
