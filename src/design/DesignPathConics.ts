// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignPathVerb as Verb, type DesignPathCommand } from './DesignTypes.js';

interface Conic {
    readonly x0: number;
    readonly y0: number;
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
    readonly weight: number;
}
interface Sample {
    readonly x: number;
    readonly y: number;
    readonly dx: number;
    readonly dy: number;
}

/** Retains editable Bezier curves when Skia emits rational conics for ellipses and strokes. */
export class DesignPathConics {
    /** Immediately validates native FFI output and enforces the document's path budget. */
    public static decode(raw: unknown): readonly DesignPathCommand[] {
        if (!Array.isArray(raw) || raw.length > 10000) {
            throw new Error('Boolean result exceeds the vector command budget.');
        }
        const output: DesignPathCommand[] = [];
        let x: number = 0;
        let y: number = 0;
        let startX: number = 0;
        let startY: number = 0;
        const entries: readonly unknown[] = raw;
        const lengths: readonly number[] = [3, 3, 5, 6, 7, 1];
        for (const entry of entries) {
            const value: unknown = entry;
            if (!Array.isArray(value) || value.length < 1 || value.length > 7) {
                throw new Error('Invalid native vector command.');
            }
            const parts: readonly unknown[] = value;
            const command: number[] = [];
            for (const part of parts) {
                if (typeof part !== 'number' || !Number.isFinite(part)) {
                    throw new Error('Invalid native vector coordinate.');
                }
                command.push(part);
            }
            const tag: number | undefined = command[0];
            if (
                tag === undefined ||
                !Number.isInteger(tag) ||
                tag < 0 ||
                tag > 5 ||
                command.length !== lengths[tag]
            ) {
                throw new Error('Invalid native vector verb or coordinate count.');
            }
            if (output.length === 0 && tag !== 0) {
                throw new Error('A native vector path must start with a move.');
            }
            if (tag === 3) {
                const weight: number = command[5] ?? 0;
                if (weight <= 0 || weight > 1_000_000) {
                    throw new Error('Invalid native conic weight.');
                }
                const conic: Conic = {
                    x0: x,
                    y0: y,
                    x1: command[1] ?? 0,
                    y1: command[2] ?? 0,
                    x2: command[3] ?? 0,
                    y2: command[4] ?? 0,
                    weight,
                };
                if (weight === 1) {
                    this.#push(output, Verb.Quadratic, command.slice(1, 5));
                } else {
                    this.#curve(output, conic, 0, 1, 0);
                }
                x = conic.x2;
                y = conic.y2;
            } else if (tag === 5) {
                this.#push(output, Verb.Close, []);
                x = startX;
                y = startY;
            } else {
                const verb:
                    | typeof Verb.Move
                    | typeof Verb.Line
                    | typeof Verb.Quadratic
                    | typeof Verb.Cubic =
                    tag === 0
                        ? Verb.Move
                        : tag === 1
                          ? Verb.Line
                          : tag === 2
                            ? Verb.Quadratic
                            : Verb.Cubic;
                this.#push(output, verb, command.slice(1));
                x = command[command.length - 2] ?? 0;
                y = command[command.length - 1] ?? 0;
                if (tag === 0) {
                    startX = x;
                    startY = y;
                }
            }
        }
        return output;
    }
    static #push(output: DesignPathCommand[], verb: Verb, values: readonly number[]): void {
        if (output.length >= 10000) {
            throw new Error('Boolean result exceeds the vector command budget.');
        }
        if (
            values.some(
                (value: number): boolean => !Number.isFinite(value) || Math.abs(value) > 100_000,
            )
        ) {
            throw new Error('Boolean result exceeds the editable coordinate range.');
        }
        output.push({ verb, values });
    }
    static #curve(
        output: DesignPathCommand[],
        conic: Conic,
        start: number,
        end: number,
        depth: number,
    ): void {
        const a: Sample = this.#sample(conic, start);
        const b: Sample = this.#sample(conic, end);
        const span: number = end - start;
        const x1: number = a.x + (a.dx * span) / 3;
        const y1: number = a.y + (a.dy * span) / 3;
        const x2: number = b.x - (b.dx * span) / 3;
        const y2: number = b.y - (b.dy * span) / 3;
        const error: number = this.#bound(conic, start, end, a, b, x1, y1, x2, y2);
        if (error > 0.00025) {
            if (depth >= 16) {
                throw new Error('Native curve cannot meet the editable geometry tolerance.');
            }
            const middle: number = (start + end) / 2;
            this.#curve(output, conic, start, middle, depth + 1);
            this.#curve(output, conic, middle, end, depth + 1);
        } else {
            this.#push(output, Verb.Cubic, [x1, y1, x2, y2, b.x, b.y]);
        }
    }
    /** The rational-minus-cubic numerator has degree five; its Bernstein hull bounds the whole interval. */
    static #bound(
        conic: Conic,
        start: number,
        end: number,
        a: Sample,
        b: Sample,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
    ): number {
        const span: number = end - start;
        const k: number = 2 * (conic.weight - 1);
        const denominator: readonly number[] = [
            1 + k * start * (1 - start),
            k * span * (1 - 2 * start),
            -k * span * span,
        ];
        const coordinate: (
            p0: number,
            p1: number,
            p2: number,
            begin: number,
            finish: number,
            c1: number,
            c2: number,
        ) => number = (
            p0: number,
            p1: number,
            p2: number,
            begin: number,
            finish: number,
            c1: number,
            c2: number,
        ): number => {
            const q0: number = p0 - begin;
            const q1: number = 2 * (conic.weight * (p1 - begin) - q0);
            const q2: number = q0 - 2 * conic.weight * (p1 - begin) + p2 - begin;
            const numerator: readonly number[] = [
                q0 + q1 * start + q2 * start * start,
                span * (q1 + 2 * q2 * start),
                q2 * span * span,
            ];
            const curve: readonly number[] = [
                0,
                3 * (c1 - begin),
                3 * (c2 - 2 * c1 + begin),
                finish - begin + 3 * (c1 - c2),
            ];
            const difference: number[] = [0, 0, 0, 0, 0, 0];
            for (let i: number = 0; i < difference.length; i++) {
                let value: number = numerator[i] ?? 0;
                for (let j: number = 0; j < denominator.length; j++) {
                    value -= (denominator[j] ?? 0) * (curve[i - j] ?? 0);
                }
                difference[i] = value;
            }
            const chooseFive: readonly number[] = [1, 5, 10, 10, 5, 1];
            let maximum: number = 0;
            for (let i: number = 0; i < 6; i++) {
                let control: number = 0;
                let choose: number = 1;
                for (let j: number = 0; j <= i; j++) {
                    control += ((difference[j] ?? 0) * choose) / (chooseFive[j] ?? 1);
                    choose = (choose * (i - j)) / (j + 1);
                }
                maximum = Math.max(maximum, Math.abs(control));
            }
            return maximum;
        };
        const at: (t: number) => number = (t: number): number => 1 + k * t * (1 - t);
        const minimum: number = Math.min(
            at(start),
            at(end),
            start <= 0.5 && end >= 0.5 ? at(0.5) : Infinity,
        );
        const error: number =
            Math.hypot(
                coordinate(conic.x0, conic.x1, conic.x2, a.x, b.x, x1, x2),
                coordinate(conic.y0, conic.y1, conic.y2, a.y, b.y, y1, y2),
            ) / minimum;
        if (!Number.isFinite(error) || minimum <= 0) {
            throw new Error('Invalid native rational curve.');
        }
        return error;
    }
    static #sample(conic: Conic, t: number): Sample {
        const u: number = 1 - t;
        const denominator: number = u * u + 2 * conic.weight * u * t + t * t;
        const derivative: number = 2 * (conic.weight - 1) * (1 - 2 * t);
        const x: number = u * u * conic.x0 + 2 * conic.weight * u * t * conic.x1 + t * t * conic.x2;
        const y: number = u * u * conic.y0 + 2 * conic.weight * u * t * conic.y1 + t * t * conic.y2;
        const dx: number =
            2 *
            ((conic.weight * conic.x1 - conic.x0) * u + (conic.x2 - conic.weight * conic.x1) * t);
        const dy: number =
            2 *
            ((conic.weight * conic.y1 - conic.y0) * u + (conic.y2 - conic.weight * conic.y1) * t);
        return {
            x: x / denominator,
            y: y / denominator,
            dx: (dx * denominator - x * derivative) / (denominator * denominator),
            dy: (dy * denominator - y * derivative) / (denominator * denominator),
        };
    }
}
