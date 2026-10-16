// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgImportLabel, type DesignSvgTextContext } from './DesignSvgImportLabel.js';
import { DesignSvgTextChunks, type DesignSvgTextChunk } from './DesignSvgTextChunks.js';
import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignSvgImportAppearance } from './DesignSvgImportAppearance.js';
import { DesignSvgImportTextStyles as Styles } from './DesignSvgImportTextStyles.js';
import { DesignSvgTransforms as T } from './DesignSvgTransforms.js';
import { DesignSvgImportedFonts } from './DesignSvgImportedFonts.js';
import { DesignSvgImportPaints } from './DesignSvgImportPaints.js';
import { DesignTextShaping } from './DesignTextShaping.js';
import type { DesignFontEngine } from './DesignFontEngine.js';
import {
    DesignTextLayout,
    type DesignTextLine,
    type DesignTextSpanStyle,
} from './DesignTextLayout.js';
import { DesignPaths, type DesignPathGeometry } from './DesignPaths.js';
import { DesignDefaults } from './DesignDefaults.js';
import type { DesignNode, DesignPathCommand, DesignText } from './DesignTypes.js';

/** Compatibility name for the editable label's import ancestry. */
export type { DesignSvgTextContext } from './DesignSvgImportLabel.js';

/** Positioned SVG chunks remain editable labels in one ordinary native group. */
export class DesignSvgImportText {
    /** Layer IDs use the same collision-safe import namespace as shapes and masks. */
    public constructor(
        public readonly css: DesignSvgCss,
        public readonly tree: DesignSvgImportTree,
        public readonly identify: (key: string) => string,
        public readonly fonts: DesignSvgImportedFonts = new DesignSvgImportedFonts(),
        public readonly paints: DesignSvgImportPaints = new DesignSvgImportPaints(
            new Map(),
            css,
            new Map(),
        ),
    ) {}

    /** A shared group preserves parent opacity, clipping and original glyph object bounds. */
    public async build(
        element: DesignSvgElement,
        context: DesignSvgTextContext,
    ): Promise<string | null> {
        const label: DesignSvgImportLabel = new DesignSvgImportLabel(
            this.css,
            this.tree,
            this.fonts,
            this.paints,
        );
        const planner: DesignSvgTextChunks = new DesignSvgTextChunks(this.css);
        const chunks: readonly DesignSvgTextChunk[] | null = planner.read(element, context);
        if (chunks === null) {
            return label.build(element, context);
        }
        if (
            chunks.every(
                (chunk: DesignSvgTextChunk): boolean => chunk.element.children.length === 0,
            )
        ) {
            return null;
        }
        const styles: Styles = new Styles(this.css);
        const style: Readonly<Record<string, string>> = styles.resolve(element, context.ancestors);
        const baseSize: number = Number(style['font-size'] ?? 16);
        let x: number =
            Styles.position(
                style['x'] ?? element.attributes['x'] ?? '0',
                baseSize,
                styles.rootSize,
                context.width,
            ) +
            Styles.position(
                style['dx'] ?? element.attributes['dx'] ?? '0',
                baseSize,
                styles.rootSize,
                context.width,
            );
        let y: number =
            Styles.position(
                style['y'] ?? element.attributes['y'] ?? '0',
                baseSize,
                styles.rootSize,
                context.height,
            ) +
            Styles.position(
                style['dy'] ?? element.attributes['dy'] ?? '0',
                baseSize,
                styles.rootSize,
                context.height,
            );
        const group: DesignNode = DesignDefaults.node(context.id, 'group', context.name);
        this.tree.append({
            ...group,
            parentId: context.parentId,
            opacity: DesignSvgImportAppearance.opacity(style['opacity']),
        });
        const children: string[] = [];
        const commands: DesignPathCommand[] = [];
        const fonts: DesignFontEngine = await this.fonts.engine();
        const factor: number | null = T.strokeScale(context.matrix);
        if (factor === null) {
            throw new Error('SVG text requires a uniform editable transform.');
        }
        for (const chunk of chunks) {
            x = chunk.x ?? x;
            y = chunk.y ?? y;
            const id: string = this.identify(
                context.id + ':text-chunk:' + children.length.toString(),
            );
            const source: DesignSvgElement = {
                name: 'text',
                attributes: { ...chunk.element.attributes, x: x.toString(), y: y.toString() },
                children: chunk.element.children,
            };
            const result: string | null = await label.build(source, {
                ...context,
                id,
                parentId: context.id,
                ancestors: [],
            });
            if (result === null) {
                continue;
            }
            children.push(result);
            const geometry: DesignPathGeometry | undefined = this.tree.sourceGeometry(result);
            if (geometry !== undefined) {
                commands.push(
                    ...geometry.path.map((command: DesignPathCommand): DesignPathCommand => ({
                        ...command,
                        values: command.values.map(
                            (value: number, index: number): number =>
                                value + (index % 2 === 0 ? geometry.x : geometry.y),
                        ),
                    })),
                );
            }
            const text: DesignText | null = this.tree.node(result).text;
            if (text === null) {
                throw new Error('Missing imported editable text chunk.');
            }
            const unscaled: DesignText = {
                ...text,
                size: text.size / factor,
                letterSpacing: text.letterSpacing / factor,
                runs: text.runs.map((run): typeof run => ({ ...run, size: run.size / factor })),
            };
            const lines: readonly DesignTextLine[] = DesignTextLayout.lines(
                unscaled,
                '#000000',
                Infinity,
                Infinity,
                (span: DesignTextSpanStyle, value: string): number => fonts.measure(span, value),
                DesignTextShaping.factory(fonts),
            );
            const advance: number = (lines[0]?.width ?? 0) + unscaled.letterSpacing;
            const anchor: string = chunk.element.attributes['text-anchor'] ?? 'start';
            x +=
                (text.direction === 'rtl' ? -1 : 1) *
                advance *
                (anchor === 'middle' ? 0.5 : anchor === 'end' ? 0 : 1);
        }
        if (commands.length > 0) {
            this.tree.recordGeometry(context.id, DesignPaths.normalize(commands));
        }
        this.tree.replace(context.id, (node: DesignNode): DesignNode => ({ ...node, children }));
        label.textPaints.rebase(children);
        this.tree.tighten(context.id);
        return children.length === 0 ? null : context.id;
    }
}
