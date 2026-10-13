// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxVector3 } from './RobloxSceneTypes';
import type { RobloxParticleShapePoint } from './RobloxParticleShape';
import { RobloxValues } from './RobloxSceneSchema';

/** Sphere sectors and planar annuli, sized in the emitter's oriented local frame. */
export class RobloxParticleRoundShape {
    /** Samples volume or area-weighted boundaries with a bounded rejection loop. */
    public static sample(
        size: RobloxVector3,
        disc: boolean,
        surface: boolean,
        partial: number,
        random: () => number,
    ): RobloxParticleShapePoint {
        const a: number = size.x * 0.5;
        const b: number = size.y * 0.5;
        const c: number = size.z * 0.5;
        if (disc) {
            const inner: number = 1 - partial;
            for (let attempt: number = 0; attempt < 128; attempt++) {
                const angle: number = random() * Math.PI * 2;
                const nx: number = Math.cos(angle);
                const nz: number = Math.sin(angle);
                const normalLength: number = Math.hypot(c * nx, a * nz);
                if (surface && random() * Math.max(a, c) > normalLength) {
                    continue;
                }
                const radius: number = surface
                    ? random() < inner / (1 + inner)
                        ? inner
                        : 1
                    : Math.sqrt(inner * inner + (1 - inner * inner) * random());
                const sign: number = surface && radius < 1 ? -1 : 1;
                return {
                    position: RobloxValues.vector3(a * radius * nx, 0, c * radius * nz),
                    normal:
                        normalLength === 0
                            ? RobloxValues.vector3(nx, 0, nz)
                            : RobloxValues.vector3(
                                  (sign * c * nx) / normalLength,
                                  0,
                                  (sign * a * nz) / normalLength,
                              ),
                };
            }
            throw new Error('Disc surface sampling exceeds the bounded attempt budget');
        }
        const minimumY: number = Math.cos(Math.PI * partial);
        const minimumSquaredY: number = Math.max(0, minimumY) ** 2;
        const maximumArea: number = Math.max(
            a * c,
            Math.hypot(
                Math.max(b * c, a * b) * Math.sqrt(1 - minimumSquaredY),
                a * c * Math.sqrt(minimumSquaredY),
            ),
        );
        for (let attempt: number = 0; attempt < 128; attempt++) {
            const y: number = 1 - random() * (1 - minimumY);
            const angle: number = random() * Math.PI * 2;
            const radius: number = Math.sqrt(Math.max(0, 1 - y * y));
            const x: number = radius * Math.cos(angle);
            const z: number = radius * Math.sin(angle);
            const nx: number = b * c * x;
            const ny: number = a * c * y;
            const nz: number = a * b * z;
            const area: number = Math.hypot(nx, ny, nz);
            if (surface && maximumArea > 0 && partial > 0 && random() * maximumArea > area) {
                continue;
            }
            const distance: number = surface || partial === 0 ? 1 : Math.cbrt(random());
            return {
                position: RobloxValues.vector3(
                    a * distance * x,
                    b * distance * y,
                    c * distance * z,
                ),
                normal:
                    area === 0
                        ? RobloxValues.vector3(x, y, z)
                        : RobloxValues.vector3(nx / area, ny / area, nz / area),
            };
        }
        throw new Error('Sphere surface sampling exceeds the bounded attempt budget');
    }
}
