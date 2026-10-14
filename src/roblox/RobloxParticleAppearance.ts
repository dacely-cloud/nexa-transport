// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    RobloxScene,
    RobloxValue,
    RobloxNumberSequence,
    RobloxColorSequence,
} from './RobloxSceneTypes';
import { RobloxProperties } from './RobloxSceneRuntime';
import { RobloxSceneTextures } from './RobloxSceneTextures';
import type { RobloxTextureRect } from './RobloxDefaultTextures';

/** Current emitter-owned appearance applies to every living particle. */
export class RobloxParticleAppearance {
    /** Original source texel bounds used for exact flipbook subdivision. */
    public readonly rectangle: RobloxTextureRect | null;
    /** Empty Texture suppresses rendering until an image is assigned. */
    public readonly visible: boolean;
    /** Current per-age size curve. */
    public readonly size: RobloxNumberSequence;
    /** Current per-age transparency curve. */
    public readonly transparency: RobloxNumberSequence;
    /** Client-local opacity multiplier applies immediately to living particles. */
    public readonly localOpacity: number;
    /** Current per-age multiplicative color curve. */
    public readonly color: RobloxColorSequence;
    /** Current normal-to-additive compositing factor. */
    public readonly lightEmission: number;
    /** Current geometry alignment applies to living particles. */
    public readonly orientation: number;
    /** Current render depth offset in studs leaves particle motion and projected size unchanged. */
    public readonly zOffset: number;
    /** Reads a single current property observation, rather than freezing appearance at birth. */
    public constructor(scene: RobloxScene, properties: Readonly<Record<string, RobloxValue>>) {
        const size: RobloxValue | undefined = properties['Size'];
        const transparency: RobloxValue | undefined = properties['Transparency'];
        const color: RobloxValue | undefined = properties['Color'];
        const texture: RobloxValue | undefined = properties['Texture'];
        if (
            typeof size !== 'object' ||
            size.kind !== 'NumberSequence' ||
            typeof transparency !== 'object' ||
            transparency.kind !== 'NumberSequence' ||
            typeof color !== 'object' ||
            color.kind !== 'ColorSequence' ||
            typeof texture !== 'string'
        ) {
            throw new Error('Invalid current particle appearance');
        }
        this.size = size;
        this.transparency = transparency;
        this.localOpacity = 1 - RobloxProperties.number(properties, 'LocalTransparencyModifier');
        this.color = color;
        this.lightEmission = RobloxProperties.number(properties, 'LightEmission');
        this.orientation = RobloxProperties.enum(properties, 'Orientation');
        this.zOffset = RobloxProperties.number(properties, 'ZOffset');
        this.visible = texture !== '';
        const rect: RobloxTextureRect | null = RobloxSceneTextures.rect(scene, texture);
        this.rectangle = rect;
        if (this.visible && rect === null) {
            throw new Error(
                'Roblox texture bytes are missing: ' +
                    texture +
                    '. Rebuild with asset resolution enabled.',
            );
        }
    }

    /** Independent, deterministic envelope choices for each keypoint and each sequence. */
    public static scalar(
        sequence: RobloxNumberSequence,
        age: number,
        seed: number,
        salt: number,
    ): number {
        for (let index: number = 1; index < sequence.points.length; index += 1) {
            const a: import('./RobloxSceneTypes').RobloxNumberKeypoint | undefined =
                sequence.points[index - 1];
            const b: import('./RobloxSceneTypes').RobloxNumberKeypoint | undefined =
                sequence.points[index];
            if (a !== undefined && b !== undefined && age <= b.time) {
                const alpha: number = (age - a.time) / (b.time - a.time);
                return (
                    (a.value + a.envelope * this.#random(seed, index - 1, salt)) * (1 - alpha) +
                    (b.value + b.envelope * this.#random(seed, index, salt)) * alpha
                );
            }
        }
        throw new Error('Particle age is outside its scalar sequence');
    }

    static #random(seed: number, index: number, salt: number): number {
        let value: number = seed ^ Math.imul(index + 1, 0x9e3779b9) ^ salt;
        value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
        value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
        return ((value ^ (value >>> 15)) >>> 0) / 2147483648 - 1;
    }

    /** Writes age-interpolated RGB into the reusable packed upload buffer. */
    public writeColor(age: number, output: Float32Array, offset: number): void {
        for (let index: number = 1; index < this.color.points.length; index += 1) {
            const a: import('./RobloxSceneTypes').RobloxColorKeypoint | undefined =
                this.color.points[index - 1];
            const b: import('./RobloxSceneTypes').RobloxColorKeypoint | undefined =
                this.color.points[index];
            if (a !== undefined && b !== undefined && age <= b.time) {
                const alpha: number = (age - a.time) / (b.time - a.time);
                output[offset] = a.color.r + (b.color.r - a.color.r) * alpha;
                output[offset + 1] = a.color.g + (b.color.g - a.color.g) * alpha;
                output[offset + 2] = a.color.b + (b.color.b - a.color.b) * alpha;
                return;
            }
        }
    }
}
