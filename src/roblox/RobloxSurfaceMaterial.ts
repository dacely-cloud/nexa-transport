// SPDX-License-Identifier: Apache-2.0

import { RobloxProperties } from './RobloxSceneRuntime';
import type { RobloxValue } from './RobloxSceneTypes';

/** Bounded preview response, shared by browser and capture; original enums remain in exports. */
export interface RobloxSurfaceResponse {
    readonly roughness: number;
    readonly metalness: number;
    readonly reflectance: number;
    readonly emissive: boolean;
}

/** Preserve important form cues without claiming to reproduce Roblox's proprietary material shaders. */
export class RobloxSurfaceMaterial {
    /** Metal armor receives directional highlights instead of the same matte finish as every Part. */
    public static sample(properties: Readonly<Record<string, RobloxValue>>): RobloxSurfaceResponse {
        const material: number = RobloxProperties.enum(properties, 'Material');
        const reflectance: number =
            typeof properties['Reflectance'] === 'number' ? properties['Reflectance'] : 0;
        const metal: boolean = [1040, 1056, 1072, 1088].includes(material);
        const roughness: number =
            material === 1040
                ? 0.65
                : metal
                  ? 0.25
                  : material === 272 || material === 1568 || material === 1536
                    ? 0.28
                    : material === 256
                      ? 0.6
                      : 0.85;
        return {
            roughness: Math.max(0.08, roughness * (1 - reflectance * 0.8)),
            metalness: metal ? 0.8 : reflectance * 0.5,
            reflectance,
            emissive: material === 288,
        };
    }
}
