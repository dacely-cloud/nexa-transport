// SPDX-License-Identifier: Apache-2.0

import type { RobloxMeshData } from './RobloxMeshTypes';

/** GLB requires unit normals; original FileMesh records remain unchanged for native use. */
export class RobloxMeshNormals {
    /** Retains supplied directions and reconstructs absent normals from highest-quality triangles. */
    public static export(data: RobloxMeshData): Float32Array<ArrayBuffer> {
        const result: Float32Array<ArrayBuffer> = data.normals.slice();
        let missing: Uint8Array<ArrayBuffer> | null = null;
        for (let index: number = 0; index < result.length; index += 3) {
            if (
                Math.hypot(result[index] ?? 0, result[index + 1] ?? 0, result[index + 2] ?? 0) === 0
            ) {
                missing ??= new Uint8Array(result.length / 3);
                missing[index / 3] = 1;
            }
        }
        if (missing !== null) {
            for (let index: number = 0; index < data.highQualityIndices.length; index += 3) {
                const a: number = (data.highQualityIndices[index] ?? 0) * 3;
                const b: number = (data.highQualityIndices[index + 1] ?? 0) * 3;
                const c: number = (data.highQualityIndices[index + 2] ?? 0) * 3;
                const ux: number = (data.positions[b] ?? 0) - (data.positions[a] ?? 0);
                const uy: number = (data.positions[b + 1] ?? 0) - (data.positions[a + 1] ?? 0);
                const uz: number = (data.positions[b + 2] ?? 0) - (data.positions[a + 2] ?? 0);
                const vx: number = (data.positions[c] ?? 0) - (data.positions[a] ?? 0);
                const vy: number = (data.positions[c + 1] ?? 0) - (data.positions[a + 1] ?? 0);
                const vz: number = (data.positions[c + 2] ?? 0) - (data.positions[a + 2] ?? 0);
                for (let corner: number = 0; corner < 3; corner++) {
                    const vertex: number = data.highQualityIndices[index + corner] ?? 0;
                    if (missing[vertex] !== 1) {
                        continue;
                    }
                    result[vertex * 3] = (result[vertex * 3] ?? 0) + uy * vz - uz * vy;
                    result[vertex * 3 + 1] = (result[vertex * 3 + 1] ?? 0) + uz * vx - ux * vz;
                    result[vertex * 3 + 2] = (result[vertex * 3 + 2] ?? 0) + ux * vy - uy * vx;
                }
            }
        }
        for (let index: number = 0; index < result.length; index += 3) {
            const x: number = result[index] ?? 0;
            const y: number = result[index + 1] ?? 0;
            const z: number = result[index + 2] ?? 0;
            const length: number = Math.hypot(x, y, z);
            result[index] = length === 0 ? 0 : x / length;
            result[index + 1] = length === 0 ? 1 : y / length;
            result[index + 2] = length === 0 ? 0 : z / length;
        }
        return result;
    }
}
