// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignShapedTextMetrics } from './DesignShapedTextMetrics.js';
import type { DesignTextMeasurer } from './DesignLayoutTypes.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignSelectionPlan, DesignSelectionGeometry } from './DesignSelectionTypes.js';
import {
    DesignTextLayout,
    type DesignTextLine,
    type DesignTextSpanStyle,
    type DesignTextSegment,
} from './DesignTextLayout.js';
import type { DesignFontEngine } from './DesignFontEngine.js';
import {
    DesignKind,
    DesignSizing,
    DesignPaintKind,
    DesignPathVerb,
    type DesignDocument,
    type DesignNode,
    type DesignText,
    type DesignPaint,
    type DesignPathCommand,
} from './DesignTypes.js';
import type { DesignOperation } from './DesignOperationTypes.js';

/** Text becomes editable span paths while retaining its original identity, box, paints and effects. */
export class DesignTextOutline {
    /** The same pure plan is committed by browser saves and by native transactional tools. */
    public static plan(
        document: DesignDocument,
        pageId: string,
        selection: readonly string[],
        fonts: DesignFontEngine,
        id: (source: string) => string,
        measurer: DesignTextMeasurer = new DesignShapedTextMetrics(
            (style: DesignTextSpanStyle, content: string): number =>
                fonts.supports(style)
                    ? fonts.measure(style, content)
                    : DesignTextLayout.estimate(style, content),
        ),
    ): DesignSelectionPlan {
        const context: DesignSelectionContext = new DesignSelectionContext(
            document,
            pageId,
            selection,
            measurer,
        );
        const operations: DesignOperation[] = [];
        for (const node of context.roots) {
            const text: DesignText | null = node.text;
            if (node.kind !== DesignKind.Text || text === null) {
                throw new Error(
                    'Select authored text layers to outline. Detach linked instances before outlining their text.',
                );
            }
            if (
                document.nodes.some((instance: DesignNode): boolean =>
                    instance.overrides.some((override): boolean => override.nodeId === node.id),
                )
            ) {
                throw new Error(
                    'Detach instances that override this text before outlining its reusable definition.',
                );
            }
            const box: DesignSelectionGeometry = context.local(context.box(node.id), node.parentId);
            operations.push({
                op: 'update',
                id: node.id,
                changes: {
                    kind: DesignKind.Group,
                    text: null,
                    ...box,
                    placement: {
                        ...node.placement,
                        width: DesignSizing.Fixed,
                        height: DesignSizing.Fixed,
                    },
                    layout: { ...DesignDefaults.node('outline').layout, clip: true },
                    style: {
                        ...node.style,
                        fills: [],
                        stroke: null,
                        corners: DesignDefaults.style(DesignKind.Group).corners,
                    },
                },
            });
            const lines: readonly DesignTextLine[] = DesignTextLayout.lines(
                text,
                node.style.fills[0]?.color ?? '#18181B',
                box.width,
                box.height,
                (style: DesignTextSpanStyle, content: string): number =>
                    fonts.measure(style, content),
            );
            let index: number = 0;
            for (const line of lines) {
                const baseline: number = line.y + (line.height / text.lineHeight) * 0.82;
                for (const segment of line.segments) {
                    const path: readonly DesignPathCommand[] = fonts.outline(
                        segment.style,
                        segment.text,
                        segment.x,
                        baseline,
                        text.letterSpacing,
                    );
                    const fills: readonly DesignPaint[] = node.style.fills.map(
                        (paint: DesignPaint): DesignPaint =>
                            segment.style.rich
                                ? {
                                      ...paint,
                                      kind: DesignPaintKind.Solid,
                                      color: segment.style.color,
                                      stops: [],
                                      assetId: null,
                                      tokenId: null,
                                  }
                                : paint,
                    );
                    if (path.length > 0) {
                        this.#insert(
                            operations,
                            node,
                            pageId,
                            box,
                            id(`${node.id}:outline:${index}`),
                            index++,
                            segment,
                            path,
                            fills,
                            false,
                        );
                    }
                    if (segment.style.underline && segment.width > 0) {
                        const y: number = baseline + Math.max(1, segment.style.size / 12);
                        const bottom: number = y + Math.max(1, segment.style.size / 16);
                        const path: readonly DesignPathCommand[] = [
                            { verb: DesignPathVerb.Move, values: [segment.x, y] },
                            { verb: DesignPathVerb.Line, values: [segment.x + segment.width, y] },
                            {
                                verb: DesignPathVerb.Line,
                                values: [segment.x + segment.width, bottom],
                            },
                            { verb: DesignPathVerb.Line, values: [segment.x, bottom] },
                            { verb: DesignPathVerb.Close, values: [] },
                        ];
                        this.#insert(
                            operations,
                            node,
                            pageId,
                            box,
                            id(`${node.id}:outline:${index}`),
                            index++,
                            segment,
                            path,
                            fills,
                            true,
                        );
                    }
                }
            }
        }
        if (operations.length > 512) {
            throw new Error('Outlining exceeds 512 operations. Select fewer text layers.');
        }
        return { operations, selection: context.roots.map((node: DesignNode): string => node.id) };
    }

    static #insert(
        operations: DesignOperation[],
        parent: DesignNode,
        pageId: string,
        box: DesignSelectionGeometry,
        id: string,
        index: number,
        segment: DesignTextSegment,
        path: readonly DesignPathCommand[],
        fills: readonly DesignPaint[],
        underline: boolean,
    ): void {
        const template: DesignNode = DesignDefaults.node(
            id,
            DesignKind.Path,
            underline ? 'Underline' : segment.text.trim().slice(0, 120) || 'Glyphs',
        );
        operations.push({
            op: 'insert',
            pageId,
            parentId: parent.id,
            index,
            node: {
                ...template,
                width: box.width,
                height: box.height,
                path,
                placement: { ...template.placement, absolute: true },
                style: { ...template.style, fills, stroke: underline ? null : parent.style.stroke },
            },
        });
    }
}
