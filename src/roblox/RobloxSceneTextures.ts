// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import { RobloxDefaultTextures, type RobloxTextureRect } from './RobloxDefaultTextures';
import type { RobloxScene } from './RobloxSceneTypes';
import { RobloxContentId } from './RobloxContentId';

/** Downloaded sprites share an immutable PNG atlas with the original built-in sprites. */
export interface RobloxSceneTextureAtlas {
    readonly image: string;
    readonly width: number;
    readonly height: number;
    readonly rectangles: Readonly<Record<string, RobloxTextureRect>>;
}

/** Portable validation and lookup for bounded image data; no browser or API fetch is performed. */
export class RobloxSceneTextures {
    /** Accepts local Roblox image paths without traversal, URL queries or encoded separators. */
    public static resourceUri(uri: string): boolean {
        return (
            uri.length <= 512 &&
            /^rbxasset:\/\/(?:textures|sky)\/(?:[A-Za-z0-9_@-]+\/)*[A-Za-z0-9_@.-]+\.(?:png|jpg|jpeg|dds|webp)$/iu.test(
                uri,
            ) &&
            !uri.includes('..')
        );
    }

    /** The portable scene carries asset identities rather than arbitrary network URLs. */
    public static assetUri(uri: string): boolean {
        return RobloxContentId.asset(uri) !== null || this.resourceUri(uri);
    }
    /** Rejects arbitrary URLs, oversized decoded surfaces and invalid sprite bounds. */
    public static decode(raw: unknown): RobloxSceneTextureAtlas | undefined {
        if (raw === undefined) {
            return undefined;
        }
        const data: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
            'image',
            'width',
            'height',
            'rectangles',
        ]);
        const width: number = RobloxSceneCodec.number(data['width'], 2048, 4096, true);
        const height: number = RobloxSceneCodec.number(data['height'], 2048, 4096, true);
        if (width !== height || (width !== 2048 && width !== 4096)) {
            throw new Error('Invalid texture atlas dimensions');
        }
        const image: string = RobloxSceneCodec.text(data['image'], 2800000);
        if (!image.startsWith('data:image/png;base64,')) {
            throw new Error('Texture atlas must contain PNG bytes');
        }
        const base64: string = image.slice(22);
        if (base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(base64)) {
            throw new Error('Invalid texture atlas encoding');
        }
        let binary: string;
        try {
            binary = atob(base64);
        } catch {
            throw new Error('Invalid texture atlas encoding');
        }
        if (binary.length < 33 || binary.length > 2 * 1024 * 1024) {
            throw new Error('Texture atlas exceeds PNG byte budget');
        }
        const header: Uint8Array<ArrayBuffer> = Uint8Array.from(
            binary.slice(0, 33),
            (c: string): number => c.charCodeAt(0),
        );
        const view: DataView<ArrayBuffer> = new DataView(header.buffer);
        if (
            header
                .slice(0, 8)
                .some(
                    (b: number, i: number): boolean => b !== [137, 80, 78, 71, 13, 10, 26, 10][i],
                ) ||
            view.getUint32(8) !== 13 ||
            binary.slice(12, 16) !== 'IHDR' ||
            view.getUint32(16) !== width ||
            view.getUint32(20) !== height ||
            header[24] !== 8 ||
            header[25] !== 6
        ) {
            throw new Error('PNG texture dimensions or channels do not match the atlas');
        }
        const rawMap: unknown = data['rectangles'];
        if (rawMap === null || typeof rawMap !== 'object' || Array.isArray(rawMap)) {
            throw new Error('Invalid texture atlas rectangle map');
        }
        const rawRectangles: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
            data['rectangles'],
            [],
            Object.getOwnPropertyNames(rawMap),
        );
        const keys: readonly string[] = Object.keys(rawRectangles);
        if (keys.length === 0 || keys.length > 16) {
            throw new Error('Texture atlas supports 1..16 asset images');
        }
        const rectangles: Record<string, RobloxTextureRect> = {};
        for (const uri of keys) {
            if (!this.assetUri(uri)) {
                throw new Error('Invalid texture atlas asset URI');
            }
            const values: readonly unknown[] = RobloxSceneCodec.array(rawRectangles[uri], 4);
            if (values.length !== 4) {
                throw new Error('Invalid texture atlas rectangle');
            }
            const x: number = RobloxSceneCodec.number(values[0], 2, width - 3, true);
            const y: number = RobloxSceneCodec.number(values[1], 2, height - 3, true);
            const w: number = RobloxSceneCodec.number(values[2], 1, width - 4, true);
            const h: number = RobloxSceneCodec.number(values[3], 1, height - 4, true);
            if (x + w + 2 > width || y + h + 2 > height || (x < 1026 && y < 1026)) {
                throw new Error('Texture rectangle overlaps the built-in atlas or its bounds');
            }
            for (const other of Object.values(rectangles)) {
                if (
                    x - 2 < other[0] + other[2] + 2 &&
                    x + w + 2 > other[0] - 2 &&
                    y - 2 < other[1] + other[3] + 2 &&
                    y + h + 2 > other[1] - 2
                ) {
                    throw new Error('Overlapping texture atlas rectangles');
                }
            }
            rectangles[uri] = Object.freeze([x, y, w, h]);
        }
        return Object.freeze({ image, width, height, rectangles: Object.freeze(rectangles) });
    }

    /** Looks up custom assets first; built-in coordinates remain in the atlas's top-left block. */
    public static rect(scene: RobloxScene, uri: string): RobloxTextureRect | null {
        const atlas: RobloxSceneTextureAtlas | undefined = scene.textures;
        return atlas !== undefined && Object.hasOwn(atlas.rectangles, uri)
            ? (atlas.rectangles[uri] ?? null)
            : RobloxDefaultTextures.rect(uri);
    }
}
