// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    type DesignNode,
    type DesignBox,
    type DesignPathCommand,
} from './DesignTypes.js';
import type { DesignBooleanOperand } from './DesignBooleanTypes.js';
import { DesignSvgGeometry } from './DesignSvgGeometry.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignPathConics } from './DesignPathConics.js';

/** Resolves authored primitive geometry into the coordinate system of its editable Boolean owner. */
export class DesignBooleanGeometry {
    /** Layout scaling changes outlines while border width remains centered in resolved local pixels. */
    public static operand(
        node: DesignNode,
        box: DesignBox,
        owner: DesignBox,
    ): DesignBooleanOperand {
        if (
            ![
                DesignKind.Rectangle,
                DesignKind.Ellipse,
                DesignKind.Line,
                DesignKind.Polygon,
                DesignKind.Path,
                DesignKind.Image,
                DesignKind.Boolean,
                DesignKind.Group,
            ].some((kind: DesignKind): boolean => kind === node.kind)
        ) {
            throw new Error(
                'This layer requires an editable vector outline before using Boolean operations.',
            );
        }
        let outline: string;
        if (node.kind === DesignKind.Ellipse) {
            const x: number = box.width / 2;
            const y: number = box.height / 2;
            outline = `M0 ${y} A${x} ${y} 0 1 1 ${box.width} ${y} A${x} ${y} 0 1 1 0 ${y} Z`;
        } else if (
            node.kind === DesignKind.Path ||
            node.kind === DesignKind.Polygon ||
            node.kind === DesignKind.Line ||
            node.kind === DesignKind.Boolean ||
            node.path.length > 0
        ) {
            outline = DesignPaths.scale(node.path, box.width / node.width, box.height / node.height)
                .map((command): string => command.verb + command.values.join(' '))
                .join(' ');
        } else {
            outline = DesignSvgGeometry.rounded(box.width, box.height, node.style.corners);
        }
        return {
            outline,
            filled: node.visible && (node.style.fills.length > 0 || node.image !== null),
            stroke: node.visible ? node.style.stroke : null,
            matrix: this.matrix(box, owner),
        };
    }
    /** Resolved local coordinates map into the Boolean owner's coordinate system. */
    public static matrix(box: DesignBox, owner: DesignBox): readonly number[] {
        const angle: number = ((box.rotation - owner.rotation) * Math.PI) / 180;
        const parent: number = (owner.rotation * Math.PI) / 180;
        const cosine: number = Math.cos(angle);
        const sine: number = Math.sin(angle);
        const dx: number = box.x + box.width / 2 - owner.x - owner.width / 2;
        const dy: number = box.y + box.height / 2 - owner.y - owner.height / 2;
        return [
            cosine,
            -sine,
            owner.width / 2 +
                Math.cos(parent) * dx +
                Math.sin(parent) * dy -
                (cosine * box.width) / 2 +
                (sine * box.height) / 2,
            sine,
            cosine,
            owner.height / 2 -
                Math.sin(parent) * dx +
                Math.cos(parent) * dy -
                (sine * box.width) / 2 -
                (cosine * box.height) / 2,
            0,
            0,
            1,
        ];
    }
    /** Pure editable curves let nonuniform resize retain geometry without asynchronous native allocation. */
    public static path(
        node: DesignNode,
        width: number,
        height: number,
    ): readonly DesignPathCommand[] {
        if (
            node.path.length > 0 ||
            node.kind === DesignKind.Boolean ||
            node.kind === DesignKind.Path ||
            node.kind === DesignKind.Line ||
            node.kind === DesignKind.Polygon
        ) {
            return DesignPaths.scale(node.path, width / node.width, height / node.height);
        }
        const weight: number = Math.SQRT1_2;
        if (node.kind === DesignKind.Ellipse) {
            const x: number = width / 2;
            const y: number = height / 2;
            return DesignPathConics.decode([
                [0, x, 0],
                [3, width, 0, width, y, weight],
                [3, width, height, x, height, weight],
                [3, 0, height, 0, y, weight],
                [3, 0, 0, x, 0, weight],
                [5],
            ]);
        }
        const limit: number = Math.min(width, height) / 2;
        const a: number = Math.min(limit, node.style.corners.topLeft);
        const b: number = Math.min(limit, node.style.corners.topRight);
        const c: number = Math.min(limit, node.style.corners.bottomRight);
        const d: number = Math.min(limit, node.style.corners.bottomLeft);
        return DesignPathConics.decode([
            [0, a, 0],
            [1, width - b, 0],
            b > 0 ? [3, width, 0, width, b, weight] : [1, width, 0],
            [1, width, height - c],
            c > 0 ? [3, width, height, width - c, height, weight] : [1, width, height],
            [1, d, height],
            d > 0 ? [3, 0, height, 0, height - d, weight] : [1, 0, height],
            [1, 0, a],
            a > 0 ? [3, 0, 0, a, 0, weight] : [1, 0, 0],
            [5],
        ]);
    }
}
