// SPDX-License-Identifier: Apache-2.0

import { RobloxFontCatalog, type RobloxFontDefinition } from './RobloxFontCatalog';
import type { RobloxTextMetrics } from './RobloxTextMetrics';

/** Shared original font selection; deprecated enum aliases retain their current Roblox face. */
export class RobloxFonts {
    /** Resolve a supported Enum.Font ordinal without choosing a host font fallback. */
    public static face(value: number = 0): RobloxFontDefinition {
        const face: RobloxFontDefinition | undefined = RobloxFontCatalog[value];
        if (!Number.isInteger(value) || face === undefined || face.value !== value) {
            throw new Error('Unsupported Roblox font value: ' + String(value));
        }
        return face;
    }

    /** Stable CSS family deduplicates equivalent aliases by the original font digest. */
    public static family(value: number = 0): string {
        const digest: string = this.face(value).sha256;
        return digest === this.face(0).sha256
            ? 'NexaRobloxLegacy'
            : 'NexaRobloxFont' + digest.slice(0, 16);
    }

    /** Select the measured face, preserving old single-font scenes only for Legacy. */
    public static metrics(
        value: number,
        legacy: RobloxTextMetrics | undefined,
        faces: Readonly<Record<string, RobloxTextMetrics>> | undefined,
    ): RobloxTextMetrics | undefined {
        this.face(value);
        return faces?.[String(value)] ?? (value === 0 ? legacy : undefined);
    }
}
