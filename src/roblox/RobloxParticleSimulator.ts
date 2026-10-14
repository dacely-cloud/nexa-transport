// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxSceneNode, RobloxValue } from './RobloxSceneTypes';
import { RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxParticleBirths, type RobloxParticleBirth } from './RobloxParticleBirths';
import { RobloxParticleAppearance } from './RobloxParticleAppearance';
import { RobloxParticleFlipbook } from './RobloxParticleFlipbook';
import { RobloxParticleMotion } from './RobloxParticleMotion';
import { RobloxParticleLockedMotion } from './RobloxParticleLockedMotion';

/** Packed particle attributes: x/y/z, size, r/g/b, opacity, rotation in radians. */
export interface RobloxParticleFrame {
    readonly attributes: Float32Array;
    readonly count: number;
    /** Nine floats per visible particle: two normalized rectangles followed by crossfade. */
    readonly textureRegions: Float32Array;
    /** Current continuous normal-to-additive blend for every living particle. */
    readonly lightEmission: number;
    /** Three current world-space velocity components per visible particle. */
    readonly velocities: Float32Array;
    /** Native ParticleOrientation value sampled from the current emitter. */
    readonly orientation: number;
    /** Current render-only depth offset; older observations default to zero. */
    readonly zOffset?: number;
}

/** Seekable bounded particle simulation, independent of browser and GPU APIs. */
export class RobloxParticleSimulator {
    readonly #births: readonly RobloxParticleBirth[];
    readonly #attributes: Float32Array;
    readonly #textureRegions: Float32Array;
    readonly #velocities: Float32Array;
    readonly #motion: RobloxParticleMotion;
    readonly #transfer: Float64Array = new Float64Array(18);
    readonly #lockedMotion: RobloxParticleLockedMotion | null;

