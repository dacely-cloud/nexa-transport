// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { Glyph, GlyphPosition, PathCommand } from 'fontkit';
import { DesignPathVerb, type DesignPathCommand } from './DesignTypes.js';
import type { DesignGlyphBounds } from './DesignFontGlyphTypes.js';

/** Curve conversion and window rejection share the exact positioned font outline coordinates. */
export class DesignFontGlyphGeometry {
    static readonly #verbs: Readonly<Record<string, DesignPathVerb>> = {
        moveTo: DesignPathVerb.Move,
        lineTo: DesignPathVerb.Line,
        quadraticCurveTo: DesignPathVerb.Quadratic,
        bezierCurveTo: DesignPathVerb.Cubic,
        closePath: DesignPathVerb.Close,
    };

    /** Empty whitespace outlines have no paint bounds and allocate no curve records. */
    public static bounds(
        glyph: Glyph,
        position: GlyphPosition,
        x: number,
        y: number,
        scale: number,
    ): DesignGlyphBounds | null {
        if (glyph.path.commands.length === 0) {
            return null;
        }
        const bounds: DesignGlyphBounds = {
            x: x + (position.xOffset + glyph.bbox.minX) * scale,
            y: y - (position.yOffset + glyph.bbox.maxY) * scale,
            width: (glyph.bbox.maxX - glyph.bbox.minX) * scale,
            height: (glyph.bbox.maxY - glyph.bbox.minY) * scale,
        };
        if (
            ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) ||
            bounds.width < 0 ||
            bounds.height < 0
        ) {
            throw new Error('Font returned invalid glyph bounds.');
        }
        return bounds;
    }

    /** Edge-touching paint remains admitted so antialiasing and stroked contours do not disappear at a window edge. */
    public static intersects(left: DesignGlyphBounds, right: DesignGlyphBounds): boolean {
        return (
            left.x <= right.x + right.width &&
            left.x + left.width >= right.x &&
            left.y <= right.y + right.height &&
            left.y + left.height >= right.y
        );
    }

    /** The caller shapes whole spans; this conversion never reshapes a sliced substring or loses contextual glyph offsets. */
    public static commands(
        glyph: Glyph,
        x: number,
        y: number,
        scale: number,
    ): readonly DesignPathCommand[] {
        const commands: readonly PathCommand[] = glyph.path.commands;
        if (commands.length > 10000) {
            throw new Error('A glyph exceeds the vector command budget.');
        }
        return commands.map((command: PathCommand): DesignPathCommand => {
            const verb: DesignPathVerb | undefined = this.#verbs[command.command];
            if (verb === undefined) {
                throw new Error('Font returned an unsupported curve.');
            }
            const values: readonly number[] = command.args.map(
                (value: number, coordinate: number): number => {
                    if (!Number.isFinite(value)) {
                        throw new Error('Font returned a non-finite curve coordinate.');
                    }
                    return coordinate % 2 === 0 ? x + value * scale : y - value * scale;
                },
            );
            return { verb, values };
        });
    }
}
