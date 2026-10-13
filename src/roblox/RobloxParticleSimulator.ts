// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxSceneNode, RobloxVector3, RobloxValue } from './RobloxSceneTypes';
import { RobloxProperties, RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxParticleBirths, type RobloxParticleBirth } from './RobloxParticleBirths';
import { RobloxParticleAppearance } from './RobloxParticleAppearance';
import { RobloxParticleFlipbook } from './RobloxParticleFlipbook';

/** Packed particle attributes: x/y/z, size, r/g/b, opacity, rotation in radians. */
export interface RobloxParticleFrame {
    readonly attributes: Float32Array;
    readonly count: number;
    /** Nine floats per visible particle: two normalized rectangles followed by crossfade. */
    readonly textureRegions: Float32Array;
    /** Current continuous normal-to-additive blend for every living particle. */
    readonly lightEmission: number;
}

/** Seekable bounded particle simulation, independent of browser and GPU APIs. */
export class RobloxParticleSimulator {
    readonly #births: readonly RobloxParticleBirth[];
    readonly #attributes: Float32Array;
    readonly #textureRegions: Float32Array;
    readonly #acceleration: RobloxVector3;
    readonly #drag: number;

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
        this.#acceleration = RobloxProperties.vector(node.properties, 'Acceleration');
        this.#drag = RobloxProperties.number(node.properties, 'Drag') * Math.LN2;
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
        if (appearance.visible && flipbook !== null) {
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
                flipbook.write(
                    age,
                    birth.life,
                    birth.flipbookRate,
                    birth.envelopeSeed,
                    this.#textureRegions,
                    offset,
                );
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
                    RobloxParticleAppearance.scalar(
                        appearance.size,
                        normalized,
                        birth.envelopeSeed,
                        0x14c81f27,
                    ),
                );
                appearance.writeColor(normalized, this.#attributes, offset + 4);
                this.#attributes[offset + 7] =
                    1 -
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
                    );
                this.#attributes[offset + 8] = birth.rotation + birth.rotSpeed * age;
                count++;
            }
        }
        return {
            attributes: this.#attributes,
            count,
            textureRegions: this.#textureRegions,
            lightEmission: appearance.lightEmission,
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
}
