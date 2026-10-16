// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignBox } from './DesignTypes.js';
import type { DesignGlyphBounds } from './DesignFontGlyphTypes.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import type { DesignFontPaintClip } from './DesignFontRun.js';

/** Null glyphIndex resumes the underline after this span's glyphs. */
export interface DesignTextWindowCursor {
    readonly lineIndex: number;
    readonly segmentIndex: number;
    readonly glyphIndex: number | null;
}

/** The workspace owns the text, font resolution and geometry; the caller selects a local paint rectangle. */
export interface DesignTextWindowRequest {
    readonly id: string;
    readonly revision: string;
    readonly pageId: string;
    readonly occurrenceId: string;
    readonly window: DesignGlyphBounds;
    readonly cursor: DesignTextWindowCursor | null;
    readonly limit: number;
    readonly paintClipping?: boolean;
}

/** A compact face-local glyph identity replaces repeated source text and vector command payloads. */
export interface DesignTextWindowGlyph {
    readonly id: number;
    readonly x: number;
    readonly y: number;
    readonly clip?: DesignFontPaintClip;
}

/** Each page groups positions by shaped span and preserves rich style and underline geometry. */
export interface DesignTextWindowRun {
    readonly lineIndex: number;
    readonly segmentIndex: number;
    readonly style: DesignTextSpanStyle;
    readonly glyphs: readonly DesignTextWindowGlyph[];
    readonly underline: DesignGlyphBounds | null;
}

/** A window response never includes the source string; continuation keeps the same revision and selectors. */
export interface DesignTextWindowPage {
    readonly id: string;
    readonly revision: string;
    readonly pageId: string;
    readonly occurrenceId: string;
    readonly box: DesignBox;
    readonly window: DesignGlyphBounds;
    readonly runs: readonly DesignTextWindowRun[];
    readonly nextCursor: DesignTextWindowCursor | null;
}

/** Independently advertised support allows clients to retain complete-body rendering on older workspaces. */
export interface DesignTextWindowMethod {
    readonly params: DesignTextWindowRequest;
    readonly result: DesignTextWindowPage;
}
