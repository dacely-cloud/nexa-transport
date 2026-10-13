// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxValue, RobloxVector2, RobloxUDim2 } from './RobloxSceneTypes';
import { RobloxProperties } from './RobloxSceneRuntime';
import { RobloxDefaultTextures, type RobloxTextureRect } from './RobloxDefaultTextures';
import { RobloxSceneTextures } from './RobloxSceneTextures';

/** Destination local pixels and source atlas pixels for one image patch. */
export interface RobloxGuiImageQuad {
    readonly position: readonly [number, number, number, number];
    readonly source: readonly [number, number, number, number];
}
/** One texture-backed control, shared by native GPU and browser painting. */
export interface RobloxGuiImage {
    readonly width: number;
    readonly height: number;
    readonly color: readonly [number, number, number, number];
    readonly pixelated: boolean;
    readonly quads: readonly RobloxGuiImageQuad[];
}
interface Source {
    readonly atlas: RobloxTextureRect;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/** Resolves original image cropping, five scale modes and bounded tiling without raster resampling. */
export class RobloxGuiImages {
    /** Produces clipped source/destination patches from current native property observations. */
    public static resolve(
        scene: RobloxScene,
        properties: Readonly<Record<string, RobloxValue>>,
        width: number,
        height: number,
    ): RobloxGuiImage | null {
        const uri: RobloxValue | undefined = properties['Image'];
        if (typeof uri !== 'string') {
            throw new Error('Missing GUI Image property');
        }
        if (uri === '' || width <= 0 || height <= 0 || properties['ImageTransparency'] === 1) {
            return null;
        }
        const atlas: RobloxTextureRect | null = RobloxSceneTextures.rect(scene, uri);
        if (atlas === null) {
            throw new Error(
                'Roblox UI image bytes are missing: ' +
                    uri +
                    '. Rebuild with asset resolution enabled.',
            );
        }
        const offset: RobloxVector2 = this.#vector(properties, 'ImageRectOffset');
        const size: RobloxVector2 = this.#vector(properties, 'ImageRectSize');
        const entire: boolean = size.x === 0 || size.y === 0;
        const source: Source = {
            atlas,
            x: entire ? 0 : offset.x,
            y: entire ? 0 : offset.y,
            width: entire ? atlas[2] : size.x,
            height: entire ? atlas[3] : size.y,
        };
        const quads: RobloxGuiImageQuad[] = [];
        const mode: number = RobloxProperties.enum(properties, 'ScaleType');
        if (mode === 1) {
            this.#slice(source, properties, width, height, quads);
        } else if (mode === 2) {
            this.#tile(source, properties, width, height, quads);
        } else {
            const scale: number =
                mode === 3
                    ? Math.min(width / Math.abs(source.width), height / Math.abs(source.height))
                    : mode === 4
                      ? Math.max(width / Math.abs(source.width), height / Math.abs(source.height))
                      : 0;
            const w: number = scale === 0 ? width : Math.abs(source.width) * scale;
            const h: number = scale === 0 ? height : Math.abs(source.height) * scale;
            this.#quad(
                source,
                width,
                height,
                [(width - w) / 2, (height - h) / 2, w, h],
                [source.x, source.y, source.width, source.height],
                quads,
            );
        }
        const color: import('./RobloxSceneTypes').RobloxColor3 = RobloxProperties.color(
            properties,
            'ImageColor3',
        );
        return {
            width: scene.textures?.width ?? RobloxDefaultTextures.size,
            height: scene.textures?.height ?? RobloxDefaultTextures.size,
            color: [
                color.r,
                color.g,
                color.b,
                1 - RobloxProperties.number(properties, 'ImageTransparency'),
            ],
            pixelated: RobloxProperties.enum(properties, 'ResampleMode') === 1,
            quads,
        };
    }

