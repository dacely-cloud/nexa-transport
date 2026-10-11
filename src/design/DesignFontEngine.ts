// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    create,
    type Font,
    type FontCollection,
    type GlyphRun,
    type Glyph,
    type GlyphPosition,
    type PathCommand,
} from 'fontkit';
import { DesignFontContainer } from './DesignFontContainer.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import { DesignPathVerb, type DesignPathCommand } from './DesignTypes.js';

/** A caller supplies authorized font bytes, never a process-global filesystem path. */
export interface DesignFontSource {
    readonly family: string;
    readonly italic: boolean;
    readonly weight: number;
    readonly bytes: Uint8Array;
}
interface RegisteredFont {
    readonly source: DesignFontSource;
    readonly face: Font;
}

/** Real font shaping and editable outlines share the same bounded browser-compatible engine. */
export class DesignFontEngine {
    readonly #fonts: RegisteredFont[] = [];
    readonly #variations: Map<string, Font> = new Map();

    /** Admits standalone sfnt/WOFF fonts with bounded decompression before invoking the parser. */
    public add(source: DesignFontSource): void {
        const bytes: Uint8Array = source.bytes;
        DesignFontContainer.inspect(bytes);
        const parsed: Font | FontCollection = create(bytes);
        if (
            !('layout' in parsed) ||
            !Number.isFinite(parsed.unitsPerEm) ||
            parsed.unitsPerEm < 1 ||
            parsed.unitsPerEm > 16384
        ) {
            throw new Error('Font has invalid outline metrics.');
        }
        if (
            (parsed.type === 'WOFF' || parsed.type === 'WOFF2') &&
            parsed.variationAxes['wght'] !== undefined
        ) {
            throw new Error(
                'Use the uncompressed TTF or OTF version of a variable workspace font. Compressed variable fonts are unsupported by this parser.',
            );
        }
        if (
            this.#fonts.some(
                (item: RegisteredFont): boolean =>
                    item.source.family.toLowerCase() === source.family.toLowerCase() &&
                    item.source.italic === source.italic &&
                    item.source.weight === source.weight,
            )
        ) {
            throw new Error('Duplicate font family, weight and italic binding.');
        }
        this.#fonts.push({ source, face: parsed });
    }

    /** Measures complete shaped strings including kerning and ligatures; layout applies tracking. */
    public measure(style: DesignTextSpanStyle, content: string): number {
        const face: Font = this.#face(style);
        const run: GlyphRun = this.#shape(face, content, 0);
        return (
            (run.positions.reduce(
                (width: number, position: GlyphPosition): number => width + position.xAdvance,
                0,
            ) *
                style.size) /
            face.unitsPerEm
        );
    }

    /** Converts positioned glyph curves to the editor's M/L/Q/C/Z path records. */
    public outline(
        style: DesignTextSpanStyle,
        content: string,
        x: number,
        baseline: number,
        tracking: number,
    ): readonly DesignPathCommand[] {
        const face: Font = this.#face(style);
        const run: GlyphRun = this.#shape(face, content, tracking);
        const scale: number = style.size / face.unitsPerEm;
        const output: DesignPathCommand[] = [];
        let penX: number = x;
        let penY: number = baseline;
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
            const commands: readonly PathCommand[] = glyph.path.commands;
            if (
                commands.length === 0 &&
                glyph.codePoints.some(
                    (point: number): boolean =>
                        !/[\s\p{Cf}\p{Mn}]/u.test(String.fromCodePoint(point)),
                )
            ) {
                throw new Error('This glyph has no editable vector outline.');
            }
            for (const command of commands) {
                if (output.length >= 10000) {
                    throw new Error(
                        'Outlined span exceeds 10000 vector commands. Split the text into smaller layers.',
                    );
                }
                const verbs: Readonly<Record<string, DesignPathVerb>> = {
                    moveTo: DesignPathVerb.Move,
                    lineTo: DesignPathVerb.Line,
                    quadraticCurveTo: DesignPathVerb.Quadratic,
                    bezierCurveTo: DesignPathVerb.Cubic,
                    closePath: DesignPathVerb.Close,
                };
                const verb: DesignPathVerb | undefined = verbs[command.command];
                if (verb === undefined) {
                    throw new Error('Font returned an unsupported curve.');
                }
                const values: number[] = command.args.map(
                    (value: number, coordinate: number): number => {
                        if (!Number.isFinite(value)) {
                            throw new Error('Font returned a non-finite curve coordinate.');
                        }
                        return coordinate % 2 === 0
                            ? penX + (position.xOffset + value) * scale
                            : penY - (position.yOffset + value) * scale;
                    },
                );
                output.push({ verb, values });
            }
            penX += position.xAdvance * scale + (glyph.isMark ? 0 : tracking);
            penY -= position.yAdvance * scale;
        }
        return output;
    }

    /** Allows layout to estimate unrelated font families while outline conversion still requires a matching face. */
    public supports(style: DesignTextSpanStyle): boolean {
        const entry: RegisteredFont | undefined = this.#entry(style);
        if (entry === undefined) {
            return false;
        }
        const axis: Font['variationAxes'][string] = entry.face.variationAxes['wght'];
        return axis === undefined || (style.weight >= axis.min && style.weight <= axis.max);
    }

    #entry(style: DesignTextSpanStyle): RegisteredFont | undefined {
        return this.#fonts.find(
            (item: RegisteredFont): boolean =>
                item.source.family.toLowerCase() === style.family.toLowerCase() &&
                item.source.italic === style.italic &&
                (item.face.variationAxes['wght'] !== undefined ||
                    item.source.weight === style.weight),
        );
    }

    #face(style: DesignTextSpanStyle): Font {
        const entry: RegisteredFont | undefined = this.#entry(style);
        if (entry === undefined) {
            throw new Error(
                `No matching ${style.family} font at weight ${style.weight}${style.italic ? ' italic' : ''}. Supply a matching workspace font.`,
            );
        }
        const axis: Font['variationAxes'][string] = entry.face.variationAxes['wght'];
        if (axis === undefined) {
            return entry.face;
        }
        if (style.weight < axis.min || style.weight > axis.max) {
            throw new Error('Requested font weight is outside the supplied variable font range.');
        }
        const key: string = `${this.#fonts.indexOf(entry)}:${style.weight}`;
        let face: Font | undefined = this.#variations.get(key);
        if (face === undefined) {
            face = entry.face.getVariation({ wght: style.weight });
            if (this.#variations.size >= 64) {
                const oldest: string | undefined = this.#variations.keys().next().value;
                if (oldest !== undefined) {
                    this.#variations.delete(oldest);
                }
            }
            this.#variations.set(key, face);
        }
        return face;
    }

    #shape(face: Font, content: string, tracking: number): GlyphRun {
        if (content.length > 100000) {
            throw new Error('Text exceeds the shaping budget.');
        }
        const run: GlyphRun = face.layout(
            content,
            tracking === 0 ? {} : { liga: false, clig: false },
        );
        if (
            run.glyphs.length > 100000 ||
            run.glyphs.length !== run.positions.length ||
            run.positions.some(
                (position: GlyphPosition): boolean =>
                    ![
                        position.xAdvance,
                        position.yAdvance,
                        position.xOffset,
                        position.yOffset,
                    ].every(Number.isFinite),
            )
        ) {
            throw new Error('Font returned invalid or oversized shaping data.');
        }
        return run;
    }
}
