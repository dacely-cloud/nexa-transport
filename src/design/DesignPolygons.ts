// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignPathVerb, type DesignPathCommand } from './DesignTypes.js';
import { DesignValues as V } from './DesignValues.js';

/**
 * A null inner radius produces a regular polygon; a ratio produces an alternating-radius star.
 * @additionalProperties false
 */
export interface DesignPolygonSettings {
    /**
     * Number of outer vertices.
     * @type integer
     * @minimum 3
     * @maximum 64
     */
    readonly points: number;
    /**
     * Inner radius relative to the outer circle, before fitting the authored box.
     * @minimum 0.01
     * @maximum 1
     */
    readonly innerRadius: number | null;
}

interface PolygonVertex {
    readonly x: number;
    readonly y: number;
}

/** Native and browser authoring share bounded, deterministic polygon and star geometry. */
export class DesignPolygons {
    /** Shape parameters remain compact and immutable across creation, editing and copying. */
    public static parse(raw: unknown): DesignPolygonSettings {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['points', 'innerRadius']);
        return Object.freeze({
            points: V.number(value['points'], 3, 64, true),
            innerRadius:
                value['innerRadius'] === null ? null : V.number(value['innerRadius'], 0.01, 1),
        });
    }

    /** The top vertex faces up and the tight path bounds match the authored width and height. */
    public static path(
        settings: DesignPolygonSettings,
        width: number,
        height: number,
    ): readonly DesignPathCommand[] {
        const shape: DesignPolygonSettings = this.parse(settings);
        V.number(width, 0.01);
        V.number(height, 0.01);
        const count: number = shape.points * (shape.innerRadius === null ? 1 : 2);
        const vertices: PolygonVertex[] = [];
        let left: number = Infinity;
        let top: number = Infinity;
        let right: number = -Infinity;
        let bottom: number = -Infinity;
        for (let index: number = 0; index < count; index++) {
            const angle: number = -Math.PI / 2 + (index * Math.PI * 2) / count;
            const radius: number = index % 2 === 0 ? 1 : (shape.innerRadius ?? 1);
            const x: number = Math.cos(angle) * radius;
            const y: number = Math.sin(angle) * radius;
            vertices.push({ x, y });
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
        }
        const path: DesignPathCommand[] = vertices.map(
            (vertex: PolygonVertex, index: number): DesignPathCommand => ({
                verb: index === 0 ? DesignPathVerb.Move : DesignPathVerb.Line,
                values: [
                    Math.round(((vertex.x - left) / (right - left)) * width * 1e9) / 1e9,
                    Math.round(((vertex.y - top) / (bottom - top)) * height * 1e9) / 1e9,
                ],
            }),
        );
        path.push({ verb: DesignPathVerb.Close, values: [] });
        return path;
    }
}
