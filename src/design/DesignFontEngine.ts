// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { Font, GlyphRun, Glyph, GlyphPosition } from 'fontkit';
import { DesignFontRegistry } from './DesignFontRegistry.js';
import { DesignFontShaper, type DesignShapedFace } from './DesignFontShaper.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import type { DesignFontBinding } from './DesignFontTypes.js';
import type { DesignPathCommand } from './DesignTypes.js';
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
                (span.run.positions.reduce(
                    (advance: number, position: GlyphPosition): number =>
                        advance + position.xAdvance,
                    0,
                ) *
                    style.size) /
                    span.face.unitsPerEm,
            0,
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
        let penX: number = x;
        let penY: number = baseline;
        let runOffset: number = 0;
        for (const span of DesignFontShaper.spans(this.#registry, style, content, tracking)) {
            const run: GlyphRun = span.run;
            const scale: number = style.size / span.face.unitsPerEm;
            for (let index: number = 0; index < run.glyphs.length; index++) {
                const glyph: Glyph | undefined = run.glyphs[index];
                const position: GlyphPosition | undefined = run.positions[index];
                if (glyph === undefined || position === undefined) {
                    throw new Error('Font returned mismatched glyph positions.');
                }
                if (
                    glyph.id === 0 &&
                    !glyph.codePoints.every((point: number): boolean =>
                        /\s/u.test(String.fromCodePoint(point)),
                    )
                ) {
                    throw new Error(
                        'Font does not contain a requested character. Supply its matching workspace font.',
                    );
                }
                const bounds: DesignGlyphBounds | null = DesignFontGlyphGeometry.bounds(
                    glyph,
                    position,
                    penX,
                    penY,
                    scale,
                );
                if (bounds === null) {
                    if (
                        glyph.codePoints.some(
                            (point: number): boolean =>
                                !/[\s\p{Cf}\p{Mn}]/u.test(String.fromCodePoint(point)),
                        )
                    ) {
                        throw new Error('This glyph has no editable vector outline.');
                    }
                } else if (window === null || DesignFontGlyphGeometry.intersects(bounds, window)) {
                    yield {
                        ...(span.style === style ? {} : { style: span.style }),
                        index: runOffset + index,
                        bounds,
                        glyphId: glyph.id,
                        x: penX + position.xOffset * scale,
                        y: penY - position.yOffset * scale,
                    };
                }
                penX += position.xAdvance * scale + (glyph.isMark ? 0 : tracking);
                penY -= position.yAdvance * scale;
            }
            runOffset += run.glyphs.length;
        }
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
