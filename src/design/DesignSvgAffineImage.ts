// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignPaths, type DesignPathGeometry } from './DesignPaths.js';
import {
    DesignKind,
    DesignImageFit,
    type DesignNode,
    type DesignPathCommand,
} from './DesignTypes.js';
import { DesignMaskMode } from './DesignMaskTypes.js';
import type { DesignAsset } from './DesignAssetTypes.js';
import type { DesignSvgShapeContext } from './DesignSvgImportShape.js';
import type { DesignSvgImportTree } from './DesignSvgImportTree.js';
import {
    DesignSvgTransforms as T,
    type DesignSvgMatrix,
    type DesignSvgPoint,
    type DesignSvgViewport,
} from './DesignSvgTransforms.js';
import { DesignSvgImportAppearance as Appearance } from './DesignSvgImportAppearance.js';
import { DesignSvgImageSampling } from './DesignSvgImageSampling.js';
import type { DesignImageSampling } from './DesignImageSamplingTypes.js';

interface ImageBounds {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/** General affine images retain original bytes, editable placement and an editable viewport silhouette. */
export class DesignSvgAffineImage {
    /** Content and viewport bounds differ when aspect fitting leaves margins or paints visible overflow. */
    public static append(
        tree: DesignSvgImportTree,
        identify: (key: string) => string,
        context: DesignSvgShapeContext,
        asset: DesignAsset,
        viewport: DesignSvgViewport,
        x: number,
        y: number,
        width: number,
        height: number,
        clipped: boolean,
    ): string {
        const corners: readonly DesignSvgPoint[] = this.#corners(
            context.matrix,
            x,
            y,
            width,
            height,
        );
        const bounds: ImageBounds = this.#bounds(corners);
        const imageMap: DesignSvgMatrix = T.multiply(
            context.matrix,
            T.multiply({ ...T.identity, e: x, f: y }, viewport.matrix),
        );
        const content: ImageBounds = this.#bounds(
            this.#corners(imageMap, 0, 0, asset.width, asset.height),
        );
        const contentId: string = identify('image-content:' + context.id);
        const maskId: string = identify('image-viewport-mask:' + context.id);
        const sourceId: string = identify('image-viewport-source:' + context.id);
        const frame: DesignNode = DesignDefaults.node(context.id, DesignKind.Frame, context.name);
        tree.append({
            ...frame,
            parentId: context.parentId,
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            children: [clipped ? maskId : contentId],
            opacity: Appearance.opacity(context.style['opacity']),
            visible:
                context.style['display'] !== 'none' &&
                !['hidden', 'collapse'].includes(context.style['visibility'] ?? 'visible'),
            style: { ...frame.style, fills: [] },
            layout: { ...frame.layout, clip: false },
        });
        const commands: DesignPathCommand[] = corners.map(
            (point: DesignSvgPoint, index: number): DesignPathCommand => ({
                verb: index === 0 ? 'M' : 'L',
                values: [point.x, point.y],
            }),
        );
        commands.push({ verb: 'Z', values: [] });
        const geometry: DesignPathGeometry = DesignPaths.normalize(commands);
        tree.recordGeometry(context.id, geometry);
        if (clipped) {
            const mask: DesignNode = DesignDefaults.node(
                maskId,
                DesignKind.Mask,
                context.name + ' viewport',
            );
            tree.append({
                ...mask,
                parentId: context.id,
                width: bounds.width,
                height: bounds.height,
                children: [sourceId, contentId],
                mask: { mode: DesignMaskMode.Vector, sourceId },
            });
            const source: DesignNode = DesignDefaults.node(
                sourceId,
                DesignKind.Path,
                context.name + ' viewport outline',
            );
            tree.append({
                ...source,
                parentId: maskId,
                x: geometry.x - bounds.x,
                y: geometry.y - bounds.y,
                width: geometry.width,
                height: geometry.height,
                path: geometry.path,
                style: { ...source.style, fills: [DesignDefaults.paint('#FFFFFF')], stroke: null },
            });
        }
        const image: DesignNode = DesignDefaults.node(
            contentId,
            DesignKind.Image,
            context.name + ' image',
        );
        const sampling: DesignImageSampling | null = clipped
            ? DesignSvgImageSampling.from(viewport, width, height, asset)
            : null;
        tree.append({
            ...image,
            parentId: clipped ? maskId : context.id,
            x: content.x - bounds.x,
            y: content.y - bounds.y,
            width: content.width,
            height: content.height,
            style: { ...image.style, fills: [] },
            image: {
                assetId: asset.id,
                fit: DesignImageFit.Stretch,
                cropX: 0,
                cropY: 0,
                scale: 1,
                ...(sampling === null ? {} : { sampling }),
                transform: {
                    a: (imageMap.a * asset.width) / content.width,
                    b: (imageMap.b * asset.width) / content.height,
                    c: (imageMap.c * asset.height) / content.width,
                    d: (imageMap.d * asset.height) / content.height,
                    tx: (imageMap.e - content.x) / content.width,
                    ty: (imageMap.f - content.y) / content.height,
                },
            },
        });
        return context.id;
    }
    static #corners(
        matrix: DesignSvgMatrix,
        x: number,
        y: number,
        width: number,
        height: number,
    ): readonly DesignSvgPoint[] {
        return [
            T.point(matrix, x, y),
            T.point(matrix, x + width, y),
            T.point(matrix, x + width, y + height),
            T.point(matrix, x, y + height),
        ];
    }
    static #bounds(points: readonly DesignSvgPoint[]): ImageBounds {
        const x: number = Math.min(...points.map((point: DesignSvgPoint): number => point.x));
        const y: number = Math.min(...points.map((point: DesignSvgPoint): number => point.y));
        return {
            x,
            y,
            width: Math.max(...points.map((point: DesignSvgPoint): number => point.x)) - x,
            height: Math.max(...points.map((point: DesignSvgPoint): number => point.y)) - y,
        };
    }
}
