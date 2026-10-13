// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Scalar force coefficients followed by a common 3x3 transport matrix. */
export class RobloxParticleRigidTransfer {
    static readonly #scratch: Float64Array = new Float64Array(15);
    /** Creates an identity product in eighteen consecutive coefficients. */
    public static identity(output: Float64Array, offset: number): void {
        output.fill(0, offset, offset + 18);
        output[offset] = 1;
        output[offset + 9] = 1;
        output[offset + 13] = 1;
        output[offset + 17] = 1;
    }

    /** Composes left then right; the output may alias either input. */
    public static compose(
        left: Float64Array,
        a: number,
        right: Float64Array,
        b: number,
        output: Float64Array,
        target: number,
    ): void {
        const multiplier: number = (left[a] ?? 1) * (right[b] ?? 1);
        const rightTravel: number = right[b + 4] ?? 0;
        const travel: number =
            (left[a + 4] ?? 0) + (rightTravel === 0 ? 0 : rightTravel * (left[a] ?? 1));
        const age: number = (left[a + 8] ?? 0) + (right[b + 8] ?? 0);
        const rotated: Float64Array = RobloxParticleRigidTransfer.#scratch;
        for (let row: number = 0; row < 3; row++) {
            for (let column: number = 0; column < 3; column++) {
                let sum: number = 0;
                for (let k: number = 0; k < 3; k++) {
                    sum += (right[b + 9 + row * 3 + k] ?? 0) * (left[a + 9 + k * 3 + column] ?? 0);
                }
                rotated[row * 3 + column] = sum;
            }
            let velocity: number = 0;
            let position: number = 0;
            for (let k: number = 0; k < 3; k++) {
                const factor: number = right[b + 9 + row * 3 + k] ?? 0;
                if (factor === 0) {
                    continue;
                }
                const v: number = left[a + 1 + k] ?? 0;
                const p: number = left[a + 5 + k] ?? 0;
                velocity += factor * v;
                position += factor * p;
            }
            rotated[9 + row] =
                (velocity === 0 ? 0 : (right[b] ?? 1) * velocity) + (right[b + 1 + row] ?? 0);
            rotated[12 + row] =
                position +
                (velocity === 0 ? 0 : (right[b + 4] ?? 0) * velocity) +
                (right[b + 5 + row] ?? 0);
        }
        output[target] = multiplier;
        output[target + 4] = travel;
        output[target + 8] = age;
        for (let index: number = 0; index < 9; index++) {
            output[target + 9 + index] = rotated[index] ?? 0;
        }
        for (let axis: number = 0; axis < 3; axis++) {
            output[target + 1 + axis] = rotated[9 + axis] ?? 0;
            output[target + 5 + axis] = rotated[12 + axis] ?? 0;
        }
    }
}
