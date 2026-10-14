// SPDX-License-Identifier: Apache-2.0

import type { RobloxMeshData, RobloxMeshHeader } from './RobloxMeshTypes';
import { RobloxMeshHeaders } from './RobloxMeshHeader';
import { RobloxMeshAscii } from './RobloxMeshAscii';

/** Portable, bounded original FileMesh decoding; no network, filesystem or GPU dependencies. */
export class RobloxMeshDecoder {
    public static readonly maximumBytes: number = 4 * 1024 * 1024;

    /** Reads bytes from a validated transport boundary; all numeric records are checked. */
    public static decode(bytes: Uint8Array): RobloxMeshData {
        if (bytes.byteLength < 13 || bytes.byteLength > this.maximumBytes) {
            throw new Error('Roblox mesh exceeds the 4 MiB byte limit or is incomplete');
        }
        const prefix: string = new TextDecoder().decode(bytes.subarray(0, 13));
        if (!/^version [1-5]\.[0-9]{2}\n$/u.test(prefix)) {
            throw new Error('Invalid or unsupported Roblox FileMesh signature');
        }
        const version: string = prefix.slice(8, 12);
        if (version === '1.00' || version === '1.01') {
            return RobloxMeshAscii.read(bytes, version, 13);
        }
        const view: DataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const header: RobloxMeshHeader = RobloxMeshHeaders.read(view, version, 13);
        const positions: Float32Array<ArrayBuffer> = new Float32Array(header.vertexCount * 3);
        const normals: Float32Array<ArrayBuffer> = new Float32Array(header.vertexCount * 3);
        const uvs: Float32Array<ArrayBuffer> = new Float32Array(header.vertexCount * 2);
        const tangents: Int8Array<ArrayBuffer> = new Int8Array(header.vertexCount * 4);
        const colors: Uint8Array<ArrayBuffer> = new Uint8Array(header.vertexCount * 4).fill(255);
        for (let index: number = 0; index < header.vertexCount; index++) {
            const start: number = header.vertexOffset + index * header.stride;
            for (let axis: number = 0; axis < 8; axis++) {
                const value: number = view.getFloat32(start + axis * 4, true);
                if (!Number.isFinite(value) || Math.abs(value) > 1e8) {
                    throw new Error('Roblox mesh contains an invalid numeric vertex');
                }
                if (axis < 3) {
                    positions[index * 3 + axis] = value;
                } else if (axis < 6) {
                    normals[index * 3 + axis - 3] = value;
                } else {
                    uvs[index * 2 + axis - 6] = value;
                }
            }
            for (let axis: number = 0; axis < 4; axis++) {
                tangents[index * 4 + axis] = view.getInt8(start + 32 + axis);
                if (header.stride === 40) {
                    colors[index * 4 + axis] = view.getUint8(start + 36 + axis);
                }
            }
        }
        const indices: Uint32Array<ArrayBuffer> = new Uint32Array(header.faceCount * 3);
        for (let index: number = 0; index < indices.length; index++) {
            const value: number = view.getUint32(header.faceOffset + index * 4, true);
            if (value >= header.vertexCount) {
                throw new Error('Roblox mesh triangle references a missing vertex');
            }
            indices[index] = value;
        }
        const lods: Uint32Array<ArrayBuffer> =
            header.lodCount === 0
                ? new Uint32Array([0, header.faceCount])
                : new Uint32Array(header.lodCount);
        if (header.lodCount !== 0) {
            if (header.lodCount < 2) {
                throw new Error('Incomplete Roblox mesh LOD range');
            }
            for (let index: number = 0; index < lods.length; index++) {
                const value: number = view.getUint32(header.lodOffset + index * 4, true);
                if (value > header.faceCount || value < (lods[index - 1] ?? 0)) {
                    throw new Error('Invalid Roblox mesh LOD boundaries');
                }
                lods[index] = value;
            }
            if (lods[0] !== 0 || lods[lods.length - 1] !== header.faceCount) {
                throw new Error('Roblox mesh LODs do not cover the triangle records');
            }
        }
        const highQualityIndices: Uint32Array<ArrayBuffer> = indices.subarray(
            0,
            (lods[1] ?? header.faceCount) * 3,
        );
        if (highQualityIndices.length === 0) {
            throw new Error('Roblox mesh highest quality LOD is empty');
        }
        return {
            version,
            positions,
            normals,
            uvs,
            tangents,
            colors,
            indices,
            lods,
            highQualityIndices,
            boneCount: header.boneCount,
            facialBytes: header.facialBytes,
        };
    }
}
