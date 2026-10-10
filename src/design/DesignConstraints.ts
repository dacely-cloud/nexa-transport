// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignConstraint, type DesignNode } from './DesignTypes.js';
import type { DesignSize, DesignLocalBox } from './DesignLayoutTypes.js';

interface Axis {
    readonly position: number;
    readonly size: number;
}

/** Absolute layout constraints preserve relations to a resized frame. */
export class DesignConstraints {
    /** Resolves both axes relative to authored and current parent dimensions. */
    public static box(
        node: DesignNode,
        parent: DesignNode,
        width: number,
        height: number,
        size: DesignSize,
    ): DesignLocalBox {
        const x: Axis = this.#axis(
            node.x,
            size.width,
            parent.width,
            width,
            node.placement.horizontal,
            node.placement.minWidth,
            node.placement.maxWidth,
        );
        const y: Axis = this.#axis(
            node.y,
            size.height,
            parent.height,
            height,
            node.placement.vertical,
            node.placement.minHeight,
            node.placement.maxHeight,
        );
        return { id: node.id, x: x.position, y: y.position, width: x.size, height: y.size };
    }
    static #axis(
        position: number,
        size: number,
        authored: number,
        available: number,
        constraint: DesignConstraint,
        minimum: number,
        maximum: number,
    ): Axis {
        const delta: number = available - authored;
        switch (constraint) {
            case DesignConstraint.Center:
                return { position: position + delta / 2, size };
            case DesignConstraint.End:
                return { position: position + delta, size };
            case DesignConstraint.Stretch:
                return { position, size: Math.max(minimum, Math.min(maximum, size + delta)) };
            case DesignConstraint.Scale:
                return {
                    position: (position * available) / authored,
                    size: Math.max(minimum, Math.min(maximum, (size * available) / authored)),
                };
            case DesignConstraint.Start:
                return { position, size };
        }
    }
}
