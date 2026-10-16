// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignAsset } from './DesignAssetTypes.js';
import { DesignAssetCodec } from './DesignAssetCodec.js';
import { DesignSvgImageSource } from './DesignSvgImageSource.js';
import type { DesignSvgImageLoader } from './DesignSvgImageTypes.js';
import { DesignSvgInputError } from './DesignSvgInputError.js';

/** Image layers and referenced raster paints share one admission in the import transaction. */
export class DesignSvgImageAssets {
    readonly #assets: Map<string, DesignAsset> = new Map();

    public constructor(public readonly load: DesignSvgImageLoader | null) {}

    /** Only referenced embedded rasters reach the authenticated host; unused definitions remain inert. */
    public async admit(reference: string, name: string): Promise<DesignAsset> {
        const cached: DesignAsset | undefined = this.#assets.get(reference);
        if (cached !== undefined) {
            return cached;
        }
        if (this.load === null) {
            throw new DesignSvgInputError('Save this layout to import embedded SVG images.');
        }
        const source: ReturnType<typeof DesignSvgImageSource.decode> = DesignSvgImageSource.decode(
            reference,
            name,
        );
        const asset: DesignAsset = DesignAssetCodec.asset(await this.load(source));
        if (
            asset.mime !== source.mime ||
            BigInt(asset.byteLength) !== BigInt(source.bytes.length)
        ) {
            throw new Error('SVG image admission does not match the embedded raster.');
        }
        this.#assets.set(reference, asset);
        return asset;
    }
}
