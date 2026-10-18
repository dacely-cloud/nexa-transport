// SPDX-License-Identifier: Apache-2.0

import { RobloxMeshGeometry, type RobloxMeshGeometryData } from './RobloxMeshGeometry';
import { RobloxPartGeometry } from './RobloxPartGeometry';
import { RobloxParticlePose } from './RobloxParticlePose';
import { RobloxProperties } from './RobloxSceneRuntime';
import { RobloxValues } from './RobloxSceneSchema';
import type {
    RobloxScene,
    RobloxSceneNode,
    RobloxValue,
    RobloxVector3,
    RobloxColor3,
} from './RobloxSceneTypes';

/** Geometry and visual-only native mesh transforms; physics continues to use the actual BasePart. */
export interface RobloxVisualPart {
    readonly shape: number;
    readonly mesh: RobloxMeshGeometryData | null;
    readonly properties: Readonly<Record<string, RobloxValue>>;
}

/** Shared mesh modifiers prevent imported accessories from failing or becoming placeholder blocks. */
export class RobloxVisualParts {
    /** DataModelMesh descendants affect only their direct BasePart parent. */
    public static modifier(className: string): boolean {
        return ['SpecialMesh', 'BlockMesh', 'CylinderMesh', 'FileMesh'].includes(className);
    }

    /** Returns a file identity, including the actual shipped Head and Torso meshes. */
    public static uri(
        node: RobloxSceneNode,
        properties: Readonly<Record<string, RobloxValue>> = node.properties,
    ): string | null {
        if (node.className === 'MeshPart' || node.className === 'FileMesh') {
            const uri: RobloxValue | undefined = properties['MeshId'];
            if (typeof uri !== 'string') {
                throw new Error('Missing native mesh identity');
            }
            return uri;
        }
        if (node.className !== 'SpecialMesh') {
            return null;
        }
        switch (RobloxProperties.enum(properties, 'MeshType')) {
            case 0:
                return 'rbxasset://heads/head.mesh';
            case 1:
                return 'rbxasset://meshes/torso.mesh';
            case 5: {
                const uri: RobloxValue | undefined = properties['MeshId'];
                if (typeof uri !== 'string') {
                    throw new Error('Missing native FileMesh identity');
                }
                return uri;
            }
            default:
                return null;
        }
    }

    /** Build the direct-child index once per frame, including native creation/removal/reparenting. */
    public static modifiers(
        nodes: ReadonlyMap<string, RobloxSceneNode>,
    ): ReadonlyMap<string, RobloxSceneNode> {
        const result: Map<string, RobloxSceneNode> = new Map();
        for (const node of nodes.values()) {
            if (!this.modifier(node.className) || node.parentId === null) {
                continue;
            }
            const parent: RobloxSceneNode | undefined = nodes.get(node.parentId);
            if (
                parent === undefined ||
                !RobloxPartGeometry.isPart(parent.className) ||
                parent.className === 'MeshPart'
            ) {
                continue;
            }
            if (result.has(node.parentId)) {
                throw new Error(
                    'Multiple mesh modifiers on one BasePart require explicit resolution',
                );
            }
            result.set(node.parentId, node);
        }
        return result;
    }

    /** Preserve mesh scaling, local Offset, vertex tint, texture and original authored poses. */
    public static sample(
        scene: RobloxScene,
        node: RobloxSceneNode,
        properties: Readonly<Record<string, RobloxValue>>,
        modifier?: RobloxSceneNode,
        values?: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
    ): RobloxVisualPart {
        if (node.className === 'MeshPart') {
            return { shape: -1, mesh: RobloxMeshGeometry.get(scene, properties), properties };
        }
        const authoredSize: RobloxVector3 = RobloxProperties.vector(properties, 'Size');
        if (modifier === undefined) {
            const shape: number = RobloxPartGeometry.shape(node, properties);
            return {
                shape,
                mesh: null,
                properties: {
                    ...properties,
                    Size: RobloxPartGeometry.dimensions(shape, authoredSize),
                    TextureID: '',
                    DoubleSided: false,
                },
            };
        }
        const meshValues: Readonly<Record<string, RobloxValue>> =
            values?.get(modifier.id) ?? modifier.properties;
        const type: number =
            modifier.className === 'BlockMesh'
                ? 6
                : modifier.className === 'CylinderMesh'
                  ? 4
                  : modifier.className === 'FileMesh'
                    ? 5
                    : RobloxProperties.enum(meshValues, 'MeshType');
        const shape: number = type === 2 ? 3 : type === 3 ? 0 : type === 4 ? 2 : 1;
        const uri: string | null = this.uri(modifier, meshValues);
        const mesh: RobloxMeshGeometryData | null =
            uri === null
                ? null
                : type === 5
                  ? RobloxMeshGeometry.original(scene, uri)
                  : RobloxMeshGeometry.fitted(scene, uri);
        const scale: RobloxVector3 = RobloxProperties.vector(meshValues, 'Scale');
        const offset: RobloxVector3 = RobloxProperties.vector(meshValues, 'Offset');
        const tint: RobloxVector3 = RobloxProperties.vector(meshValues, 'VertexColor');
        const color: RobloxColor3 = RobloxProperties.color(properties, 'Color');
        const size: RobloxVector3 =
            type === 5
                ? scale
                : RobloxValues.vector3(
                      authoredSize.x * scale.x,
                      authoredSize.y * scale.y,
                      authoredSize.z * scale.z,
                  );
        return {
            shape,
            mesh,
            properties: {
                ...properties,
                Size: size,
                CFrame: RobloxParticlePose.multiply(
                    RobloxProperties.cframe(properties, 'CFrame'),
                    RobloxValues.cframe(offset.x, offset.y, offset.z),
                ),
                Color: RobloxValues.color(color.r * tint.x, color.g * tint.y, color.b * tint.z),
                TextureID: type === 5 ? (meshValues['TextureId'] ?? '') : '',
                DoubleSided: false,
            },
        };
    }
}
