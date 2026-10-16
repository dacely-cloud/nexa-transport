// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignPathVerb as Verb, type DesignPathCommand } from './DesignTypes.js';
import { DesignValues as V } from './DesignValues.js';

/**
 * Ellipse-relative angles and radius preserve editable arcs, sectors and rings.
 * @additionalProperties false
 */
export interface DesignArcSettings {
    /**
     * Start angle in clockwise degrees from the right-hand ellipse axis.
     * @minimum -360
     * @maximum 360
     */
    readonly start: number;
    /**
     * Signed clockwise sweep; zero produces no painted curve.
     * @minimum -360
     * @maximum 360
     */
    readonly sweep: number;
    /**
     * Inner ellipse radius relative to the outer ellipse.
     * @minimum 0
     * @maximum 0.999
     */
    readonly innerRadius: number;
    /** Closed partial curves join the center or the inner arc; open curves retain ordinary SVG paint semantics. */
    readonly closed: boolean;
}

/** One ellipse-local point is shared by path generation and direct canvas controls. */
export interface DesignArcPoint {
    readonly x: number;
    readonly y: number;
}

/** Small cubic segments retain subpixel radial accuracy even at the largest supported design dimensions. */
export class DesignArcs {
    /** Every boundary validates all four settings and rejects ambiguous open rings. */
    public static parse(raw: unknown): DesignArcSettings {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'start',
            'sweep',
            'innerRadius',
            'closed',
        ]);
        const result: DesignArcSettings = {
            start: V.number(value['start'], -360, 360),
            sweep: V.number(value['sweep'], -360, 360),
            innerRadius: V.number(value['innerRadius'], 0, 0.999),
            closed: V.boolean(value['closed']),
        };
        if (!result.closed && result.innerRadius !== 0) {
            throw new Error('An open arc requires innerRadius:0. Close the path to create a ring.');
        }
        return Object.freeze(result);
    }

    /** Zero degrees is right and positive angles rotate clockwise in the layer's own coordinates. */
    public static point(
        width: number,
        height: number,
        angle: number,
        radius: number = 1,
    ): DesignArcPoint {
        const radians: number = (angle * Math.PI) / 180;
        return {
            x: (width / 2) * (1 + radius * Math.cos(radians)),
            y: (height / 2) * (1 + radius * Math.sin(radians)),
        };
    }

    /** Full rings use two independently closed, oppositely wound contours; partial rings retain their radial cuts. */
    public static path(
        settings: DesignArcSettings,
        width: number,
        height: number,
    ): readonly DesignPathCommand[] {
        const arc: DesignArcSettings = this.parse(settings);
        V.number(width, 0.01);
        V.number(height, 0.01);
        const first: DesignArcPoint = this.point(width, height, arc.start);
        const path: DesignPathCommand[] = [{ verb: Verb.Move, values: [first.x, first.y] }];
        if (arc.sweep === 0) {
            return path;
        }
        this.#curve(path, width, height, arc.start, arc.sweep, 1);
        if (!arc.closed) {
            return path;
        }
        const full: boolean = Math.abs(arc.sweep) === 360;
        if (arc.innerRadius > 0) {
            if (full) {
                path.push({ verb: Verb.Close, values: [] });
            }
            const inner: DesignArcPoint = this.point(
                width,
                height,
                arc.start + arc.sweep,
                arc.innerRadius,
            );
            path.push({ verb: full ? Verb.Move : Verb.Line, values: [inner.x, inner.y] });
            this.#curve(path, width, height, arc.start + arc.sweep, -arc.sweep, arc.innerRadius);
        } else if (!full) {
            path.push({ verb: Verb.Line, values: [width / 2, height / 2] });
        }
        path.push({ verb: Verb.Close, values: [] });
        return path;
    }

    static #curve(
        path: DesignPathCommand[],
        width: number,
        height: number,
        start: number,
        sweep: number,
        radius: number,
    ): void {
        const rx: number = (width / 2) * radius;
        const ry: number = (height / 2) * radius;
        const end: number = start + sweep;
        let angle: number = start;
        for (let index: number = 0; index < 18 && angle !== end; index++) {
            const grid: number =
                sweep > 0
                    ? (Math.floor(angle / 22.5) + 1) * 22.5
                    : (Math.ceil(angle / 22.5) - 1) * 22.5;
            const next: number = sweep > 0 ? Math.min(grid, end) : Math.max(grid, end);
            const a: number = (angle * Math.PI) / 180;
            const b: number = (next * Math.PI) / 180;
            const handle: number = (4 / 3) * Math.tan((b - a) / 4);
            path.push({
                verb: Verb.Cubic,
                values: [
                    this.#coordinate(width / 2 + rx * (Math.cos(a) - handle * Math.sin(a)), width),
                    this.#coordinate(
                        height / 2 + ry * (Math.sin(a) + handle * Math.cos(a)),
                        height,
                    ),
                    this.#coordinate(width / 2 + rx * (Math.cos(b) + handle * Math.sin(b)), width),
                    this.#coordinate(
                        height / 2 + ry * (Math.sin(b) - handle * Math.cos(b)),
                        height,
                    ),
                    this.#coordinate(width / 2 + rx * Math.cos(b), width),
                    this.#coordinate(height / 2 + ry * Math.sin(b), height),
                ],
            });
            angle = next;
        }
    }

    static #coordinate(value: number, extent: number): number {
        return Math.max(0, Math.min(extent, value));
    }
}
