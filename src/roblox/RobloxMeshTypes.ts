// SPDX-License-Identifier: Apache-2.0

/** Validated mesh topology in Roblox units, with native UVs and the original LOD ranges. */
export interface RobloxMeshData {
    readonly version: string;
    readonly positions: Float32Array<ArrayBuffer>;
    readonly normals: Float32Array<ArrayBuffer>;
    readonly uvs: Float32Array<ArrayBuffer>;
    readonly tangents: Int8Array<ArrayBuffer>;
    readonly colors: Uint8Array<ArrayBuffer>;
    readonly indices: Uint32Array<ArrayBuffer>;
    readonly lods: Uint32Array<ArrayBuffer>;
    /** Highest quality triangle range; lower quality LODs are retained separately. */
    readonly highQualityIndices: Uint32Array<ArrayBuffer>;
    /** Skinning and facial records remain in the original file; this view is the undeformed mesh. */
    readonly boneCount: number;
    readonly facialBytes: number;
}

/** Binary spans validated before any vertex-sized allocation. */
export interface RobloxMeshHeader {
    readonly vertexCount: number;
    readonly faceCount: number;
    readonly stride: number;
    readonly vertexOffset: number;
    readonly faceOffset: number;
    readonly lodOffset: number;
    readonly lodCount: number;
    readonly boneCount: number;
    readonly facialBytes: number;
}
