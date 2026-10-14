// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignFontSource } from './DesignFontEngine.js';
import type { DesignFontAsset } from './DesignFontTypes.js';

/** Host admission receives decoded standalone bytes, never a filesystem path or remote URL. */
export type DesignSvgFontLoader = (source: DesignFontSource) => Promise<DesignFontAsset>;

/** A declared embedded face keeps its exact CSS range and admitted immutable binding. */
export interface DesignSvgFontFace {
    readonly family: string;
    readonly minimum: number;
    readonly maximum: number;
    readonly italic: boolean;
    readonly decodedBytes: number;
    readonly source: DesignFontSource | null;
}
