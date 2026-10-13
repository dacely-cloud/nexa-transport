// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxValue } from './RobloxSceneTypes';
import type { RobloxTextureRect } from './RobloxDefaultTextures';
import { RobloxDefaultTextures } from './RobloxDefaultTextures';
import { RobloxProperties } from './RobloxSceneRuntime';

/** One current flipbook configuration writes two source rectangles and a linear crossfade. */
export class RobloxParticleFlipbook {
    readonly #columns: number;
    readonly #rows: number;
    readonly #mode: number;
    readonly #blend: boolean;
    readonly #randomStart: boolean;
    readonly #width: number;
    readonly #height: number;
    readonly #rect: RobloxTextureRect;

    /** Keeps each frame's texel centers inside the original image, without resizing it. */
    public constructor(
        scene: RobloxScene,
        properties: Readonly<Record<string, RobloxValue>>,
        rect: RobloxTextureRect,
    ) {
        const layout: number = RobloxProperties.enum(properties, 'FlipbookLayout');
        this.#columns =
            layout === 4
                ? RobloxProperties.number(properties, 'FlipbookSizeX')
                : layout === 0
                  ? 1
                  : 2 ** layout;
        this.#rows =
            layout === 4 ? RobloxProperties.number(properties, 'FlipbookSizeY') : this.#columns;
        this.#mode = RobloxProperties.enum(properties, 'FlipbookMode');
        this.#blend = layout !== 0 && properties['FlipbookBlendFrames'] === true;
        this.#randomStart = layout !== 0 && properties['FlipbookStartRandom'] === true;
        this.#width = scene.textures?.width ?? RobloxDefaultTextures.size;
        this.#height = scene.textures?.height ?? RobloxDefaultTextures.size;
        this.#rect = rect;
        if (rect[2] % this.#columns !== 0 || rect[3] % this.#rows !== 0) {
            throw new Error(
                'Flipbook texture dimensions must be exact multiples of the selected grid',
            );
        }
    }

    /** Seekable seeded random choices never depend on previously rendered frames. */
    public static random(seed: number, step: number, salt: number): number {
        let value: number = seed ^ Math.imul(step + 1, 0x9e3779b9) ^ salt;
        value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
        value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
        return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
    }

    /** Writes current UV rectangle, next UV rectangle and blend into nine reusable floats. */
    public write(
        age: number,
        lifetime: number,
        rate: number,
        seed: number,
        output: Float32Array,
        offset: number,
    ): void {
        const count: number = this.#columns * this.#rows;
        const start: number = this.#randomStart
            ? Math.floor(RobloxParticleFlipbook.random(seed, 0, 0x51ed270b) * count)
            : 0;
        const position: number =
            this.#mode === 1 ? start + (age / lifetime) * count : start + age * rate;
        const step: number = Math.floor(position);
        this.#writeRect(this.#frame(step, count, seed), output, offset);
        this.#writeRect(this.#frame(step + 1, count, seed), output, offset + 4);
        output[offset + 8] = this.#blend ? position - step : 0;
    }

    #frame(step: number, count: number, seed: number): number {
        if (count === 1) {
            return 0;
        }
        if (this.#mode === 1) {
            return Math.min(count - 1, step);
        }
        if (this.#mode === 2) {
            const phase: number = step % (2 * (count - 1));
            return phase < count ? phase : 2 * (count - 1) - phase;
        }
        if (this.#mode === 3) {
            return Math.floor(RobloxParticleFlipbook.random(seed, step, 0x6c8e9cf5) * count);
        }
        return step % count;
    }

    #writeRect(frame: number, output: Float32Array, offset: number): void {
        const width: number = this.#rect[2] / this.#columns;
        const height: number = this.#rect[3] / this.#rows;
        output[offset] = (this.#rect[0] + (frame % this.#columns) * width + 0.5) / this.#width;
        output[offset + 1] =
            (this.#rect[1] + Math.floor(frame / this.#columns) * height + 0.5) / this.#height;
        output[offset + 2] = (width - 1) / this.#width;
        output[offset + 3] = (height - 1) / this.#height;
    }
}
