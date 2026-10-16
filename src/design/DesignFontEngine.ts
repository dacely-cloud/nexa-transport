// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { Font } from 'fontkit';
import { DesignHarfBuzzRuntime } from './DesignHarfBuzzRuntime.js';
import type { DesignShapedGlyph } from './DesignHarfBuzz.js';
import { DesignFontRegistry } from './DesignFontRegistry.js';
import { DesignFontShaper, type DesignShapedFace } from './DesignFontShaper.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import type { DesignFontBinding } from './DesignFontTypes.js';
import type { DesignPathCommand } from './DesignTypes.js';
import { DesignFontRun, type DesignFontRunStyle } from './DesignFontRun.js';
import { DesignFontPlacement } from './DesignFontPlacement.js';
import { DesignFontGlyphGeometry } from './DesignFontGlyphGeometry.js';
import type { DesignFontGlyph, DesignGlyphBounds } from './DesignFontGlyphTypes.js';

/** A caller supplies authorized font bytes, never a process-global filesystem path. */
export interface DesignFontSource {
    /** Only deliberate public or authorized fallback sources participate in missing-grapheme resolution. */
    readonly fallback?: boolean;
    readonly binding?: DesignFontBinding;
    readonly family: string;
    readonly italic: boolean;
    readonly weight: number;
    readonly bytes: Uint8Array;
}
/** The actual face range supplies the same weight contract to shaping and browser registration. */
export interface DesignFontWeightRange {
    readonly minimum: number;
    readonly maximum: number;
}
/** Exact vertical font-cell dimensions in the requested style's design pixels. */
export interface DesignFontMetrics {
    readonly ascent: number;
    readonly descent: number;
}
/** Real font shaping and editable outlines share the same bounded browser-compatible engine. */
export class DesignFontEngine {
    #registry: DesignFontRegistry = new DesignFontRegistry();

    /** Admits standalone sfnt/WOFF fonts with bounded decompression before invoking the parser. */
    public add(source: DesignFontSource): void {
        this.#registry.add(source);
    }

    /** Compressed WOFF2 faces are prepared once before synchronous measurement or outline rendering. */
    public async prepare(): Promise<void> {
        await DesignHarfBuzzRuntime.prepare();
        await this.#registry.prepare();
    }

    /** Private faces extend a fresh engine without modifying the public bundled-font cache. */
    public with(sources: readonly DesignFontSource[]): DesignFontEngine {
        const result: DesignFontEngine = new DesignFontEngine();
        result.#registry = this.#registry.with(sources);
        return result;
    }

    /** Reports the validated static weight or variable wght range for one exact style binding. */
    public weightRange(style: DesignTextSpanStyle): DesignFontWeightRange {
        return this.#registry.weightRange(style);
    }

    /** Measures complete shaped strings including kerning and ligatures; layout applies tracking. */
    public measure(style: DesignTextSpanStyle, content: string): number {
        return DesignFontShaper.spans(this.#registry, style, content, 0).reduce(
            (width: number, span: DesignShapedFace): number =>
                width +
                (span.glyphs.reduce(
                    (advance: number, glyph: DesignShapedGlyph): number =>
                        advance + glyph.position.xAdvance,
                    0,
                ) *
                    style.size) /
                    span.face.unitsPerEm,
            0,
        );
    }

