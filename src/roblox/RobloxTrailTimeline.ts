// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    RobloxTrailMutation,
    type RobloxTrailPoint,
    type RobloxTrailTrack,
} from './RobloxTrailHistory';

interface TrailLink {
    readonly point: RobloxTrailPoint;
    readonly previous: TrailLink | null;
}
interface TrailFrame {
    readonly at: number;
    readonly first: number | null;
    readonly tail: TrailLink | null;
    readonly edge: RobloxTrailPoint | undefined;
}

/** Persistent heads preserve earlier frames and make seeks logarithmic plus visible path length. */
export class RobloxTrailTimeline {
    readonly #frames: readonly TrailFrame[];
    /** The codec has checked ordering, append identities, clipping and recording budgets. */
    public constructor(track: RobloxTrailTrack) {
        const frames: TrailFrame[] = [];
        let tail: TrailLink | null = null;
        let edge: RobloxTrailPoint | undefined;
        for (const sample of track.samples) {
            if (sample.kind === RobloxTrailMutation.Reset || sample.first === null) {
                tail = null;
                edge = undefined;
            }
            for (const point of sample.points) {
                tail = RobloxTrailTimeline.#append(tail, point);
            }
            edge = sample.edge ?? (edge?.serial === sample.first ? edge : undefined);
            frames.push({ at: sample.at, first: sample.first, tail, edge });
        }
        this.#frames = frames;
    }
    static #append(tail: TrailLink | null, point: RobloxTrailPoint): TrailLink {
        return { point, previous: tail?.point.serial === point.serial ? tail.previous : tail };
    }
    /** Moving a later head or clipping its oldest segment cannot rewrite a backward seek. */
    public sample(time: number): readonly RobloxTrailPoint[] {
        let low: number = 0;
        let high: number = this.#frames.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            if ((this.#frames[middle]?.at ?? Infinity) <= time + 1e-9) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        const frame: TrailFrame | undefined = this.#frames[low - 1];
        if (frame === undefined || frame.first === null) {
            return [];
        }
        const points: RobloxTrailPoint[] = [];
        let link: TrailLink | null = frame.tail;
        while (link !== null && link.point.serial >= frame.first) {
            points.push(
                link.point.serial === frame.first ? (frame.edge ?? link.point) : link.point,
            );
            link = link.previous;
        }
        return points.reverse();
    }
}
