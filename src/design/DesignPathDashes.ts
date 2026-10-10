// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignBezier,
    type DesignBezierContour,
    type DesignBezierPoint,
    type DesignBezierSegment,
} from './DesignBezier.js';
import { DesignPathVerb as Verb, type DesignPathCommand } from './DesignTypes.js';

/** General SVG dash arrays retain editable curves and joins, including odd patterns and closed seams. */
export class DesignPathDashes {
    /** Returns only the painted centerline runs; the vector engine expands their centered borders afterward. */
    public static paint(
        path: readonly DesignPathCommand[],
        pattern: readonly number[],
    ): readonly DesignPathCommand[] {
        if (pattern.length === 0) {
            return path;
        }
        if (
            pattern.length > 16 ||
            pattern.some((value: number): boolean => !Number.isFinite(value) || value < 0)
        ) {
            throw new Error('Invalid vector dash pattern.');
        }
        const values: readonly number[] =
            pattern.length % 2 === 0 ? pattern : [...pattern, ...pattern];
        if (values.every((value: number): boolean => value === 0)) {
            return path;
        }
        const output: DesignPathCommand[] = [];
        const metric: DesignBezier = new DesignBezier();
        for (const contour of DesignBezier.contours(path)) {
            const runs: readonly (readonly DesignPathCommand[])[] = this.#contour(
                contour,
                values,
                metric,
            );
            for (const run of runs) {
                if (output.length + run.length > 10_000) {
                    throw new Error('Dash pattern exceeds the editable vector budget.');
                }
                output.push(...run);
            }
        }
        return output;
    }

    static #contour(
        contour: DesignBezierContour,
        values: readonly number[],
        metric: DesignBezier,
    ): readonly (readonly DesignPathCommand[])[] {
        const runs: DesignPathCommand[][] = [];
        let run: DesignPathCommand[] = [];
        let index: number = 0;
        while (values[index] === 0) {
            index += 1;
        }
        let remaining: number = values[index] ?? 0;
        const startsPainted: boolean = index % 2 === 0;
        let endsPainted: boolean = false;
        let commands: number = 0;
        let fragments: number = 0;
        let gap: boolean = false;
        for (const segment of contour.segments) {
            const length: number = metric.length(segment);
            let distance: number = 0;
            while (distance < length) {
                fragments += 1;
                if (fragments > 10_000) {
                    throw new Error('Dash pattern exceeds the editable vector budget.');
                }
                const take: number = Math.min(length - distance, remaining);
                if (take <= 0 || distance + take === distance) {
                    throw new Error('Dash lengths are below the usable geometry resolution.');
                }
                const painted: boolean = index % 2 === 0;
                if (painted) {
                    const start: number = metric.parameter(segment, distance, length);
                    const end: number = metric.parameter(segment, distance + take, length);
                    const part: DesignBezierSegment = DesignBezier.slice(segment, start, end);
                    const first: DesignBezierPoint | undefined = part.points[0];
                    if (first === undefined) {
                        throw new Error('Missing dashed curve endpoint.');
                    }
                    if (run.length === 0) {
                        run.push({ verb: Verb.Move, values: [first.x, first.y] });
                        commands += 1;
                    }
                    run.push(DesignBezier.command(part));
                    commands += 1;
                } else {
                    gap = true;
                    if (run.length > 0) {
                        runs.push(run);
                        run = [];
                    }
                }
                if (commands > 10_000) {
                    throw new Error('Dash pattern exceeds the editable vector budget.');
                }
                endsPainted = painted;
                distance += take;
                remaining -= take;
                if (remaining <= 0) {
                    do {
                        index = (index + 1) % values.length;
                    } while (values[index] === 0);
                    remaining = values[index] ?? 0;
                }
            }
        }
        if (run.length > 0) {
            runs.push(run);
        }
        if (contour.closed && startsPainted && endsPainted && runs.length > 0) {
            const first: DesignPathCommand[] | undefined = runs[0];
            const last: DesignPathCommand[] | undefined = runs.at(-1);
            if (first !== undefined && last !== undefined) {
                if (!gap) {
                    first.push({ verb: Verb.Close, values: [] });
                } else if (runs.length > 1) {
                    runs[0] = [...last, ...first.slice(1)];
                    runs.pop();
                }
            }
        }
        return runs;
    }
}
