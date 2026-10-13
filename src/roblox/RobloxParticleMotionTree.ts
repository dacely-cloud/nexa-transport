// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Operations for an associative, ordered particle motion transfer. */
export interface RobloxParticleTransfers {
    readonly interval: (
        index: number,
        begin: number,
        end: number,
        output: Float64Array,
        offset: number,
    ) => void;
    readonly identity: (output: Float64Array, offset: number) => void;
    readonly compose: (
        left: Float64Array,
        a: number,
        right: Float64Array,
        b: number,
        output: Float64Array,
        offset: number,
    ) => void;
}

/** Bounded range composition shared by scalar forces and rigid parent transport. */
export class RobloxParticleMotionTree {
    readonly #tree: Float64Array;
    readonly #leaves: number;
    readonly #left: Float64Array;
    readonly #right: Float64Array;
    readonly #partial: Float64Array;
    readonly #stride: number;
    readonly #operations: RobloxParticleTransfers;

    /** Precomputes interval products once; queries never replay earlier particle frames. */
    public constructor(
        public readonly times: readonly number[],
        stride: number,
        operations: RobloxParticleTransfers,
    ) {
        if (
            !Number.isInteger(stride) ||
            stride < 1 ||
            stride > 64 ||
            times.length < 2 ||
            times.length > 131073 ||
            times.some(
                (time: number, index: number): boolean =>
                    !Number.isFinite(time) ||
                    time < 0 ||
                    (index > 0 && time <= (times[index - 1] ?? 0)),
            )
        ) {
            throw new Error(
                'Particle motion requires bounded, ordered observation intervals and a valid coefficient stride',
            );
        }
        this.#stride = stride;
        this.#operations = operations;
        const count: number = times.length - 1;
        this.#leaves = 2 ** Math.ceil(Math.log2(count));
        this.#tree = new Float64Array(this.#leaves * 2 * this.#stride);
        this.#left = new Float64Array(this.#stride);
        this.#right = new Float64Array(this.#stride);
        this.#partial = new Float64Array(this.#stride);
        for (let index: number = 0; index < this.#leaves; index++) {
            const offset: number = (this.#leaves + index) * this.#stride;
            if (index < count) {
                this.#operations.interval(
                    index,
                    times[index] ?? 0,
                    times[index + 1] ?? 0,
                    this.#tree,
                    offset,
                );
            } else {
                this.#operations.identity(this.#tree, offset);
            }
        }
        for (let index: number = this.#leaves - 1; index > 0; index--) {
            this.#operations.compose(
                this.#tree,
                index * 2 * this.#stride,
                this.#tree,
                (index * 2 + 1) * this.#stride,
                this.#tree,
                index * this.#stride,
            );
        }
    }

    /** Writes an ordered birth-to-frame product into the caller's reusable buffer. */
    public sample(begin: number, end: number, output: Float64Array): void {
        const first: number = this.index(begin);
        const last: number = this.index(end);
        if (first === last) {
            this.#operations.interval(first, begin, end, output, 0);
            return;
        }
        this.#range(first + 1, last, output);
        this.#operations.interval(first, begin, this.times[first + 1] ?? end, this.#partial, 0);
        this.#operations.compose(this.#partial, 0, output, 0, output, 0);
        this.#operations.interval(last, this.times[last] ?? begin, end, this.#partial, 0);
        this.#operations.compose(output, 0, this.#partial, 0, output, 0);
    }

    /** Finds the held observation interval, including an endpoint query. */
    public index(time: number): number {
        let low: number = 0;
        let high: number = this.times.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            if ((this.times[middle] ?? Infinity) <= time) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return Math.min(this.times.length - 2, Math.max(0, low - 1));
    }

    #range(begin: number, end: number, output: Float64Array): void {
        this.#operations.identity(this.#left, 0);
        this.#operations.identity(this.#right, 0);
        let left: number = begin + this.#leaves;
        let right: number = end + this.#leaves;
        while (left < right) {
            if (left % 2 === 1) {
                this.#operations.compose(
                    this.#left,
                    0,
                    this.#tree,
                    left * this.#stride,
                    this.#left,
                    0,
                );
                left++;
            }
            if (right % 2 === 1) {
                right--;
                this.#operations.compose(
                    this.#tree,
                    right * this.#stride,
                    this.#right,
                    0,
                    this.#right,
                    0,
                );
            }
            left = Math.floor(left / 2);
            right = Math.floor(right / 2);
        }
        this.#operations.compose(this.#left, 0, this.#right, 0, output, 0);
    }
}
