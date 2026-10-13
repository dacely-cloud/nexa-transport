// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgShapeContext } from './DesignSvgImportShape.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgImportTextStyles as Styles } from './DesignSvgImportTextStyles.js';
import { DesignSvgImportAppearance as Appearance } from './DesignSvgImportAppearance.js';
import { DesignSvgTransforms as T, type DesignSvgPoint } from './DesignSvgTransforms.js';
import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignBuiltinFonts } from './DesignBuiltinFonts.js';
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
import type { DesignNode, DesignText, DesignTextRun, DesignPathCommand } from './DesignTypes.js';

/** Imported text retains the stylesheet ancestry of its actual rendered use instance. */
export interface DesignSvgTextContext extends DesignSvgShapeContext {
    readonly ancestors: readonly DesignSvgElement[];
}
interface TextPart {
    readonly content: string;
    readonly style: DesignTextSpanStyle;
    readonly baseline: string;
}
interface TextPartsContext {
    readonly spacing: number;
    readonly space: string;
    readonly anchor: string;
    readonly visibility: string;
    readonly rootSize: number;
}

/** Real font advances position editable labels; full font cells retain SVG object bounds. */
export class DesignSvgImportText {
    /** Appends ordinary text layers to the same atomic import tree as vector artwork. */
    public constructor(
        public readonly css: DesignSvgCss,
        public readonly tree: DesignSvgImportTree,
    ) {}

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
            throw new Error(
                'SVG text skew, reflection and nonuniform scaling require native affine text support.',
            );
        }
        const base: DesignTextSpanStyle = Styles.span(style);
        const spacing: number = this.#spacing(style, base.size, styles.rootSize);
        const anchor: string = style['text-anchor'] ?? 'start';
        if (!['start', 'middle', 'end'].includes(anchor)) {
            throw new Error('Unsupported SVG text-anchor.');
        }
        let space: string = 'default';
        for (const ancestor of [...context.ancestors, element]) {
            space = ancestor.attributes['xml:space'] ?? space;
        }
        if (!['default', 'preserve'].includes(space)) {
            throw new Error('Unsupported SVG xml:space.');
        }
        const parts: TextPart[] = [];
        const partsContext: TextPartsContext = {
            spacing,
            space,
            anchor,
            visibility: style['visibility'] ?? 'visible',
            rootSize: styles.rootSize,
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
            throw new Error('SVG text exceeds the native text layer budget.');
        }
        const runs: DesignTextRun[] = [];
        let offset: number = 0;
        for (const part of parts) {
            if (part.content === '') {
                continue;
            }
            if (!this.#same(part.style, base)) {
                runs.push({
                    family: part.style.family,
                    size: part.style.size,
                    weight: part.style.weight,
                    italic: part.style.italic,
                    color: part.style.color,
                    underline: false,
                    start: offset,
                    end: offset + part.content.length,
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
            runs,
        });
        const fonts: DesignFontEngine = await DesignBuiltinFonts.engine();
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
                throw new Error(
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
                    throw new Error(
                        'SVG text requires an available exact font face: ' +
                            span.family +
                            '. Use Inter or import the label separately with its workspace font.',
                    );
                }
                return fonts.measure(span, value);
            },
        );
        const line: DesignTextLine | undefined = lines[0];
        if (line === undefined || lines.length !== 1) {
            throw new Error('SVG text requires one baseline per editable label.');
        }
        const advance: number = line.width + spacing;
        if (advance <= 0) {
            throw new Error(
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
            (anchor === 'middle' ? advance / 2 : anchor === 'end' ? advance : 0);
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
        for (const segment of line.segments) {
            const metrics: DesignFontMetrics = fonts.metrics(segment.style);
            const left: number = x + segment.x;
            const right: number = left + Math.max(0, segment.width + spacing);
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
            style: { ...node.style, fills: [DesignDefaults.paint(base.color)] },
            text: {
                ...text,
                size: text.size * factor,
                letterSpacing: text.letterSpacing * factor,
                runs: text.runs.map((run: DesignTextRun): DesignTextRun => ({
                    ...run,
                    size: run.size * factor,
                })),
            },
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
            for (const property of ['x', 'y', 'dx', 'dy', 'transform', 'clip-path', 'mask']) {
                if (style[property] !== undefined || element.attributes[property] !== undefined) {
                    throw new Error(
                        'Positioned or transformed SVG tspan requires independent editable baseline support.',
                    );
                }
            }
            if (
                (style['text-anchor'] ?? 'start') !== context.anchor ||
                (style['visibility'] ?? 'visible') !== context.visibility
            ) {
                throw new Error('SVG tspan text-anchor changes require separate text chunks.');
            }
            if (
                Appearance.opacity(style['opacity']) !== 1 ||
                this.#spacing(style, Number(style['font-size'] ?? 16), context.rootSize) !==
                    context.spacing ||
                (element.attributes['xml:space'] ?? context.space) !== context.space
            ) {
                throw new Error(
                    'SVG tspan spacing and opacity changes require separate text chunks.',
                );
            }
        }
        if (style['display'] === 'none') {
            return;
        }
        const span: DesignTextSpanStyle = Styles.span(style);
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
                    this.#same(previous.style, span)
                ) {
                    parts[parts.length - 1] = { ...previous, content: previous.content + value };
                } else {
                    parts.push({ content: value, style: span, baseline });
                }
            } else if (child.name === 'tspan') {
                const resolved: Readonly<Record<string, string>> = new Styles(this.css).resolve(
                    child,
                    [...ancestors, element],
                );
                this.#parts(child, resolved, [...ancestors, element], context, parts, false);
            } else if (!['title', 'desc', 'metadata'].includes(child.name)) {
                throw new Error('Unsupported SVG text child ' + child.name + '.');
            }
        }
    }
    #spacing(style: Readonly<Record<string, string>>, size: number, rootSize: number): number {
        if (style['letter-spacing']?.trim().endsWith('%')) {
            throw new Error('SVG percentage tracking requires per-glyph spacing support.');
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
            a.color === b.color
        );
    }
}
