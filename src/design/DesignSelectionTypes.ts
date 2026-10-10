// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignOperation } from './DesignOperationTypes.js';

/** Selection commands share one implementation between agent tools and browser editors. */
export const DesignSelectionAction = {
    Duplicate: 'duplicate',
    Group: 'group',
    Ungroup: 'ungroup',
    Union: 'union',
    Subtract: 'subtract',
    Intersect: 'intersect',
    Exclude: 'exclude',
    Flatten: 'flatten',
    Left: 'left',
    Center: 'center',
    Right: 'right',
    Top: 'top',
    Middle: 'middle',
    Bottom: 'bottom',
    DistributeHorizontal: 'distribute-horizontal',
    DistributeVertical: 'distribute-vertical',
    Front: 'front',
    Back: 'back',
} as const;
/** A command's stable action identity. */
export type DesignSelectionAction =
    (typeof DesignSelectionAction)[keyof typeof DesignSelectionAction];
/** One complete transaction and the resulting editable selection. */
export interface DesignSelectionPlan {
    readonly operations: readonly DesignOperation[];
    readonly selection: readonly string[];
}
/** Agents use the normal command identity and revision guard for generated selection edits. */
export interface DesignArrangeRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly action: DesignSelectionAction;
}
/** A center-derived local transform preserves world geometry when changing containers. */
export interface DesignSelectionGeometry {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly rotation: number;
}
/** Rotated layer bounds are measured along the containing coordinate axes. */
export interface DesignSelectionBounds {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
}
