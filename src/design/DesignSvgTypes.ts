// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignAsset } from './DesignAssetTypes.js';
import type { DesignLayoutResult } from './DesignLayoutTypes.js';
import type { DesignBox } from './DesignTypes.js';

/** Immutable original raster bytes embedded only during an explicit export. */
export interface DesignSvgImage {
    readonly asset: DesignAsset;
    readonly base64: string;
}
/** Export selection retains the complete scene for ancestor opacity and clipping lookup. */
export interface DesignSvgSelection {
    readonly scene: DesignLayoutResult;
    readonly boxes: readonly DesignBox[];
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly assetIds: readonly string[];
}
/** File and artboard dimensions stay small and independent of any model response. */
export interface DesignSvgResult {
    readonly svg: string;
    readonly width: number;
    readonly height: number;
}
/** Explicit export bounds keep image assembly and markup allocation predictable. */
export class DesignSvgLimits {
    /** Original bytes across all unique images in one export. */
    public static readonly imageBytes: bigint = 32n * 1024n * 1024n;
    /** UTF-16 characters in the completed document. */
    public static readonly characters: number = 64 * 1024 * 1024;
}
