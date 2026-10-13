// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    RobloxScene,
    RobloxSceneNode,
    RobloxValue,
    RobloxVector3,
    RobloxEmissionSnapshot,
    RobloxEmissionFrame,
    RobloxNumberRange,
    RobloxCFrame,
} from './RobloxSceneTypes';
import { RobloxProperties, RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxPartGeometry } from './RobloxPartGeometry';
import { RobloxValues } from './RobloxSceneSchema';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxParticleIntervals } from './RobloxParticleIntervals';
import { RobloxParticleBirthPoses } from './RobloxParticleBirthPoses';
import { RobloxParticleShape, type RobloxParticleShapePoint } from './RobloxParticleShape';

/** Immutable per-particle state captured at emission; active appearance and forces are sampled separately. */
export interface RobloxParticleBirth {
    readonly at: number;
    readonly life: number;
    readonly position: RobloxVector3;
    readonly velocity: RobloxVector3;
    readonly rotation: number;
    readonly rotSpeed: number;
    readonly envelopeSeed: number;
    /** Randomized once when the particle is emitted. */
    readonly flipbookRate: number;
    readonly clearedAt: number;
    /** Exact emitter frame at a locked native Emit; shared by every particle in that burst. */
    readonly lockedPose: RobloxCFrame | null;
}
interface ParticleSpawn {
    readonly at: number;
    readonly order: number;
    readonly emission: RobloxEmissionSnapshot | null;
}
interface ParticleClearPoint {
    readonly at: number;
    readonly order: number;
}

