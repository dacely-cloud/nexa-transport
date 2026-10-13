// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxCFrame, RobloxVector3 } from './RobloxSceneTypes';
import { RobloxValues } from './RobloxSceneSchema';

/** Exact native birth-space conversion for one origin or basis direction. */
export interface RobloxParticleBirthTransform {
    (point: RobloxVector3, direction: boolean): RobloxVector3;
}

/** Shared locked-emission frames avoid repeating ancestor conversion for every burst particle. */
export class RobloxParticleBirthPoses {
    readonly #poses: Map<string, RobloxCFrame> = new Map();

    /** Command order distinguishes multiple native emits at the same logical time. */
    public get(order: number, time: number, transform: RobloxParticleBirthTransform): RobloxCFrame {
        const key: string = JSON.stringify([order, time]);
        const cached: RobloxCFrame | undefined = this.#poses.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const position: RobloxVector3 = transform(RobloxValues.vector3(), false);
        const x: RobloxVector3 = transform(RobloxValues.vector3(1, 0, 0), true);
        const y: RobloxVector3 = transform(RobloxValues.vector3(0, 1, 0), true);
        const z: RobloxVector3 = transform(RobloxValues.vector3(0, 0, 1), true);
        const frame: RobloxCFrame = {
            kind: 'CFrame',
            components: [
                position.x,
                position.y,
                position.z,
                x.x,
                y.x,
                z.x,
                x.y,
                y.y,
                z.y,
                x.z,
                y.z,
                z.z,
            ],
        };
        this.#poses.set(key, frame);
        return frame;
    }
}
