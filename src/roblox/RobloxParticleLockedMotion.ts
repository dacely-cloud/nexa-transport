// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxCFrame, RobloxScene, RobloxSceneNode, RobloxValue } from './RobloxSceneTypes';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxParticleIntervals } from './RobloxParticleIntervals';
import { RobloxParticleMotion } from './RobloxParticleMotion';
import { RobloxParticleMotionTree, type RobloxParticleTransfers } from './RobloxParticleMotionTree';
import { RobloxParticlePose } from './RobloxParticlePose';
import { RobloxParticleRigidTransfer } from './RobloxParticleRigidTransfer';
import { RobloxPartGeometry } from './RobloxPartGeometry';

interface LockedMotionCache {
    readonly entries: Map<string, RobloxParticleLockedMotion>;
    intervals: number;
}

/** Ordered world-force integration and rigid parent movement, including changes to LockedToPart. */
export class RobloxParticleLockedMotion {
    static readonly #caches: WeakMap<RobloxScene, LockedMotionCache> = new WeakMap();
    readonly #tree: RobloxParticleMotionTree;
    readonly #poses: readonly RobloxCFrame[];
    readonly #locked: Uint8Array;
    readonly #forces: Float64Array = new Float64Array(9);
    readonly #base: Float64Array = new Float64Array(18);
    readonly #delta: Float64Array = new Float64Array(18);
    readonly #physics: RobloxParticleMotion;
    readonly #times: readonly number[];
    readonly #sampled: Float64Array = new Float64Array(18);
    #sampleBegin: number = -1;
    #sampleEnd: number = -1;

    /** Skips the rigid path entirely for emitters that never enable locking. */
    public static create(
        scene: RobloxScene,
        node: RobloxSceneNode,
        trigger: string | null,
        physics: RobloxParticleMotion,
    ): RobloxParticleLockedMotion | null {
        const properties: readonly string[] = ['Acceleration', 'Drag', 'TimeScale', 'LockedToPart'];
        const tracks: readonly import('./RobloxSceneTypes').RobloxSceneEvent[] =
            scene.events.filter(
                (event): boolean =>
                    event.nodeId === node.id &&
                    event.trigger === trigger &&
                    (event.kind === 'recording' || event.kind === 'tween') &&
                    properties.includes(event.property),
            );
        if (
            node.properties['LockedToPart'] !== true &&
            !tracks.some(
                (event): boolean =>
                    event.kind === 'recording' &&
                    event.property === 'LockedToPart' &&
                    event.samples.some((sample): boolean => sample.value === true),
            )
        ) {
            return null;
        }
        const cache: LockedMotionCache = this.#cache(scene);
        const key: string = JSON.stringify([
            trigger,
            (scene.hierarchy?.length ?? 0) === 0 ? node.parentId : node.id,
            properties.map(
                (property: string): RobloxValue | undefined => node.properties[property],
            ),
            tracks,
        ]);
        const existing: RobloxParticleLockedMotion | undefined = cache.entries.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const motion: RobloxParticleLockedMotion = new RobloxParticleLockedMotion(
            scene,
            node.id,
            trigger,
            physics,
        );
        cache.entries.set(key, motion);
        return motion;
    }

