// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgShapeContext } from './DesignSvgImportShape.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgImportTextStyles as Styles } from './DesignSvgImportTextStyles.js';
import { DesignSvgImportAppearance as Appearance } from './DesignSvgImportAppearance.js';
import { DesignSvgTransforms as T, type DesignSvgPoint } from './DesignSvgTransforms.js';
import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignSvgImportedFonts } from './DesignSvgImportedFonts.js';
import type { DesignFontEngine, DesignFontMetrics } from './DesignFontEngine.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import {
    DesignTextLayout,
    type DesignTextSpanStyle,
    type DesignTextLine,
} from './DesignTextLayout.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignSvgTextBaseline } from './DesignSvgTextBaseline.js';
import { DesignSvgImportPaints } from './DesignSvgImportPaints.js';
import {
    DesignSvgImportTextPaints,
    type DesignSvgTextFill,
    type DesignSvgTextPaintRange,
    type DesignSvgTextAppearance,
} from './DesignSvgImportTextPaints.js';
import { DesignTextShaping } from './DesignTextShaping.js';
import { DesignSvgImportTextDirection } from './DesignSvgImportTextDirection.js';
import type { DesignSvgSourceBounds } from './DesignSvgImportGeometry.js';
import type { DesignNode, DesignText, DesignTextRun, DesignPathCommand } from './DesignTypes.js';
import { DesignSvgImportStroke, type DesignSvgStrokeSource } from './DesignSvgImportStroke.js';

/** Imported text retains the stylesheet ancestry of its actual rendered use instance. */
export interface DesignSvgTextContext extends DesignSvgShapeContext {
    readonly ancestors: readonly DesignSvgElement[];
}
interface TextPart {
    readonly content: string;
    readonly style: DesignTextSpanStyle;
    readonly baseline: string;
    readonly fill: DesignSvgTextFill;
    readonly stroke: DesignSvgStrokeSource | null;
}
interface TextPartsContext {
    readonly spacing: number;
    readonly space: string;
    readonly anchor: string;
    readonly visibility: string;
    readonly rootSize: number;
    readonly direction: string;
    readonly bidi: string;
    readonly viewport: number;
}

/** Real font advances position editable labels; full font cells retain SVG object bounds. */
export class DesignSvgImportLabel {
    /** Paint plans share the entire SVG text object's bounds across positioned baseline chunks. */
    public readonly textPaints: DesignSvgImportTextPaints;
    /** Appends ordinary text layers to the same atomic import tree as vector artwork. */
    public constructor(
        public readonly css: DesignSvgCss,
        public readonly tree: DesignSvgImportTree,
        public readonly fonts: DesignSvgImportedFonts = new DesignSvgImportedFonts(),
        paints: DesignSvgImportPaints = new DesignSvgImportPaints(new Map(), css, new Map()),
    ) {
        this.textPaints = new DesignSvgImportTextPaints(paints, tree);
    }

