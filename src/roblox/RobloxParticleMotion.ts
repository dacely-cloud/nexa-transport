// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxValue, RobloxVector3 } from './RobloxSceneTypes';
import { RobloxProperties, RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxParticleIntervals } from './RobloxParticleIntervals';
import { RobloxParticleMotionTree, type RobloxParticleTransfers } from './RobloxParticleMotionTree';

/** Piecewise motion transfers answer arbitrary birth-to-frame intervals without replaying the timeline. */
export class RobloxParticleMotion {
    readonly #times: readonly number[];
    readonly #states: Float64Array;
    readonly #tree: RobloxParticleMotionTree;

    /** Stores acceleration, exponential drag and scaled time once per observed interval. */
    public constructor(scene: RobloxScene, nodeId: string, trigger: string | null) {
        this.#times = RobloxParticleIntervals.boundaries(
            scene,
            nodeId,
            ['Acceleration', 'Drag', 'TimeScale'],
            trigger,
        );
        const count: number = this.#times.length - 1;
        this.#states = new Float64Array(count * 5);
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
        }
        const operations: RobloxParticleTransfers = {
            interval: (
                index: number,
                begin: number,
                end: number,
                output: Float64Array,
                offset: number,
            ): void => this.#interval(index, begin, end, output, offset),
            identity: (output: Float64Array, offset: number): void =>
                this.#identity(output, offset),
            compose: (
                left: Float64Array,
                a: number,
                right: Float64Array,
                b: number,
                output: Float64Array,
                offset: number,
            ): void => this.#compose(left, a, right, b, output, offset),
        };
        this.#tree = new RobloxParticleMotionTree(this.#times, 9, operations);
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
        this.#tree.sample(begin, end, output);
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
}
