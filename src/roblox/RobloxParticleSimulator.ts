// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    RobloxScene,
    RobloxSceneNode,
    RobloxValue,
    RobloxVector3,
    RobloxNumberSequence,
    RobloxColorSequence,
    RobloxEmissionSnapshot,
    RobloxEmissionFrame,
    RobloxNumberRange,
} from './RobloxSceneTypes';
import { RobloxProperties, RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxPartGeometry } from './RobloxPartGeometry';
import { RobloxValues } from './RobloxSceneSchema';

/** Packed particle attributes: x/y/z, size, r/g/b, opacity, rotation in radians. */
export interface RobloxParticleFrame {
    readonly attributes: Float32Array;
    readonly count: number;
}
/** Seeded birth state, generated once rather than allocating particles on every frame. */
interface ParticleBirth {
    readonly at: number;
    readonly life: number;
    readonly position: RobloxVector3;
    readonly velocity: RobloxVector3;
    readonly rotation: number;
    readonly rotSpeed: number;
    readonly envelope: number;
    readonly clearedAt: number;
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

/** Seekable bounded particle simulation, independent of browser and GPU APIs. */
export class RobloxParticleSimulator {
    readonly #node: RobloxSceneNode;
    readonly #births: readonly ParticleBirth[];
    readonly #attributes: Float32Array;
    readonly #acceleration: RobloxVector3;
    readonly #drag: number;
    readonly #size: RobloxNumberSequence;
    readonly #transparency: RobloxNumberSequence;
    readonly #color: RobloxColorSequence;