    /** Text remains native text with ordinary rich ranges, inspector editing and undo. */
    public async build(
        element: DesignSvgElement,
        context: DesignSvgTextContext,
    ): Promise<string | null> {
        const styles: Styles = new Styles(this.css);
        const style: Readonly<Record<string, string>> = styles.resolve(element, context.ancestors);
        Styles.validate(element, style);
        const factor: number | null = T.strokeScale(context.matrix);
        if (
            factor === null ||
            context.matrix.a * context.matrix.d - context.matrix.b * context.matrix.c < 0
        ) {
            throw new DesignSvgInputError(
                'SVG text skew, reflection and nonuniform scaling require native affine text support.',
            );
        }
        const base: DesignTextSpanStyle = this.fonts.resolve(Styles.span(style));
        const spacing: number = this.#spacing(style, base.size, styles.rootSize);
        const anchor: string = style['text-anchor'] ?? 'start';
        if (!['start', 'middle', 'end'].includes(anchor)) {
            throw new DesignSvgInputError('Unsupported SVG text-anchor.');
        }
        let space: string = 'default';
        for (const ancestor of [...context.ancestors, element]) {
            space = ancestor.attributes['xml:space'] ?? space;
        }
        if (!['default', 'preserve'].includes(space)) {
            throw new DesignSvgInputError('Unsupported SVG xml:space.');
        }
        const parts: TextPart[] = [];
        const viewport: number = Math.hypot(context.width, context.height) / Math.SQRT2;
        const partsContext: TextPartsContext = {
            spacing,
            space,
            anchor,
            visibility: style['visibility'] ?? 'visible',
            rootSize: styles.rootSize,
            direction: style['direction'] ?? 'ltr',
            bidi: style['unicode-bidi'] ?? 'normal',
            viewport,
        };
        this.#parts(element, style, context.ancestors, partsContext, parts, true);
        if (space === 'default') {
            let empty: boolean = true;
            let trailing: boolean = false;
            for (let index: number = 0; index < parts.length; index++) {
                const part: TextPart | undefined = parts[index];
                if (part === undefined) {
                    continue;
                }
                let content: string = part.content.replace(/[ \t\r\n]+/gu, ' ');
                if (empty || trailing) {
                    content = content.trimStart();
                }
                if (content !== '') {
                    empty = false;
                    trailing = content.endsWith(' ');
                }
                parts[index] = { ...part, content };
            }
            for (let index: number = parts.length - 1; index >= 0; index--) {
                const part: TextPart | undefined = parts[index];
                if (part === undefined) {
                    continue;
                }
                parts[index] = { ...part, content: part.content.trimEnd() };
                if (parts[index]?.content !== '') {
                    break;
                }
            }
        }
        const content: string = parts.map((part: TextPart): string => part.content).join('');
        if (content === '') {
            return null;
        }
        if (content.length > 100000) {
            throw new DesignSvgInputError('SVG text exceeds the native text layer budget.');
        }
        const runs: DesignTextRun[] = [];
        const ranges: DesignSvgTextPaintRange[] = [];
        let offset: number = 0;
        for (const part of parts) {
            if (part.content === '') {
                continue;
            }
            ranges.push({
                start: offset,
                end: offset + part.content.length,
                style: part.style,
                fill: part.fill,
                stroke: part.stroke,
            });
            if (!this.#same(part.style, base)) {
                runs.push({
                    family: part.style.family,
                    size: part.style.size,
                    weight: part.style.weight,
                    italic: part.style.italic,
                    color: null,
                    underline: false,
                    start: offset,
                    end: offset + part.content.length,
                    ...(part.style.font == null ? {} : { font: part.style.font }),
                });
            }
            offset += part.content.length;
        }
        const text: DesignText = DesignStyleCodec.text({
            content,
            family: base.family,
            size: base.size,
            weight: base.weight,
            italic: base.italic,
            lineHeight: 1.4,
            letterSpacing: spacing,
            align: 'start',
            direction: DesignSvgImportTextDirection.read(content, style),
            runs,
            ...(base.font == null ? {} : { font: base.font }),
        });
        const fonts: DesignFontEngine = await this.fonts.engine();
        const baseline: number = DesignSvgTextBaseline.offset(
            style['dominant-baseline'] ?? 'auto',
            base,
            fonts,
        );
        for (const part of parts) {
            if (
                Math.abs(
                    DesignSvgTextBaseline.offset(part.baseline, part.style, fonts) - baseline,
                ) > 0.000001
            ) {
                throw new DesignSvgInputError(
                    'SVG rich span baseline changes require independent editable text chunks.',
                );
            }
        }
        const lines: readonly DesignTextLine[] = DesignTextLayout.lines(
            text,
            base.color,
            Infinity,
            Infinity,
            (span: DesignTextSpanStyle, value: string): number => {
                if (!fonts.supports(span)) {
                    throw new DesignSvgInputError(
                        'SVG text requires an available exact font face: ' +
                            span.family +
                            '. Use Inter or import the label separately with its workspace font.',
                    );
                }
                return fonts.measure(span, value);
            },
            DesignTextShaping.factory(fonts),
        );
        const line: DesignTextLine | undefined = lines[0];
        if (line === undefined || lines.length !== 1) {
            throw new DesignSvgInputError('SVG text requires one baseline per editable label.');
        }
        const advance: number = line.width + spacing;
        if (advance <= 0) {
            throw new DesignSvgInputError(
                'SVG tracking reverses the text advance; native overlapping text support is required.',
            );
        }
        const width: number = Math.max(0.01, line.width, advance);
        const height: number = line.height;
        const x: number =
            Styles.position(
                style['x'] ?? element.attributes['x'] ?? '0',
                base.size,
                styles.rootSize,
                context.width,
            ) +
            Styles.position(
                style['dx'] ?? element.attributes['dx'] ?? '0',
                base.size,
                styles.rootSize,
                context.width,
            ) -
            advance *
                DesignSvgImportTextDirection.anchor(
                    anchor,
                    text.direction === 'rtl' ? 'rtl' : 'ltr',
                );
        const y: number =
            Styles.position(
                style['y'] ?? element.attributes['y'] ?? '0',
                base.size,
                styles.rootSize,
                context.height,
            ) +
            Styles.position(
                style['dy'] ?? element.attributes['dy'] ?? '0',
                base.size,
                styles.rootSize,
                context.height,
            ) +
            baseline;
        const top: number = y - DesignTextLayout.baseline(line, text.lineHeight);
        const center: DesignSvgPoint = T.point(context.matrix, x + width / 2, top + height / 2);
        const commands: DesignPathCommand[] = [];
        let sourceTop: number = Infinity;
        let sourceBottom: number = -Infinity;
        for (const segment of line.segments) {
            const metrics: DesignFontMetrics = fonts.metrics(segment.style);
            const left: number = x + segment.x;
            const right: number = left + Math.max(0, segment.width + spacing);
            sourceTop = Math.min(sourceTop, y - metrics.ascent);
            sourceBottom = Math.max(sourceBottom, y + metrics.descent);
            const points: readonly DesignSvgPoint[] = [
                T.point(context.matrix, left, y - metrics.ascent),
                T.point(context.matrix, right, y - metrics.ascent),
                T.point(context.matrix, right, y + metrics.descent),
                T.point(context.matrix, left, y + metrics.descent),
            ];
            for (let index: number = 0; index < points.length; index++) {
                const point: DesignSvgPoint | undefined = points[index];
                if (point !== undefined) {
                    commands.push({ verb: index === 0 ? 'M' : 'L', values: [point.x, point.y] });
                }
            }
            commands.push({ verb: 'Z', values: [] });
        }
        if (commands.length > 0) {
            this.tree.recordGeometry(context.id, DesignPaths.normalize(commands));
        }
        const node: DesignNode = DesignDefaults.node(context.id, 'text', context.name);
        const sourceBounds: DesignSvgSourceBounds = {
            x,
            y: sourceTop,
            width: advance,
            height: sourceBottom - sourceTop,
        };
        this.tree.recordOriginalBounds(context.id, sourceBounds, context.matrix);
        const appearance: DesignSvgTextAppearance = await this.textPaints.prepare(
            context.id,
            text,
            ranges,
            DesignSvgImportTextPaints.fill(style),
            {
                source: sourceBounds,
                target: { x, y: top, width, height, path: [] },
                matrix: T.identity,
                viewportWidth: context.width,
                viewportHeight: context.height,
                color: style['color'] ?? '#000000',
            },
            factor,
        );
        this.tree.append({
            ...node,
            parentId: context.parentId,
            x: center.x - (width * factor) / 2,
            y: center.y - (height * factor) / 2,
            width: width * factor,
            height: height * factor,
            rotation: (Math.atan2(context.matrix.b, context.matrix.a) * 180) / Math.PI,
            visible:
                style['display'] !== 'none' &&
                !['hidden', 'collapse'].includes(style['visibility'] ?? 'visible'),
            opacity: Appearance.opacity(style['opacity']),
            style: { ...node.style, fills: appearance.fills, stroke: appearance.stroke },
            text: appearance.text,
        });
        return context.id;
    }