    static #tile(
        source: Source,
        properties: Readonly<Record<string, RobloxValue>>,
        width: number,
        height: number,
        quads: RobloxGuiImageQuad[],
    ): void {
        const tile: RobloxValue | undefined = properties['TileSize'];
        if (typeof tile !== 'object' || tile.kind !== 'UDim2') {
            throw new Error('Invalid TileSize');
        }
        const size: RobloxUDim2 = tile;
        const w: number = size.xScale * width + size.xOffset;
        const h: number = size.yScale * height + size.yOffset;
        if (w <= 0 || h <= 0) {
            return;
        }
        const columns: number = Math.ceil(width / w);
        const rows: number = Math.ceil(height / h);
        if (columns * rows > 1024) {
            throw new Error('GUI image tile budget exceeds 1024 patches');
        }
        for (let row: number = 0; row < rows; row += 1) {
            for (let column: number = 0; column < columns; column += 1) {
                this.#quad(
                    source,
                    width,
                    height,
                    [column * w, row * h, w, h],
                    [source.x, source.y, source.width, source.height],
                    quads,
                );
            }
        }
    }

    static #slice(
        source: Source,
        properties: Readonly<Record<string, RobloxValue>>,
        width: number,
        height: number,
        quads: RobloxGuiImageQuad[],
    ): void {
        const center: RobloxValue | undefined = properties['SliceCenter'];
        if (typeof center !== 'object' || center.kind !== 'Rect') {
            throw new Error('Invalid SliceCenter');
        }
        if (source.width < 0 || source.height < 0) {
            throw new Error('Flipped nine-slice images require Studio calibration');
        }
        const scale: number = RobloxProperties.number(properties, 'SliceScale');
        const x: readonly number[] = [
            0,
            Math.min(center.minX, source.width),
            Math.min(center.maxX, source.width),
            source.width,
        ];
        const y: readonly number[] = [
            0,
            Math.min(center.minY, source.height),
            Math.min(center.maxY, source.height),
            source.height,
        ];
        const dx: readonly number[] = this.#edges(x, width, scale);
        const dy: readonly number[] = this.#edges(y, height, scale);
        for (let row: number = 0; row < 3; row += 1) {
            for (let column: number = 0; column < 3; column += 1) {
                const left: number = x[column] ?? 0;
                const top: number = y[row] ?? 0;
                const px: number = dx[column] ?? 0;
                const py: number = dy[row] ?? 0;
                this.#quad(
                    source,
                    width,
                    height,
                    [px, py, (dx[column + 1] ?? 0) - px, (dy[row + 1] ?? 0) - py],
                    [
                        source.x + left,
                        source.y + top,
                        (x[column + 1] ?? 0) - left,
                        (y[row + 1] ?? 0) - top,
                    ],
                    quads,
                );
            }
        }
    }

    static #edges(bounds: readonly number[], size: number, scale: number): readonly number[] {
        const first: number = (bounds[1] ?? 0) * scale;
        const last: number = ((bounds[3] ?? 0) - (bounds[2] ?? 0)) * scale;
        const factor: number = first + last === 0 ? 1 : Math.min(1, size / (first + last));
        return [0, first * factor, size - last * factor, size];
    }

    static #quad(
        source: Source,
        width: number,
        height: number,
        destination: readonly [number, number, number, number],
        crop: readonly [number, number, number, number],
        result: RobloxGuiImageQuad[],
    ): void {
        const [x, y, w, h]: readonly [number, number, number, number] = destination;
        const [sx, sy, sw, sh]: readonly [number, number, number, number] = crop;
        if (w <= 0 || h <= 0 || sw === 0 || sh === 0) {
            return;
        }
        const left: number = Math.max(0, -x / w, Math.min(-sx / sw, (source.atlas[2] - sx) / sw));
        const right: number = Math.min(
            1,
            (width - x) / w,
            Math.max(-sx / sw, (source.atlas[2] - sx) / sw),
        );
        const top: number = Math.max(0, -y / h, Math.min(-sy / sh, (source.atlas[3] - sy) / sh));
        const bottom: number = Math.min(
            1,
            (height - y) / h,
            Math.max(-sy / sh, (source.atlas[3] - sy) / sh),
        );
        if (left >= right || top >= bottom) {
            return;
        }
        result.push({
            position: [x + left * w, y + top * h, (right - left) * w, (bottom - top) * h],
            source: [
                source.atlas[0] + sx + left * sw,
                source.atlas[1] + sy + top * sh,
                (right - left) * sw,
                (bottom - top) * sh,
            ],
        });
    }

    static #vector(properties: Readonly<Record<string, RobloxValue>>, key: string): RobloxVector2 {
        const value: RobloxValue | undefined = properties[key];
        if (typeof value !== 'object' || value.kind !== 'Vector2') {
            throw new Error('Invalid image vector: ' + key);
        }
        return value;
    }
}
