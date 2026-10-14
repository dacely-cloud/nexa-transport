// SPDX-License-Identifier: Apache-2.0

import { RobloxProperties } from './RobloxSceneRuntime';
import { RobloxSceneTextures } from './RobloxSceneTextures';
import type { RobloxScene, RobloxValue } from './RobloxSceneTypes';
import type { RobloxGuiSize } from './RobloxGuiBoxLayout';
import type { RobloxGuiScrollGeometry } from './RobloxGuiScroll';
import type { RobloxGuiImage, RobloxGuiImageQuad } from './RobloxGuiImages';
import { RobloxDefaultTextures, type RobloxTextureRect } from './RobloxDefaultTextures';

interface Segments {
    readonly top: RobloxTextureRect | null;
    readonly middle: RobloxTextureRect | null;
    readonly bottom: RobloxTextureRect | null;
}
interface Bar {
    readonly horizontal: boolean;
    readonly x: number;
    readonly y: number;
    readonly track: number;
    readonly window: number;
    readonly canvas: number;
    readonly position: number;
    readonly thickness: number;
}

/** Original scrollbar image segments share one atlas and belong to the actual ScrollingFrame. */
export class RobloxGuiScrollbars {
    /** Resolves visible vertical and horizontal thumb patches without introducing instances. */
    public static resolve(
        scene: RobloxScene,
        properties: Readonly<Record<string, RobloxValue>>,
        size: RobloxGuiSize,
        scroll: RobloxGuiScrollGeometry,
    ): RobloxGuiImage | null {
        const thickness: number = RobloxProperties.number(properties, 'ScrollBarThickness');
        const transparency: number = RobloxProperties.number(
            properties,
            'ScrollBarImageTransparency',
        );
        if (thickness <= 0 || transparency === 1 || properties['ScrollingEnabled'] !== true) {
            return null;
        }
        const vertical: boolean = scroll.window.width < size.width;
        const horizontal: boolean = scroll.window.height < size.height;
        if (!vertical && !horizontal) {
            return null;
        }
        const segments: Segments = {
            top: this.#texture(scene, properties, 'TopImage'),
            middle: this.#texture(scene, properties, 'MidImage'),
            bottom: this.#texture(scene, properties, 'BottomImage'),
        };
        const left: boolean = RobloxProperties.enum(properties, 'VerticalScrollBarPosition') === 1;
        const quads: RobloxGuiImageQuad[] = [];
        if (vertical) {
            this.#bar(
                {
                    horizontal: false,
                    x: left ? 0 : Math.max(0, size.width - thickness),
                    y: 0,
                    track: scroll.window.height,
                    window: scroll.window.height,
                    canvas: scroll.canvas.height,
                    position: scroll.y,
                    thickness: Math.min(thickness, size.width),
                },
                segments,
                quads,
            );
        }
        if (horizontal) {
            this.#bar(
                {
                    horizontal: true,
                    x: left && vertical ? Math.min(thickness, size.width) : 0,
                    y: Math.max(0, size.height - thickness),
                    track: scroll.window.width,
                    window: scroll.window.width,
                    canvas: scroll.canvas.width,
                    position: scroll.x,
                    thickness: Math.min(thickness, size.height),
                },
                segments,
                quads,
            );
        }
        if (quads.length === 0) {
            return null;
        }
        const color: import('./RobloxSceneTypes').RobloxColor3 = RobloxProperties.color(
            properties,
            'ScrollBarImageColor3',
        );
        return {
            width: scene.textures?.width ?? RobloxDefaultTextures.size,
            height: scene.textures?.height ?? RobloxDefaultTextures.size,
            color: [color.r, color.g, color.b, 1 - transparency],
            pixelated: false,
            quads,
        };
    }
    static #texture(
        scene: RobloxScene,
        properties: Readonly<Record<string, RobloxValue>>,
        key: string,
    ): RobloxTextureRect | null {
        const uri: RobloxValue | undefined = properties[key];
        if (typeof uri !== 'string') {
            throw new Error('Missing scrollbar image property ' + key);
        }
        if (uri === '') {
            return null;
        }
        const rect: RobloxTextureRect | null = RobloxSceneTextures.rect(scene, uri);
        if (rect === null) {
            throw new Error(
                'Scrollbar image bytes are missing: ' +
                    uri +
                    '. Rebuild with asset resolution enabled.',
            );
        }
        return rect;
    }
    static #bar(bar: Bar, segments: Segments, result: RobloxGuiImageQuad[]): void {
        if (bar.track <= 0 || bar.canvas <= 0 || bar.thickness <= 0) {
            return;
        }
        const top: number =
            segments.top === null ? 0 : (segments.top[3] * bar.thickness) / segments.top[2];
        const bottom: number =
            segments.bottom === null
                ? 0
                : (segments.bottom[3] * bar.thickness) / segments.bottom[2];
        const length: number = Math.min(
            bar.track,
            Math.max(top + bottom, (bar.track * bar.window) / bar.canvas),
        );
        const scale: number = top + bottom > length ? length / (top + bottom) : 1;
        const start: number =
            bar.canvas <= bar.window
                ? 0
                : ((bar.track - length) * bar.position) / (bar.canvas - bar.window);
        this.#quad(bar, segments.top, start, top * scale, result);
        this.#quad(
            bar,
            segments.middle,
            start + top * scale,
            Math.max(0, length - (top + bottom) * scale),
            result,
        );
        this.#quad(bar, segments.bottom, start + length - bottom * scale, bottom * scale, result);
    }
    static #quad(
        bar: Bar,
        source: RobloxTextureRect | null,
        start: number,
        length: number,
        result: RobloxGuiImageQuad[],
    ): void {
        if (source === null || length <= 0) {
            return;
        }
        result.push({
            ...(bar.horizontal ? { counterClockwise: true as const } : {}),
            position: bar.horizontal
                ? [bar.x + start, bar.y, length, bar.thickness]
                : [bar.x, bar.y + start, bar.thickness, length],
            source,
        });
    }
}
