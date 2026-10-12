// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgMatrix } from './DesignSvgTransforms.js';

/** Each referenced subtree receives its own inherited appearance and SVG coordinate frame. */
export interface DesignSvgLayerContext {
    readonly parentId: string;
    readonly matrix: DesignSvgMatrix;
    readonly width: number;
    readonly height: number;
    readonly style: Readonly<Record<string, string>>;
    readonly ancestors: readonly DesignSvgElement[];
    readonly references: readonly string[];
}
