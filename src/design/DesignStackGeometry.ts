// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Occupied tracks retain authored order even when a signed gap reverses their positions. */
export interface DesignStackPlacement {
    readonly offsets: readonly number[];
    readonly size: number;
}

interface StackBounds {
    readonly minimum: number;
    readonly size: number;
}

interface FillBounds {
    readonly size: number;
    readonly slope: number;
}

/** Shared signed-spacing geometry for intrinsic sizing, flex lines and grid tracks. */
export class DesignStackGeometry {
    /** Intrinsic extent is the union of every item, not the final cursor position. */
    public static span(lengths: readonly number[], gap: number): number {
        return this.#bounds(lengths, gap, 0).size;
    }

    /** Equal tracks may move backward; their occupied extent is always nonnegative. */
    public static uniform(length: number, count: number, gap: number): number {
        return count === 0 ? 0 : length + Math.max(0, count - 1) * Math.abs(length + gap);
    }

    /** Normalize the occupied envelope to its leading edge without reordering any identities. */
    public static arrange(lengths: readonly number[], gap: number): DesignStackPlacement {
        const bounds: StackBounds = this.#bounds(lengths, gap, 0);
        let cursor: number = -bounds.minimum;
        const offsets: number[] = lengths.map((length: number): number => {
            const result: number = cursor;
            cursor += length + gap;
            return result;
        });
        return { offsets, size: bounds.size };
    }

    /**
     * Equal growth fills an available envelope even when negative spacing initially shrinks it.
     * @remarks The occupied span is convex in growth. Since zero is feasible, its sublevel
     * set is one interval; bounded bisection finds its upper end without pairwise track scans.
     */
    public static growth(lengths: readonly number[], gap: number, available: number): number {
        const occupied: number = this.span(lengths, gap);
        if (lengths.length === 0 || available <= occupied) {
            return 0;
        }
        if (gap >= 0) {
            return (available - occupied) / lengths.length;
        }
        const total: number =
            lengths.reduce((sum: number, length: number): number => sum + length, 0) +
            gap * (lengths.length - 1);
        const direct: number = (available - total) / lengths.length;
        if (direct >= 0 && Math.abs(this.#bounds(lengths, gap, direct).size - available) <= 1e-9) {
            return direct;
        }
        let low: number = 0;
        let high: number = available + Math.abs(gap);
        for (let iteration: number = 0; iteration < 56; iteration++) {
            const middle: number = (low + high) / 2;
            if (this.#bounds(lengths, gap, middle).size > available) {
                high = middle;
            } else {
                low = middle;
            }
        }
        return (low + high) / 2;
    }

    /**
     * Equal Fill tracks occupy the available envelope even when fixed siblings fold inside them.
     * @remarks With fixed track sizes, every endpoint is affine in the common Fill size.
     * Their occupied span is convex. Tangent steps locate the upper feasible root quickly;
     * bounded derivative and extent searches cover longer piecewise-linear envelopes.
     * Infeasible fixed sizes or gaps retain the ordinary overflow allocation.
     */
    public static fill(
        lengths: readonly number[],
        flexible: ReadonlySet<number>,
        gap: number,
        available: number,
        preferred: number,
    ): number {
        if (this.#fillBounds(lengths, flexible, gap, preferred).size <= available + 1e-8) {
            return preferred;
        }
        let high: number = available;
        for (let iteration: number = 0; iteration < 8; iteration++) {
            const bounds: FillBounds = this.#fillBounds(lengths, flexible, gap, high);
            if (bounds.size <= available + 1e-8) {
                return high;
            }
            if (bounds.slope <= 0) {
                return preferred;
            }
            const next: number = high - (bounds.size - available) / bounds.slope;
            if (next < 0) {
                return preferred;
            }
            if (next === high) {
                break;
            }
            high = next;
        }
        let low: number = 0;
        if (this.#fillBounds(lengths, flexible, gap, low).size > available) {
            let minimum: number = high;
            for (let iteration: number = 0; iteration < 56; iteration++) {
                const middle: number = (low + minimum) / 2;
                if (this.#fillBounds(lengths, flexible, gap, middle).slope < 0) {
                    low = middle;
                } else {
                    minimum = middle;
                }
            }
            low = (low + minimum) / 2;
            if (this.#fillBounds(lengths, flexible, gap, low).size > available + 1e-8) {
                return preferred;
            }
        }
        for (let iteration: number = 0; iteration < 56; iteration++) {
            const middle: number = (low + high) / 2;
            if (this.#fillBounds(lengths, flexible, gap, middle).size > available) {
                high = middle;
            } else {
                low = middle;
            }
        }
        return low;
    }

    /** Right derivatives choose the greater end slope and smaller start slope at ties. */
    static #fillBounds(
        lengths: readonly number[],
        flexible: ReadonlySet<number>,
        gap: number,
        share: number,
    ): FillBounds {
        let cursor: number = 0;
        let slope: number = 0;
        let minimum: number = 0;
        let maximum: number = 0;
        let minimumSlope: number = 0;
        let maximumSlope: number = 0;
        for (let index: number = 0; index < lengths.length; index++) {
            if (cursor < minimum || (cursor === minimum && slope < minimumSlope)) {
                minimum = cursor;
                minimumSlope = slope;
            }
            const filled: boolean = flexible.has(index);
            const end: number = cursor + (filled ? share : (lengths[index] ?? 0));
            const endSlope: number = slope + (filled ? 1 : 0);
            if (end > maximum || (end === maximum && endSlope > maximumSlope)) {
                maximum = end;
                maximumSlope = endSlope;
            }
            cursor = end + gap;
            slope = endSlope;
        }
        return { size: maximum - minimum, slope: maximumSlope - minimumSlope };
    }

    static #bounds(lengths: readonly number[], gap: number, growth: number): StackBounds {
        let cursor: number = 0;
        let minimum: number = 0;
        let maximum: number = 0;
        for (const length of lengths) {
            minimum = Math.min(minimum, cursor);
            maximum = Math.max(maximum, cursor + length + growth);
            cursor += length + growth + gap;
        }
        return { minimum, size: maximum - minimum };
    }
}
