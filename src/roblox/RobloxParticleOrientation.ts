// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxVector3 } from './RobloxSceneTypes';
import type { RobloxParticleFrame } from './RobloxParticleSimulator';

/** World-space camera axes shared by native projection and interactive browser cameras. */
export interface RobloxParticleView {
    readonly position: RobloxVector3;
    readonly right: RobloxVector3;
    readonly up: RobloxVector3;
}

/** Stable billboard bases for the four native ParticleOrientation enum values. */
export class RobloxParticleOrientation {
    /** Writes right/up axes without per-particle vector allocations; zero velocity faces the camera. */
    public static write(
        view: RobloxParticleView,
        frame: RobloxParticleFrame,
        index: number,
        output: Float32Array,
        offset: number = 0,
    ): void {
        const mode: number = frame.orientation;
        const start: number = index * 9;
        const velocity: number = index * 3;
        let ux: number = view.up.x;
        let uy: number = view.up.y;
        let uz: number = view.up.z;
        let rx: number = view.right.x;
        let ry: number = view.right.y;
        let rz: number = view.right.z;
        const cx: number = view.position.x - (frame.attributes[start] ?? 0);
        const cy: number = view.position.y - (frame.attributes[start + 1] ?? 0);
        const cz: number = view.position.z - (frame.attributes[start + 2] ?? 0);
        if (mode === 1) {
            const horizontal: number = Math.hypot(cx, cz);
            if (horizontal > 1e-8) {
                rx = cz / horizontal;
                ry = 0;
                rz = -cx / horizontal;
            }
            ux = 0;
            uy = 1;
            uz = 0;
        } else if (mode === 2 || mode === 3) {
            const vx: number = frame.velocities[velocity] ?? 0;
            const vy: number = frame.velocities[velocity + 1] ?? 0;
            const vz: number = frame.velocities[velocity + 2] ?? 0;
            const length: number = Math.hypot(vx, vy, vz);
            if (length > 1e-8) {
                const nx: number = vx / length;
                const ny: number = vy / length;
                const nz: number = vz / length;
                if (mode === 2) {
                    ux = nx;
                    uy = ny;
                    uz = nz;
                    rx = uy * cz - uz * cy;
                    ry = uz * cx - ux * cz;
                    rz = ux * cy - uy * cx;
                    let rightLength: number = Math.hypot(rx, ry, rz);
                    if (rightLength < 1e-8) {
                        const projected: number =
                            view.right.x * nx + view.right.y * ny + view.right.z * nz;
                        rx = view.right.x - projected * nx;
                        ry = view.right.y - projected * ny;
                        rz = view.right.z - projected * nz;
                        rightLength = Math.hypot(rx, ry, rz);
                    }
                    if (rightLength < 1e-8) {
                        rx = Math.abs(nx) < 0.9 ? 0 : -nz;
                        ry = Math.abs(nx) < 0.9 ? nz : 0;
                        rz = Math.abs(nx) < 0.9 ? -ny : nx;
                        rightLength = Math.hypot(rx, ry, rz);
                    }
                    rx /= rightLength;
                    ry /= rightLength;
                    rz /= rightLength;
                } else {
                    rx = nz;
                    ry = 0;
                    rz = -nx;
                    let rightLength: number = Math.hypot(rx, rz);
                    if (rightLength < 1e-8) {
                        rx = view.right.y * nz - view.right.z * ny;
                        ry = view.right.z * nx - view.right.x * nz;
                        rz = view.right.x * ny - view.right.y * nx;
                        rightLength = Math.hypot(rx, ry, rz);
                    }
                    if (rightLength < 1e-8) {
                        rx = 1;
                        ry = 0;
                        rz = 0;
                        rightLength = 1;
                    }
                    rx /= rightLength;
                    ry /= rightLength;
                    rz /= rightLength;
                    ux = ny * rz - nz * ry;
                    uy = nz * rx - nx * rz;
                    uz = nx * ry - ny * rx;
                }
            }
        }
        output[offset] = rx;
        output[offset + 1] = ry;
        output[offset + 2] = rz;
        output[offset + 3] = ux;
        output[offset + 4] = uy;
        output[offset + 5] = uz;
    }
}
