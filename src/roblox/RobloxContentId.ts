// SPDX-License-Identifier: Apache-2.0

/** Native content identities are converted to IDs, never fetched as arbitrary caller URLs. */
export class RobloxContentId {
    /** Accept canonical IDs and legacy Roblox asset links found in imported mesh models. */
    public static asset(uri: string): string | null {
        if (uri.length > 256) {
            return null;
        }
        const match: RegExpExecArray | null =
            /^(?:rbxassetid:\/\/|https?:\/\/(?:www\.)?roblox\.com\/asset\/?\?id=)([1-9][0-9]{0,18})$/u.exec(
                uri,
            );
        const id: string | undefined = match?.[1];
        return id !== undefined && BigInt(id) <= 9223372036854775807n ? id : null;
    }
}
