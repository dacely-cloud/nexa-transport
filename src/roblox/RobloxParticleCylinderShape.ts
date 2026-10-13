// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxVector3 } from './RobloxSceneTypes';
import type { RobloxParticleShapePoint } from './RobloxParticleShape';
import { RobloxValues } from './RobloxSceneSchema';

/** Elliptic cylinders and conical frusta with an emission-side radius multiplier. */
export class RobloxParticleCylinderShape {
    /** Volume density follows squared radius; surface candidates are weighted by their exact Jacobian. */
    public static sample(
        size: RobloxVector3,
        surface: boolean,
        partial: number,
        random: () => number,
    ): RobloxParticleShapePoint {
        const a: number = size.x * 0.5;
        const c: number = size.z * 0.5;
        const height: number = size.y;
        const slope: number = 1 - partial;
        const bound: number = Math.hypot(height * Math.max(a, c), a * c * slope);
        const side: number = Math.PI * (1 + partial) * bound;
        const bottom: number = Math.PI * a * c;
        const top: number = bottom * partial * partial;
        for (let attempt: number = 0; attempt < 128; attempt++) {
            const choice: number = surface ? random() * (side + bottom + top) : -1;
            const cap: boolean = surface && choice >= side && bottom + top > 0;
            const upper: boolean = cap && choice >= side + bottom;
            const radius: number = cap
                ? upper
                    ? partial
                    : 1
                : slope < 1e-10
                  ? 1
                  : surface
                    ? Math.sqrt(1 - random() * (1 - partial * partial))
                    : Math.cbrt(1 - random() * (1 - partial ** 3));
            const t: number = cap
                ? upper
                    ? 1
                    : 0
                : slope < 1e-10
                  ? random()
                  : (1 - radius) / slope;
            const angle: number = random() * Math.PI * 2;
            const x: number = Math.cos(angle);
            const z: number = Math.sin(angle);
            const nx: number = height * c * x;
            const ny: number = a * c * slope;
            const nz: number = height * a * z;
            const area: number = Math.hypot(nx, ny, nz);
            if (surface && !cap && bound > 0 && random() * bound > area) {
                continue;
            }
            const distance: number = !surface || cap ? radius * Math.sqrt(random()) : radius;
            return {
                position: RobloxValues.vector3(
                    a * distance * x,
                    height * (t - 0.5),
                    c * distance * z,
                ),
                normal: cap
                    ? RobloxValues.vector3(0, upper ? 1 : -1, 0)
                    : area === 0
                      ? RobloxValues.vector3(x, 0, z)
                      : RobloxValues.vector3(nx / area, ny / area, nz / area),
            };
        }
        throw new Error('Cylinder surface sampling exceeds the bounded attempt budget');
    }
}
