// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgShapeContext } from './DesignSvgImportShape.js';
import { DesignSvgImageAssets } from './DesignSvgImageAssets.js';
import type { DesignAsset } from './DesignAssetTypes.js';
import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignSvgImportAppearance as Appearance } from './DesignSvgImportAppearance.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import {
    DesignSvgTransforms as T,
    type DesignSvgPoint,
    type DesignSvgViewport,
} from './DesignSvgTransforms.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignSvgAffineImage } from './DesignSvgAffineImage.js';
import { DesignSvgImageSampling } from './DesignSvgImageSampling.js';
import type { DesignImageSampling } from './DesignImageSamplingTypes.js';
import {
    DesignKind,
    DesignImageFit,
    type DesignNode,
    type DesignPathCommand,
} from './DesignTypes.js';

/** The image viewport remains editable independently of its aspect-fitted raster content. */
export class DesignSvgImportImage {
    /** Host image admission remains separate from the portable layer converter. */
    public constructor(
        public readonly tree: DesignSvgImportTree,
        public readonly identify: (key: string) => string,
        public readonly assets: DesignSvgImageAssets,
    ) {}

    /** Positioning rectangles supply object bounds even when meet leaves unpainted margins. */
    public async build(
        element: DesignSvgElement,
        context: DesignSvgShapeContext,
    ): Promise<string | null> {
        const style: Readonly<Record<string, string>> = context.style;
        Appearance.validate(style, false, true);
        const overflow: string = style['overflow'] ?? 'hidden';
        if (!['hidden', 'visible', 'clip'].includes(overflow)) {
            throw new DesignSvgInputError('Unsupported SVG image overflow.');
        }
        for (const child of element.children) {
            if (typeof child !== 'string' && !['title', 'desc', 'metadata'].includes(child.name)) {
                throw new DesignSvgInputError('Unsupported content inside SVG image.');
            }
        }
        const rawWidth: string = style['width'] ?? element.attributes['width'] ?? 'auto';
        const rawHeight: string = style['height'] ?? element.attributes['height'] ?? 'auto';
        let width: number | null =
            rawWidth === 'auto' ? null : DesignSvgNumbers.length(rawWidth, context.width);
        let height: number | null =
            rawHeight === 'auto' ? null : DesignSvgNumbers.length(rawHeight, context.height);
        if (width === 0 || height === 0) {
            return null;
        }
        if ((width !== null && width < 0) || (height !== null && height < 0)) {
            throw new DesignSvgInputError('SVG image dimensions must be nonnegative.');
        }
        const sx: number = Math.hypot(context.matrix.a, context.matrix.b);
        const sy: number = Math.hypot(context.matrix.c, context.matrix.d);
        const determinant: number =
            context.matrix.a * context.matrix.d - context.matrix.b * context.matrix.c;
        if (sx < 1e-10 || sy < 1e-10 || Math.abs(determinant) <= 1e-8 * sx * sy) {
            throw new DesignSvgInputError(
                'SVG image transform must have independent nonzero axes.',
            );
        }
        const reference: string =
            element.attributes['href'] ?? element.attributes['xlink:href'] ?? '';
        const asset: DesignAsset = await this.assets.admit(reference, context.name);
        if (width === null && height === null) {
            width = asset.width;
            height = asset.height;
        } else if (width === null) {
            width = ((height ?? asset.height) * asset.width) / asset.height;
        } else if (height === null) {
            height = (width * asset.height) / asset.width;
        }
        if (width === null || height === null) {
            throw new Error('Missing SVG image dimensions.');
        }
        const x: number = DesignSvgNumbers.length(
            style['x'] ?? element.attributes['x'] ?? '0',
            context.width,
        );
        const y: number = DesignSvgNumbers.length(
            style['y'] ?? element.attributes['y'] ?? '0',
            context.height,
        );
        const aspect: string = (
            element.attributes['preserveAspectRatio'] ?? 'xMidYMid meet'
        ).replace(/^defer\s+/u, '');
        const viewport: DesignSvgViewport = T.viewport(
            width,
            height,
            `0 0 ${asset.width} ${asset.height}`,
            aspect,
        );
        if (
            determinant < 0 ||
            Math.abs(context.matrix.a * context.matrix.c + context.matrix.b * context.matrix.d) >
                1e-8 * sx * sy
        ) {
            return DesignSvgAffineImage.append(
                this.tree,
                this.identify,
                context,
                asset,
                viewport,
                x,
                y,
                width,
                height,
                overflow !== 'visible',
            );
        }
        const center: DesignSvgPoint = T.point(context.matrix, x + width / 2, y + height / 2);
        const sampling: DesignImageSampling | null =
            overflow === 'visible'
                ? null
                : DesignSvgImageSampling.from(viewport, width, height, asset);
        const contentId: string = this.identify('image-content:' + context.id);
        const frame: DesignNode = DesignDefaults.node(context.id, DesignKind.Frame, context.name);
        const image: DesignNode = DesignDefaults.node(
            contentId,
            DesignKind.Image,
            context.name + ' image',
        );
        this.tree.append({
            ...frame,
            parentId: context.parentId,
            children: [contentId],
            x: center.x - (width * sx) / 2,
            y: center.y - (height * sy) / 2,
            width: width * sx,
            height: height * sy,
            rotation: (Math.atan2(context.matrix.b, context.matrix.a) * 180) / Math.PI,
            opacity: Appearance.opacity(style['opacity']),
            visible:
                style['display'] !== 'none' &&
                !['hidden', 'collapse'].includes(style['visibility'] ?? 'visible'),
            style: { ...frame.style, fills: [] },
            layout: { ...frame.layout, clip: overflow !== 'visible' },
        });
        this.tree.append({
            ...image,
            parentId: context.id,
            x: viewport.matrix.e * sx,
            y: viewport.matrix.f * sy,
            width: asset.width * viewport.matrix.a * sx,
            height: asset.height * viewport.matrix.d * sy,
            style: { ...image.style, fills: [] },
            image: {
                assetId: asset.id,
                fit: DesignImageFit.Stretch,
                cropX: 0,
                cropY: 0,
                scale: 1,
                ...(sampling === null ? {} : { sampling }),
            },
        });
        const corners: readonly DesignSvgPoint[] = [
            T.point(context.matrix, x, y),
            T.point(context.matrix, x + width, y),
            T.point(context.matrix, x + width, y + height),
            T.point(context.matrix, x, y + height),
        ];
        const commands: DesignPathCommand[] = corners.map(
            (point: DesignSvgPoint, index: number): DesignPathCommand => ({
                verb: index === 0 ? 'M' : 'L',
                values: [point.x, point.y],
            }),
        );
        commands.push({ verb: 'Z', values: [] });
        this.tree.recordGeometry(context.id, DesignPaths.normalize(commands));
        return context.id;
    }
}