/** Seeds emission-time values and exact birth poses once for a seekable particle timeline. */
export class RobloxParticleBirths {
    /** Retains birth lifetime/speed/rotation independently of later emitter property changes. */
    public create(
        scene: RobloxScene,
        node: RobloxSceneNode,
        trigger: string | null,
    ): readonly RobloxParticleBirth[] {
        const catalog: ReadonlyMap<string, RobloxSceneNode> = RobloxSceneHierarchy.catalog(scene);
        let seed: number = scene.seed;
        for (const letter of node.id) {
            seed = Math.imul(seed ^ (letter.codePointAt(0) ?? 0), 16777619) >>> 0;
        }
        const random: () => number = (): number => {
            seed = (seed + 0x6d2b79f5) >>> 0;
            let mixed: number = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
            return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
        };
        const times: ParticleSpawn[] = this.#emissionTimes(scene, node, trigger).map(
            (at: number): ParticleSpawn => ({ at, order: -1, emission: null }),
        );
        const clears: ParticleClearPoint[] = [];
        const lockedPoses: RobloxParticleBirthPoses = new RobloxParticleBirthPoses();
        for (let order: number = 0; order < scene.events.length; order++) {
            const event: import('./RobloxSceneTypes').RobloxSceneEvent | undefined =
                scene.events[order];
            if (event?.nodeId !== node.id || event.trigger !== trigger) {
                continue;
            }
            if (event.kind === 'clear') {
                clears.push({ at: event.at, order });
            }
            if (event.kind === 'burst' && event.nodeId === node.id && event.trigger === trigger) {
                const properties: Readonly<Record<string, RobloxValue>> =
                    event.emission?.properties ??
                    RobloxSceneRuntime.properties(scene, node.id, event.at, trigger);
                if (this.#range(properties, 'Lifetime').max === 0) {
                    continue;
                }
                for (let index: number = 0; index < event.count; index++) {
                    times.push({ at: event.at, order, emission: event.emission ?? null });
                }
            }
        }
        times.sort(
            (a: ParticleSpawn, b: ParticleSpawn): number => a.at - b.at || a.order - b.order,
        );
        return times.map((spawn: ParticleSpawn, particleIndex: number): RobloxParticleBirth => {
            const at: number = spawn.at;
            const birthNodes: Map<string, RobloxSceneNode> = new Map();
            const byId: ReadonlyMap<string, RobloxSceneNode> =
                spawn.emission === null
                    ? RobloxSceneHierarchy.active(
                          scene,
                          spawn.order === -1 ? Math.max(0, at - 1e-9) : at,
                      )
                    : birthNodes;
            if (spawn.emission !== null) {
                for (let index: number = 0; index < spawn.emission.frames.length; index++) {
                    const frame: RobloxEmissionFrame | undefined = spawn.emission.frames[index];
                    const original: RobloxSceneNode | undefined =
                        frame === undefined ? undefined : catalog.get(frame.nodeId);
                    if (original === undefined) {
                        throw new Error('Missing emission ancestor');
                    }
                    birthNodes.set(original.id, {
                        ...original,
                        parentId: spawn.emission.frames[index + 1]?.nodeId ?? null,
                    });
                }
            }
            const parentId: string | null =
                spawn.emission?.frames[0]?.nodeId ?? byId.get(node.id)?.parentId ?? null;
            const parent: RobloxSceneNode | undefined =
                parentId === null ? undefined : byId.get(parentId);
            if (parent === undefined) {
                throw new Error('Emitter has no active birth parent');
            }
            const properties: Readonly<Record<string, RobloxValue>> =
                spawn.emission?.properties ??
                RobloxSceneRuntime.properties(scene, node.id, at, trigger);
            const lifetime: RobloxNumberRange = this.#range(properties, 'Lifetime');
            const speed: RobloxNumberRange = this.#range(properties, 'Speed');
            const rotation: RobloxNumberRange = this.#range(properties, 'Rotation');
            const rotSpeed: RobloxNumberRange = this.#range(properties, 'RotSpeed');
            const flipbookRate: RobloxNumberRange = this.#range(properties, 'FlipbookFramerate');
            const angle: RobloxValue | undefined = properties['SpreadAngle'];
            if (typeof angle !== 'object' || angle.kind !== 'Vector2') {
                throw new Error('Invalid emission spread');
            }
            const life: number = lifetime.min + (lifetime.max - lifetime.min) * random();
            const velocity: number = speed.min + (speed.max - speed.min) * random();
            const horizontal: number = ((random() - 0.5) * angle.x * Math.PI) / 180;
            const vertical: number = ((random() - 0.5) * angle.y * Math.PI) / 180;
            const normal: RobloxVector3 = RobloxValues.vector3(
                Math.sin(horizontal) * Math.cos(vertical),
                Math.cos(horizontal) * Math.cos(vertical),
                Math.sin(vertical),
            );
            const parentFrame: RobloxEmissionFrame | undefined = spawn.emission?.frames.find(
                (frame: RobloxEmissionFrame): boolean => frame.nodeId === parent.id,
            );
            const dimensions: RobloxVector3 =
                parentFrame?.size ??
                (RobloxPartGeometry.isPart(parent.className)
                    ? RobloxProperties.vector(
                          RobloxSceneRuntime.properties(scene, parent.id, at, trigger),
                          'Size',
                      )
                    : RobloxValues.vector3());
            const shape: RobloxParticleShapePoint = RobloxParticleShape.sample(
                properties,
                dimensions,
                normal,
                random,
            );
            const lockedPose: RobloxCFrame | null =
                properties['LockedToPart'] === true
                    ? lockedPoses.get(
                          spawn.order,
                          at,
                          (point: RobloxVector3, direction: boolean): RobloxVector3 =>
                              this.#transform(
                                  point,
                                  parent,
                                  byId,
                                  direction,
                                  scene,
                                  at,
                                  trigger,
                                  spawn.emission,
                              ),
                      )
                    : null;
            return {
                at,
                life,
                lockedPose,
                position: this.#transform(
                    shape.position,
                    parent,
                    byId,
                    false,
                    scene,
                    at,
                    trigger,
                    spawn.emission,
                ),
                velocity: this.#transform(
                    RobloxValues.vector3(
                        shape.normal.x * velocity,
                        shape.normal.y * velocity,
                        shape.normal.z * velocity,
                    ),
                    parent,
                    byId,
                    true,
                    scene,
                    at,
                    trigger,
                    spawn.emission,
                ),
                rotation:
                    ((rotation.min + (rotation.max - rotation.min) * random()) * Math.PI) / 180,
                rotSpeed:
                    ((rotSpeed.min + (rotSpeed.max - rotSpeed.min) * random()) * Math.PI) / 180,
                envelopeSeed: Math.floor(random() * 4294967296),
                flipbookRate:
                    flipbookRate.min +
                    ((flipbookRate.max - flipbookRate.min) *
                        ((Math.imul(particleIndex + 1, 0x9e3779b9) ^ scene.seed) >>> 0)) /
                        4294967296,
                clearedAt: Math.min(
                    this.#clearTime(spawn, clears),
                    ...(scene.hierarchy ?? [])
                        .filter(
                            (delta): boolean => delta.at >= at && delta.removed.includes(node.id),
                        )
                        .map((delta): number => delta.at),
                ),
            };
        });
    }

    #transform(
        point: RobloxVector3,
        node: RobloxSceneNode,
        byId: ReadonlyMap<string, RobloxSceneNode>,
        direction: boolean,
        scene: RobloxScene,
        time: number,
        trigger: string | null,
        emission: RobloxEmissionSnapshot | null,
    ): RobloxVector3 {
        const c: import('./RobloxSceneTypes').RobloxCFrame =
            emission?.frames.find((frame: RobloxEmissionFrame): boolean => frame.nodeId === node.id)
                ?.cframe ??
            RobloxProperties.cframe(
                RobloxSceneRuntime.properties(scene, node.id, time, trigger),
                'CFrame',
            );
        const values: readonly number[] = c.components;
        const transformed: RobloxVector3 = RobloxValues.vector3(
            (values[3] ?? 0) * point.x +
                (values[4] ?? 0) * point.y +
                (values[5] ?? 0) * point.z +
                (direction ? 0 : (values[0] ?? 0)),
            (values[6] ?? 0) * point.x +
                (values[7] ?? 0) * point.y +
                (values[8] ?? 0) * point.z +
                (direction ? 0 : (values[1] ?? 0)),
            (values[9] ?? 0) * point.x +
                (values[10] ?? 0) * point.y +
                (values[11] ?? 0) * point.z +
                (direction ? 0 : (values[2] ?? 0)),
        );
        const parent: RobloxSceneNode | undefined =
            node.parentId === null ? undefined : byId.get(node.parentId);
        return node.className === 'Attachment' && parent !== undefined
            ? this.#transform(transformed, parent, byId, direction, scene, time, trigger, emission)
            : transformed;
    }

    #emissionTimes(scene: RobloxScene, node: RobloxSceneNode, trigger: string | null): number[] {
        const boundaries: Set<number> = new Set(
            RobloxParticleIntervals.boundaries(
                scene,
                node.id,
                ['Rate', 'Enabled', 'TimeScale', 'Lifetime'],
                trigger,
            ),
        );
        for (const delta of scene.hierarchy ?? []) {
            boundaries.add(delta.at);
        }
        const times: readonly number[] = [...boundaries].sort(
            (a: number, b: number): number => a - b,
        );
        const births: number[] = [];
        let fractional: number = 0;
        for (let index: number = 1; index < times.length; index++) {
            const start: number | undefined = times[index - 1];
            const end: number | undefined = times[index];
            if (start === undefined || end === undefined) {
                throw new Error('Invalid emission interval');
            }
            if (
                !RobloxSceneHierarchy.nodes(scene, start).some(
                    (active: RobloxSceneNode): boolean => active.id === node.id,
                )
            ) {
                fractional = 0;
                continue;
            }
            const properties: Readonly<Record<string, RobloxValue>> = RobloxSceneRuntime.properties(
                scene,
                node.id,
                start,
                trigger,
            );
            const rate: number =
                RobloxProperties.number(properties, 'Rate') *
                RobloxProperties.number(properties, 'TimeScale');
            if (
                properties['Enabled'] !== true ||
                rate <= 0 ||
                this.#range(properties, 'Lifetime').max === 0
            ) {
                continue;
            }
            const total: number = fractional + (end - start) * rate;
            const count: number = Math.floor(total + 1e-9);
            for (let particle: number = 1; particle <= count; particle++) {
                births.push(Math.min(end, start + (particle - fractional) / rate));
            }
            fractional = Math.max(0, total - count);
        }
        return births;
    }

    #range(properties: Readonly<Record<string, RobloxValue>>, name: string): RobloxNumberRange {
        const value: RobloxValue | undefined = properties[name];
        if (typeof value !== 'object' || value.kind !== 'NumberRange') {
            throw new Error('Invalid emission range: ' + name);
        }
        return value;
    }

    #clearTime(spawn: ParticleSpawn, clears: readonly ParticleClearPoint[]): number {
        let low: number = 0;
        let high: number = clears.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            const clear: ParticleClearPoint | undefined = clears[middle];
            if (
                clear !== undefined &&
                (clear.at < spawn.at || (clear.at === spawn.at && clear.order < spawn.order))
            ) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return clears[low]?.at ?? Number.POSITIVE_INFINITY;
    }
}
