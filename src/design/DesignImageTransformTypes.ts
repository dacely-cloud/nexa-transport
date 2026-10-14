// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Forward affine map from original image unit coordinates to painted box unit coordinates. */
export interface DesignImageTransform {
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly d: number;
    readonly tx: number;
    readonly ty: number;
}
