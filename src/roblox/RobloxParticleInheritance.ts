// SPDX-License-Identifier: Apache-2.0
import type {
    RobloxScene,
    RobloxSceneNode,
    RobloxVector3,
    RobloxEmissionSnapshot,
    RobloxEmissionFrame,
} from './RobloxSceneTypes';
import { RobloxPartGeometry } from './RobloxPartGeometry';
import { RobloxProperties, RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxValues } from './RobloxSceneSchema';
/** Birth-only world-space velocity from the nearest emitting part, independent of sprite orientation. */
export class RobloxParticleInheritance {
    /** Native snapshots take precedence over end-of-frame observations; rate births read their own time. */
    public static velocity(
        scene: RobloxScene,
        parent: RobloxSceneNode,
        nodes: ReadonlyMap<string, RobloxSceneNode>,
        time: number,
        trigger: string | null,
        emission: RobloxEmissionSnapshot | null,
        fraction: number,
    ): RobloxVector3 {
        if (fraction === 0) {
            return RobloxValues.vector3();
        }
        let ancestor: RobloxSceneNode | undefined = parent;
        while (ancestor !== undefined && !RobloxPartGeometry.isPart(ancestor.className)) {
            ancestor = ancestor.parentId === null ? undefined : nodes.get(ancestor.parentId);
        }
        if (ancestor === undefined) {
            return RobloxValues.vector3();
        }
        const part: RobloxSceneNode = ancestor;
        const captured: RobloxVector3 | null | undefined = emission?.frames.find(
            (frame: RobloxEmissionFrame): boolean => frame.nodeId === part.id,
        )?.velocity;
        if (emission !== null && captured === undefined) {
            throw new Error(
                'Velocity inheritance requires captured parent velocity; rebuild this older recording',
            );
        }
        const velocity: RobloxVector3 =
            captured ??
            RobloxProperties.vector(
                RobloxSceneRuntime.properties(scene, part.id, time, trigger),
                'Velocity',
            );
        return RobloxValues.vector3(
            velocity.x * fraction,
            velocity.y * fraction,
            velocity.z * fraction,
        );
    }
}
