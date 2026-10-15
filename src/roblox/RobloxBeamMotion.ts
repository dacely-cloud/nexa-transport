// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxSceneNode } from './RobloxSceneTypes';
import type { RobloxBeamPhaseAnchor } from './RobloxBeamPhases';

/** Integral prefix plus a constant or linearly changing native texture rate. */
export interface RobloxBeamSpeedInterval {
    readonly at: number;
    readonly until: number;
    readonly rate: number;
    readonly slope: number;
    readonly distance: number;
}

/** Prefix integrals and native phase anchors make texture seeks logarithmic in recorded changes. */
export class RobloxBeamMotion {
    readonly #intervals: RobloxBeamSpeedInterval[] = [];
    /** Native clock observations, independent of serialized instance properties. */
    public readonly anchors: readonly RobloxBeamPhaseAnchor[];
    /** Undefined trigger selects a baseline-only plan for an otherwise unmatched GUI trigger. */
    public constructor(
        public readonly node: RobloxSceneNode,
        public readonly birth: number,
        scene: RobloxScene,
        trigger: string | null | undefined,
    ) {
        this.anchors =
            scene.beamTexturePhases?.find((track): boolean => track.nodeId === node.id)?.samples ??
            [];
        let rate: number =
            typeof node.properties['TextureSpeed'] === 'number'
                ? node.properties['TextureSpeed']
                : 0;
        let cursor: number = birth;
        let distance: number = 0;
        for (const event of scene.events) {
            if (
                (event.kind !== 'recording' && event.kind !== 'tween') ||
                event.nodeId !== node.id ||
                event.property !== 'TextureSpeed' ||
                event.trigger !== trigger
            ) {
                continue;
            }
            if (event.kind === 'recording') {
                for (const sample of event.samples) {
                    if (sample.at < birth || typeof sample.value !== 'number') {
                        continue;
                    }
                    distance = this.#append(cursor, sample.at, rate, 0, distance);
                    cursor = sample.at;
                    rate = sample.value;
                }
            } else if (event.at >= birth && typeof event.to === 'number') {
                distance = this.#append(cursor, event.at, rate, 0, distance);
                distance = this.#append(
                    event.at,
                    event.at + event.duration,
                    rate,
                    (event.to - rate) / event.duration,
                    distance,
                );
                cursor = event.at + event.duration;
                rate = event.to;
            }
        }
        this.#append(cursor, scene.duration, rate, 0, distance);
    }
    /** The same bounded numeric plan is emitted into Studio's replay module. */
    public get intervals(): readonly RobloxBeamSpeedInterval[] {
        return this.#intervals;
    }
    #append(at: number, until: number, rate: number, slope: number, distance: number): number {
        if (until <= at) {
            return distance;
        }
        this.#intervals.push({ at, until, rate, slope, distance });
        const elapsed: number = until - at;
        return distance + rate * elapsed + (slope * elapsed * elapsed) / 2;
    }
    /** Positive TextureSpeed moves toward Attachment1; positive SetTextureOffset moves the other way. */
    public phase(time: number): number {
        let low: number = 0;
        let high: number = this.anchors.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            if ((this.anchors[middle]?.at ?? Infinity) <= time) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        const anchor: RobloxBeamPhaseAnchor | undefined = this.anchors[low - 1];
        return (
            (anchor?.offset ?? 0) -
            this.#distance(time) +
            (anchor === undefined ? 0 : this.#distance(anchor.at))
        );
    }
    #distance(time: number): number {
        let low: number = 0;
        let high: number = this.#intervals.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            if ((this.#intervals[middle]?.at ?? Infinity) <= time) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        const interval: RobloxBeamSpeedInterval | undefined = this.#intervals[low - 1];
        if (interval === undefined) {
            return 0;
        }
        const elapsed: number = Math.min(
            interval.until - interval.at,
            Math.max(0, time - interval.at),
        );
        return (
            interval.distance + interval.rate * elapsed + (interval.slope * elapsed * elapsed) / 2
        );
    }
}
