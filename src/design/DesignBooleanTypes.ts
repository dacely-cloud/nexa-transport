// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignStroke } from './DesignTypes.js';
/** Boolean groups retain their source layers and derive one shared vector silhouette. */
export const DesignBooleanMode = {
    Union: 'union',
    Subtract: 'subtract',
    Intersect: 'intersect',
    Exclude: 'exclude',
} as const;
/** The group's ordered set operation. Subtract keeps the bottom source and removes the others. */
export type DesignBooleanMode = (typeof DesignBooleanMode)[keyof typeof DesignBooleanMode];

/** A canonical local outline and its resolved transform; stroke expansion precedes transformation. */
export interface DesignBooleanOperand {
    readonly outline: string;
    readonly filled: boolean;
    readonly stroke: DesignStroke | null;
    readonly matrix: readonly number[];
}
