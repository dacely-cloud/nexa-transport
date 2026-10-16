// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgImportPaints, type DesignSvgPaintContext } from './DesignSvgImportPaints.js';
import { DesignSvgImportAppearance } from './DesignSvgImportAppearance.js';
import type { DesignSvgSourceBounds } from './DesignSvgImportGeometry.js';
import type { DesignSvgImportTree } from './DesignSvgImportTree.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import { DesignFontBindings } from './DesignFontBindings.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import type {
    DesignNode,
    DesignPaint,
    DesignText,
    DesignTextRun,
    DesignStroke,
} from './DesignTypes.js';
import { DesignSvgImportStroke, type DesignSvgStrokeSource } from './DesignSvgImportStroke.js';

/** Paint identity stays separate from typography until the complete text object bounds are known. */
export interface DesignSvgTextFill {
    readonly source: string;
    readonly opacity: number;
    readonly color: string;
}

/** Logical source ranges retain their own paint without breaking contextual font shaping. */
export interface DesignSvgTextPaintRange {
    readonly start: number;
    readonly end: number;
    readonly style: DesignTextSpanStyle;
    readonly fill: DesignSvgTextFill;
    readonly stroke: DesignSvgStrokeSource | null;
}

/** An imported text node receives ordinary editable layer fills and rich source ranges. */
export interface DesignSvgTextAppearance {
    readonly fills: readonly DesignPaint[];
    readonly stroke: DesignStroke | null;
    readonly text: DesignText;
}

interface TextPaintPlan {
    readonly text: DesignText;
    readonly ranges: readonly DesignSvgTextPaintRange[];
    readonly base: DesignSvgTextFill;
    readonly context: DesignSvgPaintContext;
    readonly scale: number;
}

/** One SVG text element shares object-unit gradients across all of its positioned chunks. */
export class DesignSvgImportTextPaints {
    readonly #plans: Map<string, TextPaintPlan> = new Map();

    /** Resolution reuses the import's inert local definitions and edits only its temporary native tree. */
    public constructor(
        public readonly paints: DesignSvgImportPaints,
        public readonly tree: DesignSvgImportTree,
    ) {}

    /** CSS inheritance is captured before chunks are synthesized and text coordinates are normalized. */
    public static fill(style: Readonly<Record<string, string>>): DesignSvgTextFill {
        return {
            source: (style['fill'] ?? '#000000').trim(),
            opacity: DesignSvgImportAppearance.opacity(style['fill-opacity']),
            color: style['color'] ?? '#000000',
        };
    }

    /** The initial single-label appearance also retains enough local geometry to rebase sibling chunks. */
    public prepare(
        id: string,
        text: DesignText,
        ranges: readonly DesignSvgTextPaintRange[],
        base: DesignSvgTextFill,
        context: DesignSvgPaintContext,
        scale: number,
    ): DesignSvgTextAppearance {
        const plan: TextPaintPlan = { text, ranges, base, context, scale };
        this.#plans.set(id, plan);
        return this.#resolve(plan, context.source);
    }

    /** Bounds belong to the entire text element, including independently positioned baselines. */
    public rebase(ids: readonly string[]): void {
        const plans: readonly TextPaintPlan[] = ids.map((id: string): TextPaintPlan => {
            const plan: TextPaintPlan | undefined = this.#plans.get(id);
            if (plan === undefined) {
                throw new Error('Missing SVG text paint plan.');
            }
            return plan;
        });
        if (plans.length < 2) {
            return;
        }
        const left: number = Math.min(
            ...plans.map((plan: TextPaintPlan): number => plan.context.source.x),
        );
        const top: number = Math.min(
            ...plans.map((plan: TextPaintPlan): number => plan.context.source.y),
        );
        const right: number = Math.max(
            ...plans.map(
                (plan: TextPaintPlan): number => plan.context.source.x + plan.context.source.width,
            ),
        );
        const bottom: number = Math.max(
            ...plans.map(
                (plan: TextPaintPlan): number => plan.context.source.y + plan.context.source.height,
            ),
        );
        const source: DesignSvgSourceBounds = {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
        };
        for (const [index, plan] of plans.entries()) {
            const id: string | undefined = ids[index];
            if (id === undefined) {
                throw new Error('Missing SVG text chunk.');
            }
            const appearance: DesignSvgTextAppearance = this.#resolve(plan, source);
            this.tree.replace(id, (node: DesignNode): DesignNode => ({
                ...node,
                text: appearance.text,
                style: { ...node.style, fills: appearance.fills, stroke: appearance.stroke },
            }));
        }
    }