    #parts(
        element: DesignSvgElement,
        style: Readonly<Record<string, string>>,
        ancestors: readonly DesignSvgElement[],
        context: TextPartsContext,
        parts: TextPart[],
        root: boolean,
    ): void {
        Styles.validate(element, style);
        if (!root) {
            if (
                (style['direction'] ?? 'ltr') !== context.direction ||
                (style['unicode-bidi'] ?? 'normal') !== context.bidi
            ) {
                throw new DesignSvgInputError(
                    'SVG inline direction changes require independent native directional ranges.',
                );
            }
            for (const property of ['x', 'y', 'dx', 'dy', 'transform', 'clip-path', 'mask']) {
                if (style[property] !== undefined || element.attributes[property] !== undefined) {
                    throw new DesignSvgInputError(
                        'Positioned or transformed SVG tspan requires independent editable baseline support.',
                    );
                }
            }
            if (
                (style['text-anchor'] ?? 'start') !== context.anchor ||
                (style['visibility'] ?? 'visible') !== context.visibility
            ) {
                throw new DesignSvgInputError(
                    'SVG tspan text-anchor changes require separate text chunks.',
                );
            }
            if (
                Appearance.opacity(style['opacity']) !== 1 ||
                this.#spacing(style, Number(style['font-size'] ?? 16), context.rootSize) !==
                    context.spacing ||
                (element.attributes['xml:space'] ?? context.space) !== context.space
            ) {
                throw new DesignSvgInputError(
                    'SVG tspan spacing and opacity changes require separate text chunks.',
                );
            }
        }
        if (style['display'] === 'none') {
            return;
        }
        const span: DesignTextSpanStyle = this.fonts.resolve(Styles.span(style));
        const fill: DesignSvgTextFill = DesignSvgImportTextPaints.fill(style);
        const stroke: DesignSvgStrokeSource | null = DesignSvgImportStroke.read(
            style,
            (source: string): number =>
                Styles.position(
                    source,
                    Number(style['font-size'] ?? 16),
                    context.rootSize,
                    context.viewport,
                ),
        );
        const baseline: string =
            !root && style['alignment-baseline'] === 'alphabetic'
                ? 'alphabetic'
                : (style['dominant-baseline'] ?? 'auto');
        for (const child of element.children) {
            if (typeof child === 'string') {
                const value: string =
                    context.space === 'preserve' ? child.replace(/[\t\r\n]/gu, ' ') : child;
                const previous: TextPart | undefined = parts.at(-1);
                if (
                    previous !== undefined &&
                    previous.baseline === baseline &&
                    JSON.stringify(previous.fill) === JSON.stringify(fill) &&
                    JSON.stringify(previous.stroke) === JSON.stringify(stroke) &&
                    this.#same(previous.style, span)
                ) {
                    parts[parts.length - 1] = { ...previous, content: previous.content + value };
                } else {
                    parts.push({ content: value, style: span, baseline, fill, stroke });
                }
            } else if (child.name === 'tspan') {
                const resolved: Readonly<Record<string, string>> = new Styles(this.css).resolve(
                    child,
                    [...ancestors, element],
                );
                this.#parts(child, resolved, [...ancestors, element], context, parts, false);
            } else if (!['title', 'desc', 'metadata'].includes(child.name)) {
                throw new DesignSvgInputError('Unsupported SVG text child ' + child.name + '.');
            }
        }
    }
    #spacing(style: Readonly<Record<string, string>>, size: number, rootSize: number): number {
        if (style['letter-spacing']?.trim().endsWith('%')) {
            throw new DesignSvgInputError(
                'SVG percentage tracking requires per-glyph spacing support.',
            );
        }
        return style['letter-spacing'] === undefined || style['letter-spacing'] === 'normal'
            ? 0
            : Styles.length(style['letter-spacing'], size, rootSize);
    }
    #same(a: DesignTextSpanStyle, b: DesignTextSpanStyle): boolean {
        return (
            a.family === b.family &&
            a.size === b.size &&
            a.weight === b.weight &&
            a.italic === b.italic &&
            a.font?.id === b.font?.id &&
            a.font?.sha256 === b.font?.sha256 &&
            a.color === b.color
        );
    }
}
