// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxCFrame, RobloxVector3 } from './RobloxSceneTypes';
import type { RobloxParticleView } from './RobloxParticleOrientation';

/** One sampled center and unit ribbon width direction on a native cubic curve. */
export interface RobloxBeamPoint {
    readonly center: RobloxVector3;
    readonly up: RobloxVector3;
}

/** Cubic control points follow Attachment X axes; width directions use Y axes or the camera. */
export class RobloxBeamPath {
    public constructor(
        public readonly start: RobloxCFrame,
        public readonly end: RobloxCFrame,
        public readonly curve0: number,
        public readonly curve1: number,
    ) {}

    /** Samples the actual cubic polynomial and its derivative without projecting to screen space. */
    public point(t: number, view: RobloxParticleView, faceCamera: boolean): RobloxBeamPoint {
        const center: number[] = [0, 0, 0];
        const tangent: number[] = [0, 0, 0];
        const u: number = 1 - t;
        for (let axis: number = 0; axis < 3; axis++) {
            const p0: number = this.start.components[axis] ?? 0;
            const p3: number = this.end.components[axis] ?? 0;
            const p1: number = p0 + (this.start.components[3 + axis * 3] ?? 0) * this.curve0;
            const p2: number = p3 - (this.end.components[3 + axis * 3] ?? 0) * this.curve1;
            center[axis] =
                u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
            tangent[axis] = 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
        }
        let tx: number = tangent[0] ?? 0;
        let ty: number = tangent[1] ?? 0;
        let tz: number = tangent[2] ?? 0;
        let length: number = Math.hypot(tx, ty, tz);
        if (length < 1e-10) {
            tx = this.end.components[0] - this.start.components[0];
            ty = this.end.components[1] - this.start.components[1];
            tz = this.end.components[2] - this.start.components[2];
            length = Math.hypot(tx, ty, tz);
        }
        if (length < 1e-10) {
            tx = this.start.components[3];
            ty = this.start.components[6];
            tz = this.start.components[9];
            length = Math.hypot(tx, ty, tz);
        }
        tx /= length;
        ty /= length;
        tz /= length;
        const cx: number = center[0] ?? 0;
        const cy: number = center[1] ?? 0;
        const cz: number = center[2] ?? 0;
        let ux: number;
        let uy: number;
        let uz: number;
        if (faceCamera) {
            const vx: number = view.position.x - cx;
            const vy: number = view.position.y - cy;
            const vz: number = view.position.z - cz;
            ux = vy * tz - vz * ty;
            uy = vz * tx - vx * tz;
            uz = vx * ty - vy * tx;
        } else {
            ux = this.start.components[4] * u + this.end.components[4] * t;
            uy = this.start.components[7] * u + this.end.components[7] * t;
            uz = this.start.components[10] * u + this.end.components[10] * t;
        }
        const dot: number = ux * tx + uy * ty + uz * tz;
        ux -= dot * tx;
        uy -= dot * ty;
        uz -= dot * tz;
        if (Math.hypot(ux, uy, uz) < 1e-10) {
            const vertical: number = view.up.x * tx + view.up.y * ty + view.up.z * tz;
            ux = view.up.x - vertical * tx;
            uy = view.up.y - vertical * ty;
            uz = view.up.z - vertical * tz;
        }
        if (Math.hypot(ux, uy, uz) < 1e-10) {
            const horizontal: number = view.right.x * tx + view.right.y * ty + view.right.z * tz;
            ux = view.right.x - horizontal * tx;
            uy = view.right.y - horizontal * ty;
            uz = view.right.z - horizontal * tz;
        }
        const width: number = Math.hypot(ux, uy, uz);
        return {
            center: { kind: 'Vector3', x: cx, y: cy, z: cz },
            up: { kind: 'Vector3', x: ux / width, y: uy / width, z: uz / width },
        };
    }
}