    /** Builds deterministic births for the selected main/button timeline. */
    public constructor(scene: RobloxScene, node: RobloxSceneNode, trigger: string | null = null) {
        if (node.className !== 'ParticleEmitter') {
            throw new Error('Expected a particle emitter');
        }
        this.#node = node;
        const properties: Readonly<Record<string, RobloxValue>> = node.properties;
        const lifetime: RobloxValue | undefined = properties['Lifetime'];
        const speed: RobloxValue | undefined = properties['Speed'];
        const angle: RobloxValue | undefined = properties['SpreadAngle'];
        const rotation: RobloxValue | undefined = properties['Rotation'];
        const rotSpeed: RobloxValue | undefined = properties['RotSpeed'];
        const size: RobloxValue | undefined = properties['Size'];
        const transparency: RobloxValue | undefined = properties['Transparency'];
        const color: RobloxValue | undefined = properties['Color'];
        if (
            typeof lifetime !== 'object' ||
            lifetime.kind !== 'NumberRange' ||
            typeof speed !== 'object' ||
            speed.kind !== 'NumberRange' ||
            typeof angle !== 'object' ||
            angle.kind !== 'Vector2' ||
            typeof rotation !== 'object' ||
            rotation.kind !== 'NumberRange' ||
            typeof rotSpeed !== 'object' ||
            rotSpeed.kind !== 'NumberRange' ||
            typeof size !== 'object' ||
            size.kind !== 'NumberSequence' ||
            typeof transparency !== 'object' ||
            transparency.kind !== 'NumberSequence' ||
            typeof color !== 'object' ||
            color.kind !== 'ColorSequence'
        ) {
            throw new Error('Invalid emitter properties');
        }
        this.#size = size;
        this.#transparency = transparency;
        this.#color = color;
        this.#acceleration = RobloxProperties.vector(properties, 'Acceleration');
        this.#drag = RobloxProperties.number(properties, 'Drag') * Math.LN2;
        const byId: ReadonlyMap<string, RobloxSceneNode> = new Map(
            scene.nodes.map((item: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                item.id,
                item,
            ]),
        );
        const parent: RobloxSceneNode | undefined =
            node.parentId === null ? undefined : byId.get(node.parentId);
        if (parent === undefined) {
            throw new Error('Emitter has no parent');
        }
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
                for (let index: number = 0; index < event.count; index++) {
                    times.push({ at: event.at, order, emission: event.emission ?? null });
                }
            }
        }
        times.sort(
            (a: ParticleSpawn, b: ParticleSpawn): number => a.at - b.at || a.order - b.order,
        );
        this.#births = times.map((spawn: ParticleSpawn): ParticleBirth => {
            const at: number = spawn.at;
            const properties: Readonly<Record<string, RobloxValue>> =
                spawn.emission?.properties ??
                RobloxSceneRuntime.properties(scene, node.id, at, trigger);
            const lifetime: RobloxNumberRange = this.#range(properties, 'Lifetime');
            const speed: RobloxNumberRange = this.#range(properties, 'Speed');
            const rotation: RobloxNumberRange = this.#range(properties, 'Rotation');
            const rotSpeed: RobloxNumberRange = this.#range(properties, 'RotSpeed');
            const angle: RobloxValue | undefined = properties['SpreadAngle'];
            if (typeof angle !== 'object' || angle.kind !== 'Vector2') {
                throw new Error('Invalid emission spread');
            }
            const direction: number = RobloxProperties.enum(properties, 'EmissionDirection');
            const life: number = lifetime.min + (lifetime.max - lifetime.min) * random();
            const velocity: number = speed.min + (speed.max - speed.min) * random();
            const horizontal: number = ((random() - 0.5) * angle.x * Math.PI) / 180;
            const vertical: number = ((random() - 0.5) * angle.y * Math.PI) / 180;
            const normal: RobloxVector3 = RobloxValues.vector3(
                Math.sin(horizontal) * Math.cos(vertical),
                Math.cos(horizontal) * Math.cos(vertical),
                Math.sin(vertical),
            );
            const oriented: RobloxVector3 =
                direction === 0
                    ? RobloxValues.vector3(normal.y, -normal.x, normal.z)
                    : direction === 2
                      ? RobloxValues.vector3(normal.x, -normal.z, normal.y)
                      : direction === 3
                        ? RobloxValues.vector3(-normal.y, normal.x, normal.z)
                        : direction === 4
                          ? RobloxValues.vector3(normal.x, -normal.y, -normal.z)
                          : direction === 5
                            ? RobloxValues.vector3(normal.x, normal.z, -normal.y)
                            : normal;
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
            const position: RobloxVector3 = RobloxValues.vector3(
                (random() - 0.5) * dimensions.x,
                (random() - 0.5) * dimensions.y,
                (random() - 0.5) * dimensions.z,
            );
            return {
                at,
                life,
                position: this.#transform(
                    position,
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
                        oriented.x * velocity,
                        oriented.y * velocity,
                        oriented.z * velocity,
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
                envelope: random() * 2 - 1,
                clearedAt: this.#clearTime(spawn, clears),
            };
        });
        this.#attributes = new Float32Array(this.#births.length * 9);
    }

    /** Evaluates a frame into a reusable packed GPU upload buffer. */
    public sample(time: number): RobloxParticleFrame {
        let count: number = 0;
        for (const birth of this.#births) {
            const age: number = time - birth.at;
            if (age < 0) {
                break;
            }
            if (age >= birth.life || time >= birth.clearedAt) {
                continue;
            }
            const normalized: number = age / birth.life;
            const travel: number =
                this.#drag > 0 ? -Math.expm1(-this.#drag * age) / this.#drag : age;
            const accelerationTravel: number =
                this.#drag > 0 ? (age - travel) / this.#drag : (age * age) / 2;
            const offset: number = count * 9;
            this.#attributes[offset] =
                birth.position.x +
                birth.velocity.x * travel +
                this.#acceleration.x * accelerationTravel;
            this.#attributes[offset + 1] =
                birth.position.y +
                birth.velocity.y * travel +
                this.#acceleration.y * accelerationTravel;
            this.#attributes[offset + 2] =
                birth.position.z +
                birth.velocity.z * travel +
                this.#acceleration.z * accelerationTravel;
            this.#attributes[offset + 3] = Math.max(
                0,
                RobloxSceneRuntime.scalar(this.#size, normalized, birth.envelope),
            );
            this.#writeColor(normalized, offset + 4);
            this.#attributes[offset + 7] =
                1 -
                Math.min(
                    1,
                    Math.max(
                        0,
                        RobloxSceneRuntime.scalar(this.#transparency, normalized, birth.envelope),
                    ),
                );
            this.#attributes[offset + 8] = birth.rotation + birth.rotSpeed * age;
            count++;
        }
        return { attributes: this.#attributes, count };
    }

    /** Number of seeded births, for fixed GPU buffer allocation. */
    public get capacity(): number {
        return this.#births.length;
    }
    /** Stable instance identity. */
    public get nodeId(): string {
        return this.#node.id;
    }

    #writeColor(age: number, offset: number): void {
        for (let index: number = 1; index < this.#color.points.length; index++) {
            const a: import('./RobloxSceneTypes').RobloxColorKeypoint | undefined =
                this.#color.points[index - 1];
            const b: import('./RobloxSceneTypes').RobloxColorKeypoint | undefined =
                this.#color.points[index];
            if (a !== undefined && b !== undefined && age <= b.time) {
                const alpha: number = (age - a.time) / (b.time - a.time);
                this.#attributes[offset] = a.color.r + (b.color.r - a.color.r) * alpha;
                this.#attributes[offset + 1] = a.color.g + (b.color.g - a.color.g) * alpha;
                this.#attributes[offset + 2] = a.color.b + (b.color.b - a.color.b) * alpha;
                return;
            }
        }
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
        const boundaries: Set<number> = new Set([0, scene.duration]);
        for (const event of scene.events) {
            if (
                event.kind !== 'recording' ||
                event.nodeId !== node.id ||
                event.trigger !== trigger ||
                !['Rate', 'Enabled'].includes(event.property)
            ) {
                continue;
            }
            for (const sample of event.samples) {
                boundaries.add(sample.at);
            }
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
            const properties: Readonly<Record<string, RobloxValue>> = RobloxSceneRuntime.properties(
                scene,
                node.id,
                start,
                trigger,
            );
            const rate: number = RobloxProperties.number(properties, 'Rate');
            if (properties['Enabled'] !== true || rate <= 0) {
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
