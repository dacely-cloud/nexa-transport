// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxValue, RobloxVector3 } from './RobloxSceneTypes';
import { RobloxProperties, RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxParticleIntervals } from './RobloxParticleIntervals';

/** Piecewise motion transfers answer arbitrary birth-to-frame intervals without replaying the timeline. */
export class RobloxParticleMotion {
    readonly #times: readonly number[];
    readonly #states: Float64Array;
    readonly #tree: Float64Array;
    readonly #leaves: number;
    readonly #left: Float64Array = new Float64Array(9);
    readonly #right: Float64Array = new Float64Array(9);
    readonly #partial: Float64Array = new Float64Array(9);

    /** Stores acceleration, exponential drag and scaled time once per observed interval. */
    public constructor(scene: RobloxScene, nodeId: string, trigger: string | null) {
        this.#times = RobloxParticleIntervals.boundaries(
            scene,
            nodeId,
            ['Acceleration', 'Drag', 'TimeScale'],
            trigger,
        );
        const count: number = this.#times.length - 1;
        this.#leaves = 2 ** Math.ceil(Math.log2(count));
        this.#states = new Float64Array(count * 5);
        this.#tree = new Float64Array(this.#leaves * 2 * 9);
        for (let index: number = 0; index < count; index++) {
            const properties: Readonly<Record<string, RobloxValue>> = RobloxSceneRuntime.properties(
                scene,
                nodeId,
                this.#times[index] ?? 0,
                trigger,
            );
            const acceleration: RobloxVector3 = RobloxProperties.vector(properties, 'Acceleration');
            this.#states.set(
                [
                    acceleration.x,
                    acceleration.y,
                    acceleration.z,
                    RobloxProperties.number(properties, 'Drag') * Math.LN2,
                    RobloxProperties.number(properties, 'TimeScale'),
                ],
                index * 5,
            );
            this.#interval(
                index,
                this.#times[index] ?? 0,
                this.#times[index + 1] ?? 0,
                this.#tree,
                (this.#leaves + index) * 9,
            );
        }
        for (let index: number = count; index < this.#leaves; index++) {
            this.#identity(this.#tree, (this.#leaves + index) * 9);
        }
        for (let index: number = this.#leaves - 1; index > 0; index--) {
            this.#compose(
                this.#tree,
                index * 2 * 9,
                this.#tree,
                (index * 2 + 1) * 9,
                this.#tree,
                index * 9,
            );
        }
    }

    /** Nine coefficients: velocity multiplier/offsets, displacement multiplier/offsets and elapsed effect time. */
    public sample(begin: number, end: number, output: Float64Array): void {
        if (
            !Number.isFinite(begin) ||
            !Number.isFinite(end) ||
            begin < 0 ||
            end < begin ||
            output.length < 9
        ) {
            throw new Error(
                'Particle motion requires an ordered finite time interval and nine output coefficients',
            );
        }
        const first: number = this.#index(begin);
        const last: number = this.#index(end);
        if (first === last) {
            this.#interval(first, begin, end, output, 0);
            return;
        }
        this.#range(first + 1, last, output);
        this.#interval(first, begin, this.#times[first + 1] ?? end, this.#partial, 0);
        this.#compose(this.#partial, 0, output, 0, output, 0);
        this.#interval(last, this.#times[last] ?? begin, end, this.#partial, 0);
        this.#compose(output, 0, this.#partial, 0, output, 0);
    }

    #index(time: number): number {
        let low: number = 0;
        let high: number = this.#times.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            if ((this.#times[middle] ?? Infinity) <= time) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return Math.min(this.#times.length - 2, Math.max(0, low - 1));
    }

    #interval(
        index: number,
        begin: number,
        end: number,
        output: Float64Array,
        offset: number,
    ): void {
        const base: number = index * 5;
        const time: number = Math.max(0, end - begin) * (this.#states[base + 4] ?? 1);
        const drag: number = this.#states[base + 3] ?? 0;
        const exponent: number = drag * time;
        const multiplier: number = Math.exp(-exponent);
        const travel: number =
            Math.abs(exponent) < 1e-4
                ? time * (1 - exponent / 2 + (exponent * exponent) / 6 - exponent ** 3 / 24)
                : -Math.expm1(-exponent) / drag;
        const accelerationTravel: number =
            Math.abs(exponent) < 1e-4
                ? time *
                  time *
                  (0.5 - exponent / 6 + (exponent * exponent) / 24 - exponent ** 3 / 120)
                : (time - travel) / drag;
        output[offset] = multiplier;
        output[offset + 4] = travel;
        output[offset + 8] = time;
        for (let axis: number = 0; axis < 3; axis++) {
            const acceleration: number = this.#states[base + axis] ?? 0;
            output[offset + 1 + axis] = acceleration === 0 ? 0 : acceleration * travel;
            output[offset + 5 + axis] = acceleration === 0 ? 0 : acceleration * accelerationTravel;
        }
    }

    #identity(output: Float64Array, offset: number): void {
        output.fill(0, offset, offset + 9);
        output[offset] = 1;
    }

    #compose(
        left: Float64Array,
        a: number,
        right: Float64Array,
        b: number,
        output: Float64Array,
        target: number,
    ): void {
        const leftMultiplier: number = left[a] ?? 1;
        const rightMultiplier: number = right[b] ?? 1;
        const rightTravel: number = right[b + 4] ?? 0;
        const travel: number = (left[a + 4] ?? 0) + rightTravel * leftMultiplier;
        const age: number = (left[a + 8] ?? 0) + (right[b + 8] ?? 0);
        for (let axis: number = 0; axis < 3; axis++) {
            const velocity: number = left[a + 1 + axis] ?? 0;
            const displacement: number =
                (left[a + 5 + axis] ?? 0) +
                (velocity === 0 ? 0 : rightTravel * velocity) +
                (right[b + 5 + axis] ?? 0);
            output[target + 1 + axis] =
                (velocity === 0 ? 0 : rightMultiplier * velocity) + (right[b + 1 + axis] ?? 0);
            output[target + 5 + axis] = displacement;
        }
        output[target] = leftMultiplier * rightMultiplier;
        output[target + 4] = travel;
        output[target + 8] = age;
    }

    #range(begin: number, end: number, output: Float64Array): void {
        this.#identity(this.#left, 0);
        this.#identity(this.#right, 0);
        let left: number = begin + this.#leaves;
        let right: number = end + this.#leaves;
        while (left < right) {
            if (left % 2 === 1) {
                this.#compose(this.#left, 0, this.#tree, left * 9, this.#left, 0);
                left++;
            }
            if (right % 2 === 1) {
                right--;
                this.#compose(this.#tree, right * 9, this.#right, 0, this.#right, 0);
            }
            left = Math.floor(left / 2);
            right = Math.floor(right / 2);
        }
        this.#compose(this.#left, 0, this.#right, 0, output, 0);
    }
}
