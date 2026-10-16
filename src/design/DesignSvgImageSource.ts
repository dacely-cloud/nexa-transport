// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignAssetMime } from './DesignAssetTypes.js';
import type { DesignSvgImageSource as Source } from './DesignSvgImageTypes.js';
import { DesignSvgImportLimits } from './DesignSvgImportTypes.js';

/** Embedded raster decoding performs no network, filesystem or SVG-document loading. */
export class DesignSvgImageSource {
    /** Admits bounded canonical base64 for the supported raster formats. */
    public static decode(reference: string, name: string): Source {
        if (reference.length > DesignSvgImportLimits.characters) {
            throw new DesignSvgInputError('Embedded SVG image exceeds the source budget.');
        }
        const match: RegExpMatchArray | null = /^data:([^;,]+);base64,([\s\S]*)$/iu.exec(reference);
        const declared: string = (match?.[1] ?? '').toLowerCase();
        const mime: DesignAssetMime | undefined = Object.values(DesignAssetMime).find(
            (value: DesignAssetMime): boolean => value === declared,
        );
        if (match === null || mime === undefined) {
            throw new DesignSvgInputError(
                'SVG images require embedded PNG, JPEG, WebP or GIF data. External references and embedded SVG documents are not supported.',
            );
        }
        const encoded: string = (match[2] ?? '').replace(/[\t\n\r ]/gu, '');
        let decoded: string;
        try {
            decoded = atob(encoded);
        } catch {
            throw new DesignSvgInputError('Invalid embedded SVG image base64.');
        }
        if (
            decoded.length === 0 ||
            btoa(decoded) !== encoded ||
            BigInt(decoded.length) > DesignSvgImportLimits.bytes
        ) {
            throw new DesignSvgInputError(
                'Embedded SVG image data must be bounded canonical base64.',
            );
        }
        return {
            name,
            mime,
            bytes: Uint8Array.from(decoded, (character: string): number => character.charCodeAt(0)),
        };
    }
}
