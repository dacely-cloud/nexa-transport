// SPDX-License-Identifier: Apache-2.0

import type {
    RobloxCFrame,
    RobloxColor3,
    RobloxScene,
    RobloxSceneNode,
    RobloxValue,
    RobloxVector3,
} from './RobloxSceneTypes';
import { RobloxPartGeometry } from './RobloxPartGeometry';
import { RobloxParticlePose } from './RobloxParticlePose';
import { RobloxProperties, RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxValues } from './RobloxSceneSchema';

/** A scoped native point light evaluated at one playback timestamp. */
export interface RobloxPointLightFrame {
    readonly id: string;
    readonly position: RobloxVector3;
    readonly color: RobloxColor3;
    readonly brightness: number;
    readonly range: number;
}

/** Shared native light observations for browser and capture renderers. */
export class RobloxPointLights {
    /** Bounds dynamic illumination work independently of the scene's geometry budget. */
    public static readonly maximum: number = 64;

    /** Retains current hierarchy, attachment poses, property recordings and backward seeks. */
    public static sample(
        scene: RobloxScene,
        time: number,
        trigger: string | null = null,
        values: ReadonlyMap<
            string,
            Readonly<Record<string, RobloxValue>>
        > = RobloxSceneRuntime.evaluate(scene, time, trigger),
    ): readonly RobloxPointLightFrame[] {
        const nodes: ReadonlyMap<string, RobloxSceneNode> = RobloxSceneHierarchy.active(
            scene,
            time,
        );
        const result: RobloxPointLightFrame[] = [];
        for (const node of nodes.values()) {
            if (node.className !== 'PointLight' || node.parentId === null) {
                continue;
            }
            const parent: RobloxSceneNode | undefined = nodes.get(node.parentId);
            if (
                parent === undefined ||
                (parent.className !== 'Attachment' && !RobloxPartGeometry.isPart(parent.className))
            ) {
                continue;
            }
            const properties: Readonly<Record<string, RobloxValue>> | undefined = values.get(
                node.id,
            );
            if (properties === undefined || properties['Enabled'] !== true) {
                continue;
            }
            const brightness: number = RobloxProperties.number(properties, 'Brightness');
            const range: number = RobloxProperties.number(properties, 'Range');
            if (brightness === 0 || range === 0) {
                continue;
            }
            if (result.length >= this.maximum) {
                throw new Error('PointLight preview exceeds 64 active lights');
            }
            let ancestor: RobloxSceneNode | undefined = parent;
            let pose: RobloxCFrame = RobloxValues.cframe();
            while (ancestor !== undefined) {
                if (
                    ancestor.className !== 'Attachment' &&
                    !RobloxPartGeometry.isPart(ancestor.className)
                ) {
                    break;
                }
                const frame: Readonly<Record<string, RobloxValue>> | undefined = values.get(
                    ancestor.id,
                );
                if (frame === undefined) {
                    throw new Error('Missing PointLight ancestor pose');
                }
                pose = RobloxParticlePose.multiply(RobloxProperties.cframe(frame, 'CFrame'), pose);
                if (ancestor.className !== 'Attachment') {
                    break;
                }
                ancestor = ancestor.parentId === null ? undefined : nodes.get(ancestor.parentId);
            }
            result.push({
                id: node.id,
                position: RobloxValues.vector3(
                    pose.components[0],
                    pose.components[1],
                    pose.components[2],
                ),
                color: RobloxProperties.color(properties, 'Color'),
                brightness,
                range,
            });
        }
        return result;
    }

    /** Approximates bounded diffuse illumination without claiming Studio photometric parity. */
    public static diffuse(
        lights: readonly RobloxPointLightFrame[],
        point: RobloxVector3,
        normal: RobloxVector3,
    ): RobloxColor3 {
        let r: number = 0;
        let g: number = 0;
        let b: number = 0;
        for (const light of lights) {
            const x: number = light.position.x - point.x;
            const y: number = light.position.y - point.y;
            const z: number = light.position.z - point.z;
            const distance: number = Math.hypot(x, y, z);
            if (distance >= light.range) {
                continue;
            }
            const facing: number =
                distance < 1e-8
                    ? 1
                    : Math.max(0, (x * normal.x + y * normal.y + z * normal.z) / distance);
            const attenuation: number = 1 - distance / light.range;
            const gain: number = light.brightness * attenuation * attenuation * facing;
            r += light.color.r * gain;
            g += light.color.g * gain;
            b += light.color.b * gain;
        }
        return RobloxValues.color(r, g, b);
    }
}
