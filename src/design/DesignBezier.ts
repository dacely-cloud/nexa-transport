// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignPathVerb as Verb, type DesignPathCommand } from './DesignTypes.js';

/** A Bezier control point in local vector coordinates. */
export interface DesignBezierPoint {
    readonly x: number;
    readonly y: number;
}
/** Two, three or four controls retain a line, quadratic or cubic segment respectively. */
export interface DesignBezierSegment {
    readonly points: readonly DesignBezierPoint[];
}
/** Dash phase restarts at each move; closed contours join painted runs across their seam. */
export interface DesignBezierContour {
    readonly segments: readonly DesignBezierSegment[];
    readonly closed: boolean;
}

interface BezierMetricNode {
    readonly segment: DesignBezierSegment;
    readonly start: number;
    readonly end: number;
    readonly length: number;
    readonly left: BezierMetricNode | null;
    readonly right: BezierMetricNode | null;
}

/** Curve-preserving subdivision and bounded arc-length measurement for arbitrary dash patterns. */
export class DesignBezier {
    #steps: number = 0;
    #trees: WeakMap<DesignBezierSegment, BezierMetricNode> = new WeakMap();

    /** Reads canonical editable commands without flattening their tangent controls. */
    public static contours(path: readonly DesignPathCommand[]): readonly DesignBezierContour[] {
        const contours: DesignBezierContour[] = [];
        let segments: DesignBezierSegment[] = [];
        let current: DesignBezierPoint | null = null;
        let first: DesignBezierPoint | null = null;
        let closed: boolean = false;
        for (const command of path) {
            if (command.verb === Verb.Move) {
                if (segments.length > 0) {
                    contours.push({ segments, closed });
                }
                segments = [];
                current = { x: command.values[0] ?? 0, y: command.values[1] ?? 0 };
                first = current;
                closed = false;
            } else if (command.verb === Verb.Close) {
                if (current === null || first === null) {
                    throw new Error('A closed contour needs a move.');
                }
                if (current.x !== first.x || current.y !== first.y) {
                    segments.push({ points: [current, first] });
                }
                current = first;
                closed = true;
            } else {
                if (current === null) {
                    throw new Error('A curve needs an initial move.');
                }
                const points: DesignBezierPoint[] = [current];
                for (let index: number = 0; index < command.values.length; index += 2) {
                    points.push({
                        x: command.values[index] ?? 0,
                        y: command.values[index + 1] ?? 0,
                    });
                }
                segments.push({ points });
                current = points.at(-1) ?? current;
                closed = false;
            }
        }
        if (segments.length > 0) {
            contours.push({ segments, closed });
        }
        return contours;
    }

    /** Chord and control-polygon bounds enclose the true length, including loops and stationary derivatives. */
    public length(segment: DesignBezierSegment): number {
        return this.#tree(segment).length;
    }

    /** Inverts arc length rather than assuming the curve parameter has constant speed. */
    public parameter(segment: DesignBezierSegment, distance: number, length: number): number {
        if (distance <= 0 || length === 0) {
            return 0;
        }
        if (distance >= length) {
            return 1;
        }
        if (segment.points.length === 2) {
            return distance / length;
        }
        let node: BezierMetricNode = this.#tree(segment);
        let offset: number = distance;
        while (node.left !== null && node.right !== null) {
            if (offset <= node.left.length) {
                node = node.left;
            } else {
                offset -= node.left.length;
                node = node.right;
            }
        }
        const first: DesignBezierPoint | undefined = node.segment.points[0];
        const last: DesignBezierPoint | undefined = node.segment.points.at(-1);
        if (first === undefined || last === undefined) {
            throw new Error('Missing curve controls.');
        }
        const dx: number = last.x - first.x;
        const dy: number = last.y - first.y;
        const squared: number = dx * dx + dy * dy;
        const target: number =
            node.length === 0 ? 0 : Math.min(1, Math.max(0, offset / node.length));
        if (squared === 0) {
            return node.start + (node.end - node.start) * target;
        }
        let lower: number = 0;
        let upper: number = 1;
        for (let iteration: number = 0; iteration < 32; iteration++) {
            const middle: number = (lower + upper) / 2;
            const point: DesignBezierPoint | undefined = DesignBezier.split(
                node.segment,
                middle,
            )[0].points.at(-1);
            if (point === undefined) {
                throw new Error('Missing curve sample.');
            }
            const measured: number =
                ((point.x - first.x) * dx + (point.y - first.y) * dy) / squared;
            if (measured < target) {
                lower = middle;
            } else {
                upper = middle;
            }
        }
        return node.start + ((node.end - node.start) * (lower + upper)) / 2;
    }

