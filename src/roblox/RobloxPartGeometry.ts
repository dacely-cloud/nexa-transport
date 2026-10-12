// SPDX-License-Identifier: Apache-2.0

import type { RobloxClass, RobloxSceneNode, RobloxValue, RobloxVector3 } from './RobloxSceneTypes';

/** Unit Part geometry; CFrame and Size are applied at each recorded observation. */
export interface RobloxPartVertex {
    readonly point: RobloxVector3;
    readonly normal: RobloxVector3;
}

/** Bounded immutable triangle meshes, reused across instances and timestamps. */
export class RobloxPartGeometry {
    static readonly #meshes: Map<number, readonly RobloxPartVertex[]> = new Map();
    /** Identifies every currently represented native primitive BasePart class. */
    public static isPart(className: RobloxClass): boolean {
        return className === 'Part' || className === 'WedgePart' || className === 'CornerWedgePart';
    }
    /** Reads the primitive without inventing a Shape property on dedicated wedge classes. */
    public static shape(
        node: RobloxSceneNode,
        properties: Readonly<Record<string, RobloxValue>> = node.properties,
    ): number {
        if (node.className === 'WedgePart') {
            return 3;
        }
        if (node.className === 'CornerWedgePart') {
            return 4;
        }
        const shape: RobloxValue | undefined = properties['Shape'];
        if (typeof shape !== 'object' || shape.kind !== 'Enum') {
            throw new Error('Missing native Part.Shape');
        }
        return shape.value;
    }
    /** Physical primitive dimensions, matching the native query solids over the authored Size. */
    public static dimensions(shape: number, size: RobloxVector3): RobloxVector3 {
        if (
            ![size.x, size.y, size.z].every(
                (value: number): boolean => Number.isFinite(value) && value > 0,
            )
        ) {
            throw new Error('Primitive Size must be positive and finite');
        }
        if (shape === 0) {
            const diameter: number = Math.min(size.x, size.y, size.z);
            return { kind: 'Vector3', x: diameter, y: diameter, z: diameter };
        }
        if (shape === 2) {
            const diameter: number = Math.min(size.y, size.z);
            return { kind: 'Vector3', x: size.x, y: diameter, z: diameter };
        }
        if (shape === 1 || shape === 3 || shape === 4) {
            return size;
        }
        throw new Error('Unsupported native Part shape');
    }
    /** Cached unit triangles shared by browser WebGL and Vulkan capture generation. */
    public static mesh(shape: number): readonly RobloxPartVertex[] {
        const existing: readonly RobloxPartVertex[] | undefined = this.#meshes.get(shape);
        if (existing !== undefined) {
            return existing;
        }
        const result: RobloxPartVertex[] = [];
        if (shape === 1) {
            for (let axis: number = 0; axis < 3; axis++) {
                for (const direction of [-1, 1]) {
                    const corners: RobloxVector3[] = [];
                    for (const [a, b] of [
                        [-0.5, -0.5],
                        [0.5, -0.5],
                        [0.5, 0.5],
                        [-0.5, 0.5],
                    ]) {
                        if (a === undefined || b === undefined) {
                            throw new Error('Invalid cube corner');
                        }
                        corners.push(this.#axis(axis, direction * 0.5, a, b));
                    }
                    this.#quad(result, corners);
                }
            }
        } else if (shape === 0) {
            for (let latitude: number = 0; latitude < 24; latitude++) {
                for (let longitude: number = 0; longitude < 32; longitude++) {
                    const points: readonly [
                        RobloxVector3,
                        RobloxVector3,
                        RobloxVector3,
                        RobloxVector3,
                    ] = [
                        this.#sphere(latitude, longitude),
                        this.#sphere(latitude + 1, longitude),
                        this.#sphere(latitude + 1, longitude + 1),
                        this.#sphere(latitude, longitude + 1),
                    ];
                    this.#curved(result, points[0], points[1], points[2], false);
                    this.#curved(result, points[0], points[2], points[3], false);
                }
            }
        } else if (shape === 2) {
            for (let segment: number = 0; segment < 32; segment++) {
                const a: number = (segment * Math.PI) / 16;
                const b: number = ((segment + 1) * Math.PI) / 16;
                const ay: number = Math.cos(a) * 0.5;
                const az: number = Math.sin(a) * 0.5;
                const by: number = Math.cos(b) * 0.5;
                const bz: number = Math.sin(b) * 0.5;
                const a0: RobloxVector3 = this.#axis(0, -0.5, ay, az);
                const a1: RobloxVector3 = this.#axis(0, 0.5, ay, az);
                const b0: RobloxVector3 = this.#axis(0, -0.5, by, bz);
                const b1: RobloxVector3 = this.#axis(0, 0.5, by, bz);
                this.#curved(result, a0, a1, b1, true);
                this.#curved(result, a0, b1, b0, true);
                for (const end of [-0.5, 0.5]) {
                    this.#triangle(
                        result,
                        this.#axis(0, end, 0, 0),
                        this.#axis(0, end, ay, az),
                        this.#axis(0, end, by, bz),
                    );
                }
            }
        } else if (shape === 3 || shape === 4) {
            const vertices: readonly RobloxVector3[] = [
                this.#axis(0, -0.5, -0.5, -0.5),
                this.#axis(0, 0.5, -0.5, -0.5),
                this.#axis(0, 0.5, -0.5, 0.5),
                this.#axis(0, -0.5, -0.5, 0.5),
                this.#axis(0, -0.5, 0.5, 0.5),
                this.#axis(0, 0.5, 0.5, 0.5),
            ];
            const faces: readonly (readonly number[])[] =
                shape === 3
                    ? [
                          [0, 1, 2],
                          [0, 2, 3],
                          [0, 3, 4],
                          [1, 5, 2],
                          [3, 2, 5],
                          [3, 5, 4],
                          [0, 4, 5],
                          [0, 5, 1],
                      ]
                    : [
                          [0, 1, 2],
                          [0, 2, 3],
                          [0, 3, 4],
                          [3, 2, 4],
                          [0, 4, 1],
                          [1, 4, 2],
                      ];
            const interior: RobloxVector3 =
                shape === 3 ? this.#axis(0, 0, -1 / 6, 1 / 6) : this.#axis(0, -0.1, -0.3, 0.1);
            for (const face of faces) {
                const a: RobloxVector3 | undefined = vertices[face[0] ?? -1];
                const b: RobloxVector3 | undefined = vertices[face[1] ?? -1];
                const c: RobloxVector3 | undefined = vertices[face[2] ?? -1];
                if (a === undefined || b === undefined || c === undefined) {
                    throw new Error('Invalid wedge mesh face');
                }
                this.#triangle(result, a, b, c, interior);
            }
        } else {
            throw new Error('Unsupported native capture Part shape');
        }
        for (const vertex of result) {
            Object.freeze(vertex.point);
            Object.freeze(vertex.normal);
            Object.freeze(vertex);
        }
        Object.freeze(result);
        this.#meshes.set(shape, result);
        return result;
    }
    static #sphere(latitude: number, longitude: number): RobloxVector3 {
        const a: number = (latitude * Math.PI) / 24;
        const b: number = (longitude * Math.PI) / 16;
        return {
            kind: 'Vector3',
            x: Math.sin(a) * Math.cos(b) * 0.5,
            y: Math.cos(a) * 0.5,
            z: Math.sin(a) * Math.sin(b) * 0.5,
        };
    }
    static #axis(axis: number, position: number, a: number, b: number): RobloxVector3 {
        return axis === 0
            ? { kind: 'Vector3', x: position, y: a, z: b }
            : axis === 1
              ? { kind: 'Vector3', x: a, y: position, z: b }
              : { kind: 'Vector3', x: a, y: b, z: position };
    }
    static #quad(result: RobloxPartVertex[], points: readonly RobloxVector3[]): void {
        const a: RobloxVector3 | undefined = points[0];
        const b: RobloxVector3 | undefined = points[1];
        const c: RobloxVector3 | undefined = points[2];
        const d: RobloxVector3 | undefined = points[3];
        if (a === undefined || b === undefined || c === undefined || d === undefined) {
            throw new Error('Invalid mesh quad');
        }
        this.#triangle(result, a, b, c);
        this.#triangle(result, a, c, d);
    }
    static #triangle(
        result: RobloxPartVertex[],
        a: RobloxVector3,
        b: RobloxVector3,
        c: RobloxVector3,
        interior: RobloxVector3 = { kind: 'Vector3', x: 0, y: 0, z: 0 },
    ): void {
        const ab: RobloxVector3 = { kind: 'Vector3', x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
        const ac: RobloxVector3 = { kind: 'Vector3', x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
        const cross: RobloxVector3 = this.#cross(ab, ac);
        const outward: boolean =
            cross.x * (a.x - interior.x) +
                cross.y * (a.y - interior.y) +
                cross.z * (a.z - interior.z) >=
            0;
        const normal: RobloxVector3 = this.#normal(
            outward ? cross : { kind: 'Vector3', x: -cross.x, y: -cross.y, z: -cross.z },
        );
        result.push(
            { point: a, normal },
            { point: outward ? b : c, normal },
            { point: outward ? c : b, normal },
        );
    }

    static #normal(value: RobloxVector3): RobloxVector3 {
        const length: number = Math.hypot(value.x, value.y, value.z);
        if (length === 0 || !Number.isFinite(length)) {
            throw new Error('Invalid mesh normal');
        }
        return { kind: 'Vector3', x: value.x / length, y: value.y / length, z: value.z / length };
    }

    static #curved(
        result: RobloxPartVertex[],
        a: RobloxVector3,
        b: RobloxVector3,
        c: RobloxVector3,
        cylinder: boolean,
    ): void {
        const ab: RobloxVector3 = { kind: 'Vector3', x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
        const ac: RobloxVector3 = { kind: 'Vector3', x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
        const cross: RobloxVector3 = this.#cross(ab, ac);
        if (cross.x * cross.x + cross.y * cross.y + cross.z * cross.z < 1e-28) {
            return;
        }
        const points: readonly RobloxVector3[] =
            cross.x * a.x + cross.y * a.y + cross.z * a.z >= 0 ? [a, b, c] : [a, c, b];
        for (const point of points) {
            const normal: RobloxVector3 = this.#normal({
                kind: 'Vector3',
                x: cylinder ? 0 : point.x,
                y: point.y,
                z: point.z,
            });
            result.push({ point, normal });
        }
    }

    static #cross(a: RobloxVector3, b: RobloxVector3): RobloxVector3 {
        return {
            kind: 'Vector3',
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x,
        };
    }
}