    #resolve(plan: TextPaintPlan, source: DesignSvgSourceBounds): DesignSvgTextAppearance {
        const cache: Map<string, DesignPaint | null> = new Map();
        const paint: (fill: DesignSvgTextFill) => DesignPaint | null = (
            fill: DesignSvgTextFill,
        ): DesignPaint | null => {
            const key: string = JSON.stringify(fill);
            if (cache.has(key)) {
                return cache.get(key) ?? null;
            }
            const resolved: DesignPaint | null = this.paints.resolve(fill.source, fill.opacity, {
                ...plan.context,
                source,
                color: fill.color,
            });
            const value: DesignPaint | null =
                resolved === null
                    ? null
                    : {
                          ...resolved,
                          opacity: 1,
                          color: this.#solid(resolved),
                          stops: resolved.stops.map((stop): typeof stop => ({
                              ...stop,
                              color: this.#alpha(stop.color, resolved.opacity),
                          })),
                      };
            cache.set(key, value);
            return value;
        };
        const base: DesignPaint | null = paint(plan.base);
        const values: readonly (DesignPaint | null)[] = plan.ranges.map(
            (range: DesignSvgTextPaintRange): DesignPaint | null => paint(range.fill),
        );
        const gradient: DesignPaint | undefined = [base, ...values].find(
            (value: DesignPaint | null): value is DesignPaint =>
                value !== null && value.kind !== 'solid',
        );
        const layer: DesignPaint | null =
            gradient ??
            base ??
            values.find((value: DesignPaint | null): value is DesignPaint => value !== null) ??
            null;
        const key: string = JSON.stringify(layer);
        const style: DesignTextSpanStyle = DesignFontBindings.base(plan.text, '#000000');
        const runs: DesignTextRun[] = [];
        const strokes: Map<string, DesignStroke | null> = new Map();
        let stroke: DesignStroke | null | undefined;
        for (const [index, range] of plan.ranges.entries()) {
            const strokeKey: string = JSON.stringify(range.stroke);
            if (!strokes.has(strokeKey)) {
                strokes.set(
                    strokeKey,
                    DesignSvgImportStroke.resolve(
                        range.stroke,
                        this.paints,
                        { ...plan.context, source },
                        plan.scale,
                    ),
                );
            }
            const resolvedStroke: DesignStroke | null = strokes.get(strokeKey) ?? null;
            if (stroke === undefined) {
                stroke = resolvedStroke;
            } else if (JSON.stringify(stroke) !== JSON.stringify(resolvedStroke)) {
                throw new DesignSvgInputError(
                    'SVG inline stroke changes require native rich stroke ranges.',
                );
            }
            const value: DesignPaint | null = values[index] ?? null;
            const inherited: boolean = JSON.stringify(value) === key;
            if (!inherited && value !== null && value.kind !== 'solid') {
                throw new DesignSvgInputError(
                    'SVG text with multiple gradient paints requires independent native rich paints.',
                );
            }
            const color: string | null = inherited ? null : this.#solid(value);
            if (color === null && this.#sameFont(range.style, style)) {
                continue;
            }
            runs.push({
                start: range.start,
                end: range.end,
                family: range.style.family,
                size: range.style.size * plan.scale,
                weight: range.style.weight,
                italic: range.style.italic,
                color,
                underline: range.style.underline,
                ...(range.style.font == null ? {} : { font: range.style.font }),
            });
        }
        return {
            fills: layer === null ? [] : [layer],
            stroke: stroke ?? null,
            text: DesignStyleCodec.text({
                ...plan.text,
                size: plan.text.size * plan.scale,
                letterSpacing: plan.text.letterSpacing * plan.scale,
                runs,
            }),
        };
    }

    #solid(paint: DesignPaint | null): string {
        if (paint === null) {
            return '#00000000';
        }
        return this.#alpha(paint.color, paint.opacity);
    }

    #alpha(color: string, opacity: number): string {
        const alpha: number =
            (color.length === 9 ? Number.parseInt(color.slice(7), 16) / 255 : 1) * opacity;
        return alpha === 1
            ? color
            : color.slice(0, 7) +
                  Math.round(alpha * 255)
                      .toString(16)
                      .padStart(2, '0')
                      .toUpperCase();
    }

    #sameFont(a: DesignTextSpanStyle, b: DesignTextSpanStyle): boolean {
        return (
            a.family === b.family &&
            a.size === b.size &&
            a.weight === b.weight &&
            a.italic === b.italic &&
            a.font?.id === b.font?.id &&
            a.font?.sha256 === b.font?.sha256 &&
            !a.underline
        );
    }
}
