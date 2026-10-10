// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignBox } from './DesignTypes.js';
import type { DesignSelectionGeometry } from './DesignSelectionTypes.js';

/** Center-based transforms match resolved layout without requiring an editable selection or unlocked ancestry. */
export class DesignBooleanTransforms {
    /** Removes the owner's world rotation and position. */
    public static local(box: DesignBox, parent: DesignBox | null): DesignSelectionGeometry {
        if (parent === null) {
            return {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
                rotation: box.rotation,
            };
        }
        const angle: number = (-parent.rotation * Math.PI) / 180;
        const dx: number = box.x + box.width / 2 - parent.x - parent.width / 2;
        const dy: number = box.y + box.height / 2 - parent.y - parent.height / 2;
        return {
            x: dx * Math.cos(angle) - dy * Math.sin(angle) + parent.width / 2 - box.width / 2,
            y: dx * Math.sin(angle) + dy * Math.cos(angle) + parent.height / 2 - box.height / 2,
            width: box.width,
            height: box.height,
            rotation: box.rotation - parent.rotation,
        };
    }
    /** Composes an authored local box with its parent's resolved world transform. */
    public static world(
        id: string,
        local: DesignSelectionGeometry,
        parent: DesignBox | null,
    ): DesignBox {
        if (parent === null) {
            return { id, ...local, depth: 0, clipId: null };
        }
        const angle: number = (parent.rotation * Math.PI) / 180;
        const dx: number = local.x + local.width / 2 - parent.width / 2;
        const dy: number = local.y + local.height / 2 - parent.height / 2;
        return {
            id,
            x:
                parent.x +
                parent.width / 2 +
                dx * Math.cos(angle) -
                dy * Math.sin(angle) -
                local.width / 2,
            y:
                parent.y +
                parent.height / 2 +
                dx * Math.sin(angle) +
                dy * Math.cos(angle) -
                local.height / 2,
            width: local.width,
            height: local.height,
            rotation: parent.rotation + local.rotation,
            depth: parent.depth + 1,
            clipId: parent.clipId,
        };
    }
}
