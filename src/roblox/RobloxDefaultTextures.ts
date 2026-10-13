// SPDX-License-Identifier: Apache-2.0

import {
    RobloxDefaultTextureImage,
    RobloxDefaultTextureRectangles,
} from './RobloxDefaultTextureData';

/** Pixel bounds of one original Roblox particle resource in the shared atlas. */
export type RobloxTextureRect = readonly [number, number, number, number];

/** Identical Roblox-supplied texels and resource identities for browser and native GPU rendering. */
export class RobloxDefaultTextures {
    /** One reusable, bounded atlas; the native renderer embeds the same PNG. */
    public static readonly image: string = RobloxDefaultTextureImage;
    /** Atlas dimensions in texels. */
    public static readonly size: number = 1024;
    /** Resolves a built-in resource URI without a network fetch or a procedural substitute. */
    public static rect(uri: string): RobloxTextureRect | null {
        const key: string = uri.toLowerCase();
        return Object.hasOwn(RobloxDefaultTextureRectangles, key)
            ? (RobloxDefaultTextureRectangles[key] ?? null)
            : null;
    }
}