    /** De Casteljau subdivision keeps both tangents and the exact split endpoint. */
    public static split(
        segment: DesignBezierSegment,
        t: number,
    ): readonly [DesignBezierSegment, DesignBezierSegment] {
        let controls: readonly DesignBezierPoint[] = segment.points;
        const left: DesignBezierPoint[] = [];
        const right: DesignBezierPoint[] = [];
        while (controls.length > 0) {
            const first: DesignBezierPoint | undefined = controls[0];
            const last: DesignBezierPoint | undefined = controls.at(-1);
            if (first === undefined || last === undefined) {
                break;
            }
            left.push(first);
            right.unshift(last);
            const next: DesignBezierPoint[] = [];
            for (let index: number = 1; index < controls.length; index++) {
                const a: DesignBezierPoint | undefined = controls[index - 1];
                const b: DesignBezierPoint | undefined = controls[index];
                if (a !== undefined && b !== undefined) {
                    next.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
                }
            }
            controls = next;
        }
        return [{ points: left }, { points: right }];
    }

    /** Restricts a curve to an interval while retaining its original polynomial degree. */
    public static slice(
        segment: DesignBezierSegment,
        start: number,
        end: number,
    ): DesignBezierSegment {
        const prefix: DesignBezierSegment = end >= 1 ? segment : this.split(segment, end)[0];
        return start <= 0 ? prefix : this.split(prefix, start / end)[1];
    }

    /** Emits an editable line or curve; the caller controls contour moves and joins. */
    public static command(segment: DesignBezierSegment): DesignPathCommand {
        const count: number = segment.points.length;
        if (count < 2 || count > 4) {
            throw new Error('Invalid Bezier control count.');
        }
        return {
            verb: count === 2 ? Verb.Line : count === 3 ? Verb.Quadratic : Verb.Cubic,
            values: segment.points
                .slice(1)
                .flatMap((point: DesignBezierPoint): readonly number[] => [point.x, point.y]),
        };
    }

    #tree(segment: DesignBezierSegment): BezierMetricNode {
        const cached: BezierMetricNode | undefined = this.#trees.get(segment);
        if (cached !== undefined) {
            return cached;
        }
        const tree: BezierMetricNode = this.#measure(segment, 0.00005, 0, 0, 1);
        this.#trees.set(segment, tree);
        return tree;
    }

    #measure(
        segment: DesignBezierSegment,
        tolerance: number,
        depth: number,
        start: number,
        end: number,
    ): BezierMetricNode {
        this.#steps += 1;
        if (this.#steps > 2_000_000) {
            throw new Error('Dashed curve exceeds the geometry work budget.');
        }
        const points: readonly DesignBezierPoint[] = segment.points;
        const first: DesignBezierPoint | undefined = points[0];
        const last: DesignBezierPoint | undefined = points.at(-1);
        if (first === undefined || last === undefined) {
            throw new Error('Missing curve controls.');
        }
        const lower: number = Math.hypot(last.x - first.x, last.y - first.y);
        let upper: number = 0;
        for (let index: number = 1; index < points.length; index++) {
            const a: DesignBezierPoint | undefined = points[index - 1];
            const b: DesignBezierPoint | undefined = points[index];
            if (a !== undefined && b !== undefined) {
                upper += Math.hypot(b.x - a.x, b.y - a.y);
            }
        }
        if (upper - lower <= tolerance * 2) {
            return { segment, start, end, length: (upper + lower) / 2, left: null, right: null };
        }
        if (depth >= 24) {
            throw new Error('Dashed curve cannot meet the arc-length tolerance.');
        }
        const split: readonly [DesignBezierSegment, DesignBezierSegment] = DesignBezier.split(
            segment,
            0.5,
        );
        const middle: number = (start + end) / 2;
        const left: BezierMetricNode = this.#measure(
            split[0],
            tolerance / 2,
            depth + 1,
            start,
            middle,
        );
        const right: BezierMetricNode = this.#measure(
            split[1],
            tolerance / 2,
            depth + 1,
            middle,
            end,
        );
        return { segment, start, end, length: left.length + right.length, left, right };
    }
}
