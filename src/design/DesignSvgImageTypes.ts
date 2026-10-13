// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignAsset, DesignAssetMime } from './DesignAssetTypes.js';

/** An embedded raster is decoded once and never retained in saved layer records. */
export interface DesignSvgImageSource {
    readonly name: string;
    readonly mime: DesignAssetMime;
    readonly bytes: Uint8Array<ArrayBuffer>;
}

/** The host admits immutable image bytes in its own authenticated asset storage. */
export type DesignSvgImageLoader = (source: DesignSvgImageSource) => Promise<DesignAsset>;
