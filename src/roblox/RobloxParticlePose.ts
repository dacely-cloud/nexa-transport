// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxCFrame, RobloxScene, RobloxSceneNode } from './RobloxSceneTypes';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxProperties, RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxValues } from './RobloxSceneSchema';
import { RobloxParticleRigidTransfer } from './RobloxParticleRigidTransfer';
import { RobloxPartGeometry } from './RobloxPartGeometry';

/** Rigid emitter frames are independent of particle age and scaled simulation time. */
export class RobloxParticlePose {
    /** Composes Attachment ancestors up to the first world-space BasePart. */
    public static parent(
        scene: RobloxScene,
        emitterId: string,
        time: number,
        trigger: string | null,
    ): RobloxCFrame {
        const nodes: ReadonlyMap<string, RobloxSceneNode> = RobloxSceneHierarchy.active(
            scene,
            time,
        );
        let node: RobloxSceneNode | undefined = nodes.get(emitterId);
        let result: RobloxCFrame = RobloxValues.cframe();
        while (node !== undefined && node.parentId !== null) {
            node = nodes.get(node.parentId);
            if (node === undefined) {
                break;
            }
            if (node.className !== 'Attachment' && !RobloxPartGeometry.isPart(node.className)) {
                break;
            }
            const frame: RobloxCFrame = RobloxProperties.cframe(
                RobloxSceneRuntime.properties(scene, node.id, time, trigger),
                'CFrame',
            );
            result = this.multiply(frame, result);
            if (node.className !== 'Attachment') {
                break;
            }
        }
        return result;
    }

    /** Multiplies two row-major native frames without a browser matrix dependency. */
    public static multiply(left: RobloxCFrame, right: RobloxCFrame): RobloxCFrame {
        const a: readonly number[] = left.components;
        const b: readonly number[] = right.components;
        const output: number[] = new Array<number>(12).fill(0);
        for (let row: number = 0; row < 3; row++) {
            output[row] = a[row] ?? 0;
            for (let k: number = 0; k < 3; k++) {
                output[row] = (output[row] ?? 0) + (a[3 + row * 3 + k] ?? 0) * (b[k] ?? 0);
            }
            for (let column: number = 0; column < 3; column++) {
                let sum: number = 0;
                for (let k: number = 0; k < 3; k++) {
                    sum += (a[3 + row * 3 + k] ?? 0) * (b[3 + k * 3 + column] ?? 0);
                }
                output[3 + row * 3 + column] = sum;
            }
        }
        return {
            kind: 'CFrame',
            components: [
                output[0] ?? 0,
                output[1] ?? 0,
                output[2] ?? 0,
                output[3] ?? 0,
                output[4] ?? 0,
                output[5] ?? 0,
                output[6] ?? 0,
                output[7] ?? 0,
                output[8] ?? 0,
                output[9] ?? 0,
                output[10] ?? 0,
                output[11] ?? 0,
            ],
        };
    }

    /** Writes the relative parent transform; exact repeated poses produce exact identity. */
    public static delta(
        from: RobloxCFrame,
        to: RobloxCFrame,
        output: Float64Array,
        offset: number = 0,
    ): void {
        RobloxParticleRigidTransfer.identity(output, offset);
        const a: readonly number[] = from.components;
        const b: readonly number[] = to.components;
        if (a.every((value: number, index: number): boolean => value === b[index])) {
            return;
        }
        const determinant: number =
            (a[3] ?? 0) * ((a[7] ?? 0) * (a[11] ?? 0) - (a[8] ?? 0) * (a[10] ?? 0)) -
            (a[4] ?? 0) * ((a[6] ?? 0) * (a[11] ?? 0) - (a[8] ?? 0) * (a[9] ?? 0)) +
            (a[5] ?? 0) * ((a[6] ?? 0) * (a[10] ?? 0) - (a[7] ?? 0) * (a[9] ?? 0));
        for (let row: number = 0; row < 3; row++) {
            for (let column: number = 0; column < 3; column++) {
                const r1: number = (column + 1) % 3;
                const r2: number = (column + 2) % 3;
                let sum: number = 0;
                for (let k: number = 0; k < 3; k++) {
                    const c1: number = (k + 1) % 3;
                    const c2: number = (k + 2) % 3;
                    const inverse: number =
                        ((a[3 + r1 * 3 + c1] ?? 0) * (a[3 + r2 * 3 + c2] ?? 0) -
                            (a[3 + r1 * 3 + c2] ?? 0) * (a[3 + r2 * 3 + c1] ?? 0)) /
                        determinant;
                    sum += (b[3 + row * 3 + k] ?? 0) * inverse;
                }
                output[offset + 9 + row * 3 + column] = sum;
            }
            let translation: number = b[row] ?? 0;
            for (let k: number = 0; k < 3; k++) {
                translation -= (output[offset + 9 + row * 3 + k] ?? 0) * (a[k] ?? 0);
            }
            output[offset + 5 + row] = translation;
        }
    }
}
