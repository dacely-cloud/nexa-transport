// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Tokenization treats Unicode paragraph controls as line breaks without changing authored UTF-16 offsets. */
export class DesignTextBreaks {
    /** Replacements are exactly one code unit; original source slices and rich-style positions remain authoritative. */
    public static paragraphs(content: string): string {
        return content.replace(/\p{Cc}/gu, (character: string): string => {
            const point: number = character.charCodeAt(0);
            return point >= 0x1c && point <= 0x1e ? '\n' : character;
        });
    }
}
