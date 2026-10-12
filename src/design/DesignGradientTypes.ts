// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Top-left-origin normalized points define a linear segment or a radial center and two radius axes. */
export interface DesignGradientTransform {
    readonly startX: number;
    readonly startY: number;
    readonly endX: number;
    readonly endY: number;
    readonly axisX: number;
    readonly axisY: number;
}
/** Each coordinate may change independently without retransmitting other gradient or layer fields. */
export interface DesignGradientTransformChanges {
    readonly startX?: number;
    readonly startY?: number;
    readonly endX?: number;
    readonly endY?: number;
    readonly axisX?: number;
    readonly axisY?: number;
}
