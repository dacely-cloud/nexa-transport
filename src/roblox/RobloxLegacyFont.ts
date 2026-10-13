// SPDX-License-Identifier: Apache-2.0
import { RobloxLegacyFontData } from './RobloxLegacyFontData';
import { RobloxTextMeasurement } from './RobloxTextMetrics';

/** Original, unmodified regular face used by the pinned Roblox LegacyArial family. */
export class RobloxLegacyFont {
    /** Canonical Roblox resource identity retained in font measurement receipts. */
    public static readonly uri: string = RobloxTextMeasurement.legacyFontUri;
    /** Browser font family is isolated from the surrounding Chat application. */
    public static readonly browserFamily: string = 'NexaRobloxLegacy';
    /** Digest of the exact shipped bytes, independent of host-installed fonts. */
    public static readonly sha256: string =
        'f770502d7caad307e5b2131d4d763e22ed506ae4eb93775e29667bd0f8d3af1f';
    /** Decodes the bounded original TTF in browsers or Node without file/network APIs. */
    public static bytes(): Uint8Array<ArrayBuffer> {
        const data: string = atob(RobloxLegacyFontData);
        const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(data.length);
        for (let index: number = 0; index < data.length; index += 1) {
            bytes[index] = data.charCodeAt(index);
        }
        return bytes;
    }
}
