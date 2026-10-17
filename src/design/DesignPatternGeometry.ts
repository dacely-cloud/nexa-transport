// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignImageFit, type DesignPaint, type DesignImageFraming } from './DesignTypes.js';
import { DesignDefaults } from './DesignDefaults.js';

/** Linked vector artwork shares image framing while defaulting to intrinsic-size repetition. */
export class DesignPatternGeometry {
    /** Explicit framing remains editable, including affine placement and independent repeat cells. */
    public static framing(paint: DesignPaint): DesignImageFraming {
        return paint.framing ?? { ...DesignDefaults.framing(), fit: DesignImageFit.Tile };
    }
}