    /** Retains one complete shaping result for paint-only slices without breaking joins or ligatures. */
    public run(style: DesignFontRunStyle, content: string, tracking: number = 0): DesignFontRun {
        if (!Number.isFinite(tracking)) {
            throw new Error('Text tracking must be finite.');
        }
        if (style.direction !== 'ltr' && style.direction !== 'rtl') {
            throw new Error(
                'Prepare one resolved text direction, ltr or rtl, before shaping a run.',
            );
        }
        const prepared: DesignFontRunStyle = Object.freeze({
            ...style,
            ...(style.font == null ? {} : { font: Object.freeze({ ...style.font }) }),
        });
        return new DesignFontRun(
            prepared,
            content,
            tracking,
            DesignFontShaper.spans(this.#registry, prepared, content, tracking, true),
        );
    }

    /** SVG text object bounds include the full font cell rather than only visible glyph ink. */
    public metrics(style: DesignTextSpanStyle): DesignFontMetrics {
        const face: Font = this.#registry.resolve(style).face;
        const ascent: number = (face.ascent * style.size) / face.unitsPerEm;
        const descent: number = (-face.descent * style.size) / face.unitsPerEm;
        if (![ascent, descent].every(Number.isFinite) || ascent < 0 || descent < 0) {
            throw new Error('Font returned invalid vertical cell metrics.');
        }
        return { ascent, descent };
    }

    /** Declared x-height, measured lowercase x, then half-em synthesis for missing font metrics. */
    public xHeight(style: DesignTextSpanStyle): number {
        const face: Font = this.#registry.resolve(style).face;
        const declared: number | undefined = face.xHeight;
        if (declared !== undefined && (!Number.isFinite(declared) || declared < 0)) {
            throw new Error('Font returned invalid x-height.');
        }
        const measured: number =
            declared !== undefined && declared > 0
                ? declared
                : face.hasGlyphForCodePoint(0x78)
                  ? face.glyphForCodePoint(0x78).bbox.maxY
                  : 0;
        if (!Number.isFinite(measured)) {
            throw new Error('Font returned invalid x-height glyph bounds.');
        }
        return ((measured > 0 ? measured : face.unitsPerEm / 2) * style.size) / face.unitsPerEm;
    }

    /** Converts positioned glyph curves to the editor's M/L/Q/C/Z path records. */
    public outline(
        style: DesignTextSpanStyle,
        content: string,
        x: number,
        baseline: number,
        tracking: number,
    ): readonly DesignPathCommand[] {
        const output: DesignPathCommand[] = [];
        for (const glyph of this.glyphs(style, content, x, baseline, tracking)) {
            const commands: readonly DesignPathCommand[] = this.glyphPath(
                glyph.style ?? style,
                glyph.glyphId,
                glyph.x,
                glyph.y,
            );
            if (output.length + commands.length > 10000) {
                throw new Error(
                    'Outlined span exceeds 10000 vector commands. Split the text into smaller layers.',
                );
            }
            output.push(...commands);
        }
        return output;
    }

    /** Shapes complete spans, rejecting off-window glyphs before allocating their positioned curve records. */
    public *glyphs(
        style: DesignTextSpanStyle,
        content: string,
        x: number,
        baseline: number,
        tracking: number,
        window: DesignGlyphBounds | null = null,
    ): IterableIterator<DesignFontGlyph> {
        yield* DesignFontPlacement.glyphs(
            DesignFontShaper.spans(this.#registry, style, content, tracking),
            style,
            x,
            baseline,
            tracking,
            window,
        );
    }

    /** Resolves a streamed glyph identity against the exact registered face and requested variation. */
    public glyphPath(
        style: DesignTextSpanStyle,
        glyphId: number,
        x: number,
        y: number,
    ): readonly DesignPathCommand[] {
        const face: Font = this.#registry.resolve(style).face;
        if (
            !Number.isSafeInteger(glyphId) ||
            glyphId < 0 ||
            glyphId >= face.numGlyphs ||
            ![x, y].every(Number.isFinite)
        ) {
            throw new Error('Invalid positioned glyph identity.');
        }
        return DesignFontGlyphGeometry.commands(
            face.getGlyph(glyphId),
            x,
            y,
            style.size / face.unitsPerEm,
        );
    }

    /** Allows layout to estimate unrelated font families while outline conversion still requires a matching face. */
    public supports(style: DesignTextSpanStyle): boolean {
        return this.#registry.supports(style);
    }
}
