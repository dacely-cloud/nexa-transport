// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneMeshes } from './RobloxSceneMeshes';
import { RobloxMeshNormals } from './RobloxMeshNormals';
import { RobloxProperties } from './RobloxSceneRuntime';
import type { RobloxMeshData } from './RobloxMeshTypes';
import type { RobloxScene, RobloxValue, RobloxVector3 } from './RobloxSceneTypes';

/** Indexed mesh buffers normalized by immutable MeshSize; animated BasePart.Size scales them later. */
export interface RobloxMeshGeometryData {
    readonly positions: Float32Array<ArrayBuffer>;
    readonly normals: Float32Array<ArrayBuffer>;
    readonly uvs: Float32Array<ArrayBuffer>;
    readonly colors: Uint8Array<ArrayBuffer>;
    readonly indices: Uint32Array<ArrayBuffer>;
    readonly transparent: boolean;
}

/** Mesh instances reuse decoded topology and normalized geometry without per-triangle object arrays. */
export class RobloxMeshGeometry {
    static readonly #empty: RobloxMeshGeometryData = Object.freeze({
        positions: new Float32Array(0),
        normals: new Float32Array(0),
        uvs: new Float32Array(0),
        colors: new Uint8Array(0),
        indices: new Uint32Array(0),
        transparent: false,
    });
    static readonly #geometry: WeakMap<RobloxMeshData, Map<string, RobloxMeshGeometryData>> =
        new WeakMap();

    public static get(
        scene: RobloxScene,
        properties: Readonly<Record<string, RobloxValue>>,
    ): RobloxMeshGeometryData {
        const uri: RobloxValue | undefined = properties['MeshId'];
        if (uri === '') {
            return this.#empty;
        }
        if (typeof uri !== 'string') {
            throw new Error('MeshPart requires an imported, loaded mesh identity');
        }
        const source: RobloxMeshData = RobloxSceneMeshes.get(scene, uri);
        if (source.boneCount !== 0 || source.facialBytes !== 0) {
            throw new Error(
                'Rigged MeshPart deformation is not implemented; static bind-pose export is available through roblox_mesh',
            );
        }
        const size: RobloxVector3 = RobloxProperties.vector(properties, 'MeshSize');
        if (Math.min(size.x, size.y, size.z) < 0 || Math.max(size.x, size.y, size.z) === 0) {
            throw new Error('MeshPart lacks its original loaded MeshSize');
        }
        const key: string = String(size.x) + ',' + String(size.y) + ',' + String(size.z);
        const geometries: Map<string, RobloxMeshGeometryData> =
            this.#geometry.get(source) ?? new Map<string, RobloxMeshGeometryData>();
        const existing: RobloxMeshGeometryData | undefined = geometries.get(key);
        if (existing !== undefined) {
            return existing;
        }
        if (geometries.size >= 64) {
            throw new Error('Mesh size variants exceed the geometry budget');
        }
        const positions: Float32Array<ArrayBuffer> = source.positions.slice();
        const normals: Float32Array<ArrayBuffer> = RobloxMeshNormals.export(source);
        for (let index: number = 0; index < positions.length; index++) {
            const extent: number = index % 3 === 0 ? size.x : index % 3 === 1 ? size.y : size.z;
            const position: number = positions[index] ?? 0;
            if (extent === 0 && position !== 0) {
                throw new Error('Loaded mesh dimensions disagree with its vertex coordinates');
            }
            positions[index] = extent === 0 ? position : position / extent;
            normals[index] = (normals[index] ?? 0) * (extent === 0 ? 1 : extent);
            if (!Number.isFinite(positions[index]) || !Number.isFinite(normals[index])) {
                throw new Error('Normalized mesh geometry exceeds float range');
            }
        }
        const geometry: RobloxMeshGeometryData = {
            positions,
            normals,
            uvs: source.uvs,
            colors: source.colors,
            indices: source.highQualityIndices,
            transparent: source.colors.some(
                (value: number, index: number): boolean => index % 4 === 3 && value !== 255,
            ),
        };
        geometries.set(key, geometry);
        this.#geometry.set(source, geometries);
        return geometry;
    }
}
