// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignBezier,
    type DesignBezierContour,
    type DesignBezierPoint,
    type DesignBezierSegment,
} from './DesignBezier.js';
import { DesignPathVerb as Verb, type DesignPathCommand } from './DesignTypes.js';

interface ContourBounds {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
}

/** Converts Skia's disjoint even-odd result contours to the document's nonzero winding rule. */
export class DesignPathWinding {
    /** Alternating nested contour orientation keeps holes open in SVG, GPU meshes and subsequent Boolean operations. */
    public static normalize(path: readonly DesignPathCommand[]): readonly DesignPathCommand[] {
        const contours: readonly DesignBezierContour[] = DesignBezier.contours(path);
        const bounds: readonly ContourBounds[] = contours.map(
            (contour: DesignBezierContour): ContourBounds => this.#bounds(contour),
        );
        const output: DesignPathCommand[] = [];
        let comparisons: number = 0;
        for (let index: number = 0; index < contours.length; index++) {
            const contour: DesignBezierContour | undefined = contours[index];
            if (contour === undefined) {
                continue;
            }
            const segment: DesignBezierSegment | undefined = contour.segments.find(
                (entry: DesignBezierSegment): boolean =>
                    entry.points.some(
                        (point: DesignBezierPoint): boolean =>
                            point.x !== entry.points[0]?.x || point.y !== entry.points[0]?.y,
                    ),
            );
            if (segment === undefined) {
                continue;
            }
            const point: DesignBezierPoint = this.#point(segment, 0.3819660112501051);
            let depth: number = 0;
            for (let other: number = 0; other < contours.length; other++) {
                const candidate: DesignBezierContour | undefined = contours[other];
                const box: ContourBounds | undefined = bounds[other];
                if (
                    other === index ||
                    candidate === undefined ||
                    box === undefined ||
                    point.x < box.left ||
                    point.x > box.right ||
                    point.y < box.top ||
                    point.y > box.bottom
                ) {
                    continue;
                }
                comparisons += candidate.segments.length;
                if (comparisons > 2_000_000) {
                    throw new Error('Boolean nesting exceeds the geometry work budget.');
                }
                if (this.contains(candidate, point)) {
                    depth += 1;
                }
            }
            const reverse: boolean = this.area(contour) > 0 !== (depth % 2 === 0);
            const segments: readonly DesignBezierSegment[] = reverse
                ? contour.segments
                      .toReversed()
                      .map((entry: DesignBezierSegment): DesignBezierSegment => ({
                          points: entry.points.toReversed(),
                      }))
                : contour.segments;
            const first: DesignBezierPoint | undefined = segments[0]?.points[0];
            if (first === undefined) {
                continue;
            }
            output.push({ verb: Verb.Move, values: [first.x, first.y] });
            for (const entry of segments) {
                output.push(DesignBezier.command(entry));
            }
            if (contour.closed) {
                output.push({ verb: Verb.Close, values: [] });
            }
            if (output.length > 10_000) {
                throw new Error('Boolean result exceeds the editable vector budget.');
            }
        }
        return output;
    }

    /** Exact polynomial integration gives the signed area, including tangent controls. */
    public static area(contour: DesignBezierContour): number {
        const origin: DesignBezierPoint | undefined = contour.segments[0]?.points[0];
        if (origin === undefined) {
            return 0;
        }
        let area: number = 0;
        for (const segment of contour.segments) {
            const x: readonly number[] = this.#coefficients(
                segment.points.map((point: DesignBezierPoint): number => point.x - origin.x),
            );
            const y: readonly number[] = this.#coefficients(
                segment.points.map((point: DesignBezierPoint): number => point.y - origin.y),
            );
            for (let i: number = 0; i < x.length; i++) {
                for (let j: number = 1; j < y.length; j++) {
                    area += (((x[i] ?? 0) * (y[j] ?? 0) - (y[i] ?? 0) * (x[j] ?? 0)) * j) / (i + j);
                }
            }
        }
        return area / 2;
    }

    /** Monotone curve intervals give ray intersections without turning curves into polygons. */
    public static contains(contour: DesignBezierContour, point: DesignBezierPoint): boolean {
        let crossings: number = 0;
        for (const segment of contour.segments) {
            const y: readonly number[] = this.#coefficients(
                segment.points.map((control: DesignBezierPoint): number => control.y),
            );
            const roots: readonly number[] = this.#roots(
                3 * (y[3] ?? 0),
                2 * (y[2] ?? 0),
                y[1] ?? 0,
            );
            const intervals: readonly number[] = [
                0,
                ...roots
                    .filter((t: number): boolean => t > 0 && t < 1)
                    .toSorted((a: number, b: number): number => a - b),
                1,
            ];
            for (let index: number = 1; index < intervals.length; index++) {
                let lower: number = intervals[index - 1] ?? 0;
                let upper: number = intervals[index] ?? 1;
                const first: number = this.#point(segment, lower).y;
                const last: number = this.#point(segment, upper).y;
                if (point.y < Math.min(first, last) || point.y >= Math.max(first, last)) {
                    continue;
                }
                for (let iteration: number = 0; iteration < 48; iteration++) {
                    const middle: number = (lower + upper) / 2;
                    if (this.#point(segment, middle).y < point.y === first < last) {
                        lower = middle;
                    } else {
                        upper = middle;
                    }
                }
                if (this.#point(segment, (lower + upper) / 2).x > point.x) {
                    crossings += 1;
                }
            }
        }
        return crossings % 2 === 1;
    }

    static #bounds(contour: DesignBezierContour): ContourBounds {
        let left: number = Infinity;
        let top: number = Infinity;
        let right: number = -Infinity;
        let bottom: number = -Infinity;
        for (const segment of contour.segments) {
            for (const point of segment.points) {
                left = Math.min(left, point.x);
                top = Math.min(top, point.y);
                right = Math.max(right, point.x);
                bottom = Math.max(bottom, point.y);
            }
        }
        return { left, top, right, bottom };
    }

    static #coefficients(values: readonly number[]): readonly number[] {
        const a: number = values[0] ?? 0;
        const b: number = values[1] ?? 0;
        const c: number = values[2] ?? 0;
        const d: number = values[3] ?? 0;
        if (values.length === 2) {
            return [a, b - a];
        }
        if (values.length === 3) {
            return [a, 2 * (b - a), a - 2 * b + c];
        }
        return [a, 3 * (b - a), 3 * (a - 2 * b + c), -a + 3 * b - 3 * c + d];
    }

    static #roots(a: number, b: number, c: number): readonly number[] {
        if (a === 0) {
            return b === 0 ? [] : [-c / b];
        }
        const discriminant: number = b * b - 4 * a * c;
        if (discriminant < 0) {
            return [];
        }
        const q: number = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(discriminant));
        return q === 0 ? [-b / (2 * a)] : [q / a, c / q];
    }

    static #point(segment: DesignBezierSegment, t: number): DesignBezierPoint {
        const point: DesignBezierPoint | undefined = DesignBezier.split(segment, t)[0].points.at(
            -1,
        );
        if (point === undefined) {
            throw new Error('Missing curve endpoint.');
        }
        return point;
    }
}
