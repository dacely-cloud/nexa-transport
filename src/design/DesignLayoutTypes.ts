// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignText, DesignBox } from './DesignTypes.js';
import type { DesignSceneNode } from './DesignScene.js';

/** Natural content dimensions, independent of its placement. */
export interface DesignSize {
    readonly width: number;
    readonly height: number;
}
/** Resolved placement in parent-local coordinates. */
export interface DesignLocalBox extends DesignSize {
    readonly id: string;
    readonly x: number;
    readonly y: number;
}
/** Font measurement is supplied by the platform without making layout depend on DOM APIs. */
export interface DesignTextMeasurer {
    readonly measure: (text: DesignText, maximumWidth: number) => DesignSize;
}
/** World-space boxes retain source identities for selecting nested instances. */
export interface DesignLayoutResult {
    readonly nodes: readonly DesignSceneNode[];
    readonly boxes: readonly DesignBox[];
}
/** Row/column item with intrinsic dimensions and bounded flexible sizing. */
export interface DesignFlowItem extends DesignSize {
    readonly node: DesignSceneNode;
}
