// SPDX-License-Identifier: Apache-2.0

import type { RobloxMeshHeader } from './RobloxMeshTypes';

/** FileMesh v2-v5 layouts. Byte spans are checked before decoded buffers are allocated. */
export class RobloxMeshHeaders {
    /** Rejects corrupt strides, huge counts and truncated ancillary records. */
    public static read(view: DataView, version: string, offset: number): RobloxMeshHeader {
        const v2: boolean = version === '2.00';
        const v3: boolean = version === '3.00' || version === '3.01';
        const v5: boolean = version === '5.00';
        if (!v2 && !v3 && version !== '4.00' && version !== '4.01' && !v5) {
            throw new Error('Unsupported Roblox mesh version: ' + version);
        }
        const headerSize: number = v2 ? 12 : v3 ? 16 : v5 ? 32 : 24;
        if (offset + headerSize > view.byteLength || view.getUint16(offset, true) !== headerSize) {
            throw new Error('Invalid or truncated Roblox mesh header');
        }
        const stride: number = v2 || v3 ? view.getUint8(offset + 2) : 40;
        if (
            (stride !== 36 && stride !== 40) ||
            ((v2 || v3) && view.getUint8(offset + 3) !== 12) ||
            (v3 && view.getUint16(offset + 4, true) !== 4)
        ) {
            throw new Error('Invalid Roblox mesh record strides');
        }
        const vertexCount: number = view.getUint32(offset + (v3 ? 8 : 4), true);
        const faceCount: number = view.getUint32(offset + (v3 ? 12 : 8), true);
        if (vertexCount < 1 || vertexCount > 100000 || faceCount < 1 || faceCount > 200000) {
            throw new Error('Roblox mesh exceeds vertex/triangle limits or is empty');
        }
        const lodCount: number = v2 ? 0 : view.getUint16(offset + (v3 ? 6 : 12), true);
        const boneCount: number = v2 || v3 ? 0 : view.getUint16(offset + 14, true);
        const names: number = v2 || v3 ? 0 : view.getUint32(offset + 16, true);
        const subsets: number = v2 || v3 ? 0 : view.getUint16(offset + 20, true);
        const facialBytes: number = v5 ? view.getUint32(offset + 28, true) : 0;
        if (lodCount > 256 || boneCount > 1024 || names > 1048576 || subsets > 4096) {
            throw new Error('Roblox mesh ancillary records exceed limits');
        }
        const vertexOffset: number = offset + headerSize;
        const faceOffset: number =
            vertexOffset + vertexCount * stride + (boneCount === 0 ? 0 : vertexCount * 8);
        const lodOffset: number = faceOffset + faceCount * 12;
        const end: number =
            lodOffset + lodCount * 4 + boneCount * 60 + names + subsets * 72 + facialBytes;
        if (end !== view.byteLength) {
            throw new Error('Roblox mesh byte spans are truncated or contain trailing data');
        }
        return {
            vertexCount,
            faceCount,
            stride,
            vertexOffset,
            faceOffset,
            lodOffset,
            lodCount,
            boneCount,
            facialBytes,
        };
    }
}
