// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignPaintKind,
    type DesignPaint,
    type DesignBox,
    type DesignImage,
    type DesignStyle,
} from './DesignTypes.js';
import type { DesignAsset } from './DesignAssetTypes.js';
import type { DesignSvgImage } from './DesignSvgTypes.js';
import { DesignAssetCodec } from './DesignAssetCodec.js';
import { DesignImageGeometry, type DesignImagePlacement } from './DesignImageGeometry.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignSelectionBounds } from './DesignSelectionTypes.js';
import { DesignSvgGeometry as Geometry } from './DesignSvgGeometry.js';

/** Generated identifiers keep every URL local to the exported SVG, including image paints. */
export class DesignSvgPaints {
    #sequence: number = 0;
    #imageIdentities: Map<string, string> = new Map();
    /** Paint and clipping definitions precede the drawing elements. */
    public readonly definitions: string[] = [];
    /** Asset metadata and original bytes are supplied by the owner-scoped export adapter. */
    public constructor(public readonly images: ReadonlyMap<string, DesignSvgImage>) {}
    /** Returns a safe self-contained paint expression without remote image or font URLs. */
    public paint(paint: DesignPaint, box: DesignBox): string {
        if (paint.kind === DesignPaintKind.Solid) {
            return Geometry.escape(paint.color);
        }
        const id: string = this.identity('paint');
        if (paint.kind === DesignPaintKind.Image && paint.assetId !== null) {
            this.definitions.push(
                `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${box.width}" height="${box.height}">${this.image({ assetId: paint.assetId, ...(paint.framing ?? DesignDefaults.framing()) }, box)}</pattern>`,
            );
        } else {
            const stops: string = paint.stops
                .map((stop): string => `<stop offset="${stop.offset}" stop-color="${stop.color}"/>`)
                .join('');
            const angle: number = (paint.angle * Math.PI) / 180;
            this.definitions.push(
                paint.kind === DesignPaintKind.Radial
                    ? `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" gradientTransform="scale(${box.width} ${box.height})" cx=".5" cy=".5" r=".5">${stops}</radialGradient>`
                    : `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${box.width * (0.5 - Math.cos(angle) / 2)}" y1="${box.height * (0.5 + Math.sin(angle) / 2)}" x2="${box.width * (0.5 + Math.cos(angle) / 2)}" y2="${box.height * (0.5 - Math.sin(angle) / 2)}">${stops}</linearGradient>`,
            );
        }
        return `url(#${id})`;
    }
    /** Preserves the editor's cover, contain, scale and normalized crop transform using intrinsic dimensions. */
    public image(image: DesignImage, box: DesignBox): string {
        const data: DesignSvgImage | undefined = this.images.get(image.assetId);
        if (data === undefined) {
            throw new Error('Missing export image: ' + image.assetId);
        }
        const asset: DesignAsset = data.asset;
        let id: string | undefined = this.#imageIdentities.get(image.assetId);
        if (id === undefined) {
            DesignAssetCodec.asset(asset);
            const expected: number = Number((BigInt(asset.byteLength) + 2n) / 3n) * 4;
            if (
                asset.id !== image.assetId ||
                data.base64.length !== expected ||
                !/^[A-Za-z0-9+/]+={0,2}$/u.test(data.base64)
            ) {
                throw new Error('Invalid embedded export image.');
            }
            id = this.identity('asset');
            this.#imageIdentities.set(image.assetId, id);
            this.definitions.push(
                `<image id="${id}" href="data:${asset.mime};base64,${data.base64}" width="${asset.width}" height="${asset.height}" preserveAspectRatio="none"/>`,
            );
        }
        const { x, y, width, height }: DesignImagePlacement = DesignImageGeometry.place(
            image,
            box,
            asset.width,
            asset.height,
        );
        return `<use href="#${id}" transform="translate(${x} ${y}) scale(${width / asset.width} ${height / asset.height})"/>`;
    }
    /** Every mask has a unique identifier, even when the same image or clip is reused. */
    public identity(prefix: string): string {
        return `${prefix}-${this.#sequence++}`;
    }
    /** Preserves layer blur, outer shadows and inset shadows as local SVG filter primitives. */
    public effects(style: DesignStyle, box: DesignBox): string {
        if (style.blur === 0 && style.shadows.length === 0) {
            return '';
        }
        const id: string = this.identity('effect');
        const bounds: DesignSelectionBounds = DesignSelectionContext.bounds(box);
        const margin: number = Math.max(
            style.blur * 3,
            ...style.shadows.map(
                (shadow): number =>
                    Math.max(Math.abs(shadow.x), Math.abs(shadow.y)) +
                    shadow.blur * 3 +
                    Math.abs(shadow.spread),
            ),
            0,
        );
        const outer: string[] = [];
        const inner: string[] = [];
        const filters: string[] = [];
        for (const [index, shadow] of style.shadows.entries()) {
            const spread: string = `spread-${index}`;
            const blur: string = `blur-${index}`;
            const offset: string = `offset-${index}`;
            const result: string = `shadow-${index}`;
            filters.push(
                `<feMorphology in="SourceAlpha" operator="${shadow.inner ? (shadow.spread < 0 ? 'dilate' : 'erode') : shadow.spread < 0 ? 'erode' : 'dilate'}" radius="${Math.abs(shadow.spread)}" result="${spread}"/><feGaussianBlur in="${spread}" stdDeviation="${shadow.blur / 2}" result="${blur}"/><feOffset in="${blur}" dx="${shadow.x}" dy="${shadow.y}" result="${offset}"/>`,
            );
            if (shadow.inner) {
                filters.push(
                    `<feComposite in="SourceAlpha" in2="${offset}" operator="out" result="inner-${index}"/>`,
                );
            }
            filters.push(
                `<feFlood flood-color="${shadow.color}" result="color-${index}"/><feComposite in="color-${index}" in2="${shadow.inner ? `inner-${index}` : offset}" operator="in" result="${result}"/>`,
            );
            (shadow.inner ? inner : outer).push(result);
        }
        const merged: string = `<feMerge result="merged">${outer.map((name: string): string => `<feMergeNode in="${name}"/>`).join('')}<feMergeNode in="SourceGraphic"/>${inner.map((name: string): string => `<feMergeNode in="${name}"/>`).join('')}</feMerge>`;
        this.definitions.push(
            `<filter id="${id}" filterUnits="userSpaceOnUse" x="${bounds.left - margin}" y="${bounds.top - margin}" width="${bounds.right - bounds.left + margin * 2}" height="${bounds.bottom - bounds.top + margin * 2}" color-interpolation-filters="sRGB">${filters.join('')}${merged}${style.blur > 0 ? `<feGaussianBlur in="merged" stdDeviation="${style.blur / 2}"/>` : ''}</filter>`,
        );
        return ` filter="url(#${id})"`;
    }
}
