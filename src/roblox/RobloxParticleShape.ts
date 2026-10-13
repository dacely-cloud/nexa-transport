// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxValue, RobloxVector3 } from './RobloxSceneTypes';
import { RobloxProperties } from './RobloxSceneRuntime';
import { RobloxValues } from './RobloxSceneSchema';
import { RobloxParticleRoundShape } from './RobloxParticleRoundShape';
import { RobloxParticleCylinderShape } from './RobloxParticleCylinderShape';

/** A local emission position and outward unit normal, before ancestor transforms. */
export interface RobloxParticleShapePoint {
    readonly position: RobloxVector3;
    readonly normal: RobloxVector3;
}

/** Geometric emission sampling; native RNG and Studio edge cases still require calibration. */
export class RobloxParticleShape {
    /** Retains the default box's three random draws and applies shape settings at birth. */
    public static sample(
        properties: Readonly<Record<string, RobloxValue>>,
        dimensions: RobloxVector3,
        spread: RobloxVector3,
        random: () => number,
    ): RobloxParticleShapePoint {
        const shape: number = RobloxProperties.enum(properties, 'Shape');
        const surface: boolean = RobloxProperties.enum(properties, 'ShapeStyle') === 1;
        const axis: number = RobloxProperties.enum(properties, 'EmissionDirection');
        const partial: number = RobloxProperties.number(properties, 'ShapePartial');
        const size: RobloxVector3 =
            axis === 0 || axis === 3
                ? RobloxValues.vector3(dimensions.y, dimensions.x, dimensions.z)
                : axis === 2 || axis === 5
                  ? RobloxValues.vector3(dimensions.x, dimensions.z, dimensions.y)
                  : dimensions;
        const point: RobloxParticleShapePoint =
            shape === 0
                ? this.#box(dimensions, surface, axis, random)
                : shape === 2
                  ? RobloxParticleCylinderShape.sample(size, surface, partial, random)
                  : RobloxParticleRoundShape.sample(size, shape === 3, surface, partial, random);
        const local: RobloxVector3 =
            shape === 0 && !surface
                ? this.orient(spread, axis)
                : this.#spread(point.normal, spread);
        const mode: number = RobloxProperties.enum(properties, 'ShapeInOut');
        const sign: number = mode === 1 || (mode === 2 && random() < 0.5) ? -1 : 1;
        const directed: RobloxVector3 = shape === 0 ? local : this.orient(local, axis);
        return {
            position: shape === 0 ? point.position : this.orient(point.position, axis),
            normal: RobloxValues.vector3(directed.x * sign, directed.y * sign, directed.z * sign),
        };
    }

    /** Maps a positive local Y axis onto one of Roblox's six NormalId directions. */
    public static orient(point: RobloxVector3, direction: number): RobloxVector3 {
        return direction === 0
            ? RobloxValues.vector3(point.y, -point.x, point.z)
            : direction === 2
              ? RobloxValues.vector3(point.x, -point.z, point.y)
              : direction === 3
                ? RobloxValues.vector3(-point.y, point.x, point.z)
                : direction === 4
                  ? RobloxValues.vector3(point.x, -point.y, -point.z)
                  : direction === 5
                    ? RobloxValues.vector3(point.x, point.z, -point.y)
                    : point;
    }

    static #box(
        size: RobloxVector3,
        surface: boolean,
        axis: number,
        random: () => number,
    ): RobloxParticleShapePoint {
        const position: RobloxVector3 = RobloxValues.vector3(
            (random() - 0.5) * size.x,
            (random() - 0.5) * size.y,
            (random() - 0.5) * size.z,
        );
        if (!surface) {
            return { position, normal: this.orient(RobloxValues.vector3(0, 1, 0), axis) };
        }
        const areas: readonly number[] = [size.y * size.z, size.x * size.z, size.x * size.y];
        if ((areas[0] ?? 0) + (areas[1] ?? 0) + (areas[2] ?? 0) === 0) {
            return { position, normal: this.orient(RobloxValues.vector3(0, 1, 0), axis) };
        }
        let selection: number = random() * ((areas[0] ?? 0) + (areas[1] ?? 0) + (areas[2] ?? 0));
        let face: number = 0;
        while (face < 2 && selection >= (areas[face] ?? 0)) {
            selection -= areas[face] ?? 0;
            face++;
        }
        const sign: number = random() < 0.5 ? -1 : 1;
        return {
            position: RobloxValues.vector3(
                face === 0 ? sign * size.x * 0.5 : position.x,
                face === 1 ? sign * size.y * 0.5 : position.y,
                face === 2 ? sign * size.z * 0.5 : position.z,
            ),
            normal: RobloxValues.vector3(
                face === 0 ? sign : 0,
                face === 1 ? sign : 0,
                face === 2 ? sign : 0,
            ),
        };
    }

    static #spread(normal: RobloxVector3, spread: RobloxVector3): RobloxVector3 {
        if (spread.x === 0 && spread.z === 0) {
            return RobloxValues.vector3(
                normal.x * spread.y,
                normal.y * spread.y,
                normal.z * spread.y,
            );
        }
        const length: number = Math.hypot(normal.x, normal.y);
        const x: RobloxVector3 =
            length < 1e-10
                ? RobloxValues.vector3(1, 0, 0)
                : RobloxValues.vector3(normal.y / length, -normal.x / length, 0);
        const z: RobloxVector3 = RobloxValues.vector3(
            x.y * normal.z,
            -x.x * normal.z,
            x.x * normal.y - x.y * normal.x,
        );
        return RobloxValues.vector3(
            x.x * spread.x + normal.x * spread.y + z.x * spread.z,
            x.y * spread.x + normal.y * spread.y + z.y * spread.z,
            normal.z * spread.y + z.z * spread.z,
        );
    }
}
