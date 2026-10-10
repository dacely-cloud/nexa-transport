// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignImageFit, type DesignImageFraming, type DesignBox } from './DesignTypes.js';

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
        const contain: boolean = framing?.fit === DesignImageFit.Contain;
        const scale: number = contain
            ? Math.min(box.width / width, box.height / height)
            : Math.max(box.width / width, box.height / height) * (framing?.scale ?? 1);
        const paintedWidth: number = width * scale;
        const paintedHeight: number = height * scale;
        return {
            width: paintedWidth,
            height: paintedHeight,
            x:
                (box.width - paintedWidth) / 2 -
                (contain ? 0 : ((framing?.cropX ?? 0) * Math.max(0, paintedWidth - box.width)) / 2),
            y:
                (box.height - paintedHeight) / 2 -
                (contain
                    ? 0
                    : ((framing?.cropY ?? 0) * Math.max(0, paintedHeight - box.height)) / 2),
        };
    }
}