    /** Shares static sibling configurations and admits bounded interval storage before allocation. */
    public constructor(
        scene: RobloxScene,
        nodeId: string,
        trigger: string | null,
        physics: RobloxParticleMotion,
    ) {
        this.#physics = physics;
        const times: Set<number> = new Set(
            RobloxParticleIntervals.boundaries(
                scene,
                nodeId,
                ['Acceleration', 'Drag', 'TimeScale', 'LockedToPart'],
                trigger,
            ),
        );
        const sources: Set<string> = new Set();
        for (const time of [0, ...(scene.hierarchy ?? []).map((delta): number => delta.at)]) {
            times.add(time);
            const nodes: ReadonlyMap<string, RobloxSceneNode> = RobloxSceneHierarchy.active(
                scene,
                time,
            );
            let node: RobloxSceneNode | undefined = nodes.get(nodeId);
            while (node !== undefined && node.parentId !== null) {
                node = nodes.get(node.parentId);
                if (
                    node === undefined ||
                    (node.className !== 'Attachment' && !RobloxPartGeometry.isPart(node.className))
                ) {
                    break;
                }
                sources.add(node.id);
                if (node.className !== 'Attachment') {
                    break;
                }
            }
        }
        for (const source of sources) {
            for (const time of RobloxParticleIntervals.boundaries(
                scene,
                source,
                ['CFrame'],
                trigger,
            )) {
                times.add(time);
            }
        }
        const boundaries: readonly number[] = [...times].sort(
            (a: number, b: number): number => a - b,
        );
        this.#times = boundaries;
        const cache: LockedMotionCache = RobloxParticleLockedMotion.#cache(scene);
        if (cache.intervals + boundaries.length - 1 > 131072) {
            throw new Error('Locked particle motion exceeds the 131072 shared interval budget');
        }
        this.#poses = boundaries.map((time: number): RobloxCFrame =>
            RobloxParticlePose.parent(scene, nodeId, time, trigger),
        );
        this.#locked = new Uint8Array(boundaries.length - 1);
        for (let index: number = 0; index < this.#locked.length; index++) {
            this.#locked[index] =
                RobloxSceneRuntime.properties(scene, nodeId, boundaries[index] ?? 0, trigger)[
                    'LockedToPart'
                ] === true
                    ? 1
                    : 0;
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
                RobloxParticleRigidTransfer.identity(output, offset),
            compose: (
                left: Float64Array,
                a: number,
                right: Float64Array,
                b: number,
                output: Float64Array,
                offset: number,
            ): void => RobloxParticleRigidTransfer.compose(left, a, right, b, output, offset),
        };
        this.#tree = new RobloxParticleMotionTree(boundaries, 18, operations);
        cache.intervals += boundaries.length - 1;
    }

    /** Preserves the exact native Emit pose even when a parent moves later in the same frame. */
    public sample(
        begin: number,
        end: number,
        output: Float64Array,
        emittedPose: RobloxCFrame | null,
    ): void {
        if (
            !Number.isFinite(begin) ||
            !Number.isFinite(end) ||
            begin < 0 ||
            end < begin ||
            output.length < 18
        ) {
            throw new Error(
                'Locked motion requires an ordered finite interval and eighteen output coefficients',
            );
        }
        if (begin !== this.#sampleBegin || end !== this.#sampleEnd) {
            this.#tree.sample(begin, end, this.#sampled);
            this.#sampleBegin = begin;
            this.#sampleEnd = end;
        }
        output.set(this.#sampled);
        const index: number = this.#tree.index(begin);
        const current: RobloxCFrame | undefined = this.#poses[index];
        if (
            emittedPose !== null &&
            current !== undefined &&
            this.#locked[index] === 1 &&
            !emittedPose.components.every(
                (value: number, component: number): boolean =>
                    value === current.components[component],
            )
        ) {
            RobloxParticlePose.delta(emittedPose, current, this.#delta);
            RobloxParticleRigidTransfer.compose(this.#delta, 0, output, 0, output, 0);
        }
    }

    #interval(
        index: number,
        begin: number,
        end: number,
        output: Float64Array,
        offset: number,
    ): void {
        this.#physics.sample(begin, end, this.#forces);
        RobloxParticleRigidTransfer.identity(this.#base, 0);
        this.#base.set(this.#forces, 0);
        const from: RobloxCFrame | undefined = this.#poses[index];
        const to: RobloxCFrame | undefined =
            this.#poses[end >= (this.#times[index + 1] ?? Infinity) ? index + 1 : index];
        if (this.#locked[index] === 1 && from !== undefined && to !== undefined) {
            RobloxParticlePose.delta(from, to, this.#delta);
            RobloxParticleRigidTransfer.compose(this.#base, 0, this.#delta, 0, output, offset);
        } else {
            output.set(this.#base, offset);
        }
    }

    static #cache(scene: RobloxScene): LockedMotionCache {
        let cache: LockedMotionCache | undefined = this.#caches.get(scene);
        if (cache === undefined) {
            cache = { entries: new Map(), intervals: 0 };
            this.#caches.set(scene, cache);
        }
        return cache;
    }
}
