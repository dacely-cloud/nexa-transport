// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignTextSpanStyle } from './DesignTextLayout.js';

/** Glyph geometry is expressed in text-local design pixels. */
export interface DesignGlyphBounds {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/** A positioned glyph retains its shaping-run index without carrying the source string. */
export interface DesignFontGlyph {
    /** A fallback glyph names its physical face while primary-face glyphs retain their original shape. */
    readonly style?: DesignTextSpanStyle;
    readonly index: number;
    readonly bounds: DesignGlyphBounds;
    readonly glyphId: number;
    readonly x: number;
    readonly y: number;
}
