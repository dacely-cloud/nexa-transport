// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgMatrix } from './DesignSvgTransforms.js';

/** Resolved local templates retain original XML children solely during the import transaction. */
export interface DesignSvgPatternDefinition {
    readonly element: DesignSvgElement;
    readonly attributes: Readonly<Record<string, string>>;
    readonly children: readonly DesignSvgElement[];
}

/** A referenced source cell becomes an ordinary editable component in a separate library page. */
export interface DesignSvgPatternSourcePlan {
    readonly id: string;
    readonly patternId: string;
    readonly definition: DesignSvgPatternDefinition;
    readonly style: Readonly<Record<string, string>>;
    readonly width: number;
    readonly height: number;
    readonly matrix: DesignSvgMatrix;
    readonly viewportWidth: number;
    readonly viewportHeight: number;
    readonly references: readonly string[];
}
