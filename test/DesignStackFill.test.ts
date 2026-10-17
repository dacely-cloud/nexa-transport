// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignStackGeometry } from '../src/design/DesignStackGeometry.js';

interface Endpoint {
    readonly constant: number;
    readonly coefficient: number;
}

/** Small reproducible samples include fitting and infeasible overlap envelopes. */
class Samples {
    #seed: number = 417;

    /** Selects a bounded test integer without depending on process randomness. */
    public next(maximum: number): number {
        this.#seed = (this.#seed * 1664525 + 1013904223) >>> 0;
        return this.#seed % maximum;
    }
}

/** An independent quadratic oracle intersects every end-minus-start inequality. */
class FillOracle {
    /** The largest feasible common track size satisfies all pairwise occupied distances. */
    public static solve(
        lengths: readonly number[],
        flexible: ReadonlySet<number>,
        gap: number,
        available: number,
        fallback: number,
    ): number {
        const starts: Endpoint[] = [];
        const ends: Endpoint[] = [];
        let constant: number = 0;
        let coefficient: number = 0;
        for (let index: number = 0; index < lengths.length; index++) {
            starts.push({ constant, coefficient });
            constant += flexible.has(index) ? 0 : (lengths[index] ?? 0);
            coefficient += flexible.has(index) ? 1 : 0;
            ends.push({ constant, coefficient });
            constant += gap;
        }
        let lower: number = 0;
        let upper: number = available;
        for (const end of ends) {
            for (const start of starts) {
                const coefficient: number = end.coefficient - start.coefficient;
                const bound: number = available - end.constant + start.constant;
                if (coefficient > 0) {
                    upper = Math.min(upper, bound / coefficient);
                } else if (coefficient < 0) {
                    lower = Math.max(lower, bound / coefficient);
                } else if (bound < 0) {
                    return fallback;
                }
            }
        }
        return lower <= upper ? upper : fallback;
    }
}

test('signed Fill allocation agrees with independent linear inequalities across mixed fixed and flexible tracks', (): void => {
    const samples: Samples = new Samples();
    let feasible: number = 0;
    let overflowing: number = 0;
    for (let trial: number = 0; trial < 1000; trial++) {
        const lengths: readonly number[] = Array.from({ length: 2 + samples.next(8) }, (): number =>
            samples.next(101),
        );
        const flexible: Set<number> = new Set();
        for (let index: number = 0; index < lengths.length; index++) {
            if (samples.next(2) === 1) {
                flexible.add(index);
            }
        }
        if (flexible.size === 0) {
            flexible.add(samples.next(lengths.length));
        }
        const gap: number = -1 - samples.next(160);
        const available: number = 40 + samples.next(361);
        const fixed: number = lengths.reduce(
            (sum: number, length: number, index: number): number =>
                sum + (flexible.has(index) ? 0 : length),
            0,
        );
        const preferred: number = Math.max(
            0,
            (available - gap * (lengths.length - 1) - fixed) / flexible.size,
        );
        const expected: number = FillOracle.solve(lengths, flexible, gap, available, preferred);
        const actual: number = DesignStackGeometry.fill(
            lengths,
            flexible,
            gap,
            available,
            preferred,
        );
        expect(actual).toBeCloseTo(expected, 6);
        if (expected === preferred) {
            overflowing++;
        } else {
            feasible++;
        }
    }
    expect(feasible).toBeGreaterThan(200);
    expect(overflowing).toBeGreaterThan(200);
});
