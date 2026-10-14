// SPDX-License-Identifier: Apache-2.0

import type { RobloxMeshData } from './RobloxMeshTypes';

/** Legacy text FileMesh preserves v1.00's half scale and its original UV convention. */
export class RobloxMeshAscii {
    /** Parses exactly the declared triangles without accepting NaN, Infinity or trailing records. */
    public static read(bytes: Uint8Array, version: string, offset: number): RobloxMeshData {
        const text: string = new TextDecoder('utf-8', { fatal: true }).decode(
            bytes.subarray(offset),
        );
        const line: number = text.indexOf('\n');
        const countText: string = text.slice(0, line).trim();
        if (line < 0 || !/^[0-9]{1,6}$/u.test(countText)) {
            throw new Error('Invalid legacy mesh triangle count');
        }
        const count: number = Number(countText);
        if (count < 1 || count > 33333) {
            throw new Error('Legacy Roblox mesh exceeds triangle limits');
        }
        const vertexCount: number = count * 3;
        if (text.length - line - 1 < vertexCount * 21) {
            throw new Error('Truncated legacy Roblox mesh records');
        }
        const positions: Float32Array<ArrayBuffer> = new Float32Array(vertexCount * 3);
        const normals: Float32Array<ArrayBuffer> = new Float32Array(vertexCount * 3);
        const uvs: Float32Array<ArrayBuffer> = new Float32Array(vertexCount * 2);
        const tangents: Int8Array<ArrayBuffer> = new Int8Array(vertexCount * 4);
        const colors: Uint8Array<ArrayBuffer> = new Uint8Array(vertexCount * 4).fill(255);
        const indices: Uint32Array<ArrayBuffer> = new Uint32Array(vertexCount);
        const number: string = '([+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?)';
        const triple: RegExp = new RegExp(
            '\\s*\\[\\s*' + number + '\\s*,\\s*' + number + '\\s*,\\s*' + number + '\\s*\\]',
            'y',
        );
        triple.lastIndex = line + 1;
        for (let index: number = 0; index < vertexCount; index++) {
            for (let field: number = 0; field < 3; field++) {
                const match: RegExpExecArray | null = triple.exec(text);
                if (match === null) {
                    throw new Error('Invalid legacy Roblox mesh vertex');
                }
                for (let axis: number = 0; axis < 3; axis++) {
                    const component: string | undefined = match[axis + 1];
                    const value: number = Number(component);
                    if (
                        component === undefined ||
                        !Number.isFinite(value) ||
                        Math.abs(value) > 1e8
                    ) {
                        throw new Error('Invalid legacy mesh component');
                    }
                    if (field === 0) {
                        positions[index * 3 + axis] = value * (version === '1.00' ? 0.5 : 1);
                    } else if (field === 1) {
                        normals[index * 3 + axis] = value;
                    } else if (axis < 2) {
                        uvs[index * 2 + axis] = axis === 1 ? 1 - value : value;
                    }
                }
            }
            indices[index] = index;
        }
        if (text.slice(triple.lastIndex).trim() !== '') {
            throw new Error('Trailing legacy Roblox mesh records');
        }
        return {
            version,
            positions,
            normals,
            uvs,
            tangents,
            colors,
            indices,
            highQualityIndices: indices,
            lods: new Uint32Array([0, count]),
            boneCount: 0,
            facialBytes: 0,
        };
    }
}