    /** Separates immutable birth inputs from the emitter's current appearance. */
    public constructor(
        public readonly scene: RobloxScene,
        public readonly node: RobloxSceneNode,
        public readonly trigger: string | null = null,
    ) {
        if (node.className !== 'ParticleEmitter') {
            throw new Error('Expected a particle emitter');
        }
        this.#births = new RobloxParticleBirths().create(scene, node, trigger);
        this.#attributes = new Float32Array(this.#births.length * 9);
        this.#textureRegions = new Float32Array(this.#births.length * 9);
        this.#velocities = new Float32Array(this.#births.length * 3);
        this.#motion = new RobloxParticleMotion(scene, node.id, trigger);
        this.#lockedMotion =
            this.#births.length === 0
                ? null
                : RobloxParticleLockedMotion.create(scene, node, trigger, this.#motion);
    }

    /** Evaluates current textures and animation into reusable GPU upload buffers. */
    public sample(time: number): RobloxParticleFrame {
        const properties: Readonly<Record<string, RobloxValue>> = RobloxSceneRuntime.properties(
            this.scene,
            this.node.id,
            time,
            this.trigger,
        );
        const appearance: RobloxParticleAppearance = new RobloxParticleAppearance(
            this.scene,
            properties,
        );
        const flipbook: RobloxParticleFlipbook | null =
            appearance.rectangle === null
                ? null
                : new RobloxParticleFlipbook(this.scene, properties, appearance.rectangle);
        let count: number = 0;
        let previousBirth: number = -1;
        let previousPose: import('./RobloxSceneTypes').RobloxCFrame | null = null;
        if (appearance.visible && flipbook !== null) {
            for (const birth of this.#births) {
                if (time < birth.at) {
                    break;
                }
                if (time >= birth.clearedAt) {
                    continue;
                }
                if (birth.at !== previousBirth || birth.lockedPose !== previousPose) {
                    if (this.#lockedMotion === null) {
                        this.#motion.sample(birth.at, time, this.#transfer);
                    } else {
                        this.#lockedMotion.sample(birth.at, time, this.#transfer, birth.lockedPose);
                    }
                    previousBirth = birth.at;
                    previousPose = birth.lockedPose;
                }
                const age: number = this.#transfer[8] ?? 0;
                if (age >= birth.life) {
                    continue;
                }
                const normalized: number = age / birth.life;
                const travel: number = this.#transfer[4] ?? 0;
                const offset: number = count * 9;
                flipbook.write(
                    age,
                    birth.life,
                    birth.flipbookRate,
                    birth.envelopeSeed,
                    this.#textureRegions,
                    offset,
                );
                const x: number =
                    this.#lockedMotion === null
                        ? birth.position.x +
                          (birth.velocity.x === 0 ? 0 : birth.velocity.x * travel) +
                          (this.#transfer[5] ?? 0)
                        : this.#position(birth, travel, 0);
                const y: number =
                    this.#lockedMotion === null
                        ? birth.position.y +
                          (birth.velocity.y === 0 ? 0 : birth.velocity.y * travel) +
                          (this.#transfer[6] ?? 0)
                        : this.#position(birth, travel, 1);
                const z: number =
                    this.#lockedMotion === null
                        ? birth.position.z +
                          (birth.velocity.z === 0 ? 0 : birth.velocity.z * travel) +
                          (this.#transfer[7] ?? 0)
                        : this.#position(birth, travel, 2);
                if (
                    !Number.isFinite(x) ||
                    !Number.isFinite(y) ||
                    !Number.isFinite(z) ||
                    Math.abs(x) > 100000000 ||
                    Math.abs(y) > 100000000 ||
                    Math.abs(z) > 100000000
                ) {
                    throw new Error('Particle motion exceeds the preview coordinate budget');
                }
                this.#attributes[offset] = x;
                this.#attributes[offset + 1] = y;
                this.#attributes[offset + 2] = z;
                if (appearance.orientation > 1) {
                    this.#velocities[count * 3] = this.#velocity(birth, 0);
                    this.#velocities[count * 3 + 1] = this.#velocity(birth, 1);
                    this.#velocities[count * 3 + 2] = this.#velocity(birth, 2);
                }
                this.#attributes[offset + 3] = Math.max(
                    0,
                    RobloxParticleAppearance.scalar(
                        appearance.size,
                        normalized,
                        birth.envelopeSeed,
                        0x14c81f27,
                    ),
                );
                appearance.writeColor(normalized, this.#attributes, offset + 4);
                this.#attributes[offset + 7] =
                    appearance.localOpacity *
                    (1 -
                        Math.min(
                            1,
                            Math.max(
                                0,
                                RobloxParticleAppearance.scalar(
                                    appearance.transparency,
                                    normalized,
                                    birth.envelopeSeed,
                                    0x391782a5,
                                ),
                            ),
                        ));
                this.#attributes[offset + 8] = birth.rotation + birth.rotSpeed * age;
                count++;
            }
        }
        return {
            attributes: this.#attributes,
            count,
            textureRegions: this.#textureRegions,
            lightEmission: appearance.lightEmission,
            velocities: this.#velocities,
            orientation: appearance.orientation,
            zOffset: appearance.zOffset,
        };
    }

    /** Number of births for fixed GPU buffer allocation. */
    public get capacity(): number {
        return this.#births.length;
    }
    /** Stable instance identity. */
    public get nodeId(): string {
        return this.node.id;
    }

    #position(birth: RobloxParticleBirth, travel: number, axis: number): number {
        const offset: number = 9 + axis * 3;
        const x: number = this.#transfer[offset] ?? 0;
        const y: number = this.#transfer[offset + 1] ?? 0;
        const z: number = this.#transfer[offset + 2] ?? 0;
        const velocity: number =
            (x === 0 ? 0 : x * birth.velocity.x) +
            (y === 0 ? 0 : y * birth.velocity.y) +
            (z === 0 ? 0 : z * birth.velocity.z);
        return (
            (x === 0 ? 0 : x * birth.position.x) +
            (y === 0 ? 0 : y * birth.position.y) +
            (z === 0 ? 0 : z * birth.position.z) +
            (velocity === 0 ? 0 : travel * velocity) +
            (this.#transfer[5 + axis] ?? 0)
        );
    }

    #velocity(birth: RobloxParticleBirth, axis: number): number {
        let value: number =
            axis === 0 ? birth.velocity.x : axis === 1 ? birth.velocity.y : birth.velocity.z;
        if (this.#lockedMotion !== null) {
            const offset: number = 9 + axis * 3;
            value =
                (this.#transfer[offset] ?? 0) * birth.velocity.x +
                (this.#transfer[offset + 1] ?? 0) * birth.velocity.y +
                (this.#transfer[offset + 2] ?? 0) * birth.velocity.z;
        }
        return (
            (value === 0 ? 0 : value * (this.#transfer[0] ?? 1)) + (this.#transfer[1 + axis] ?? 0)
        );
    }
}
