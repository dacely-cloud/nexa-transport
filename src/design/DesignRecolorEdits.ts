// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSelectionIndex } from './DesignSelectionIndex.js';
import { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignLayerStyleEdit } from './DesignLayerStyleEdit.js';
import {
    DesignTokenCategory,
    DesignPaintKind,
    type DesignNode,
    type DesignStyle,
    type DesignPaint,
    type DesignTextRun,
    type DesignGradientStop,
} from './DesignTypes.js';

/** A color occurs once per selected authored layer, including editable descendants. */
export interface DesignSelectionColor {
    readonly color: string;
    readonly layers: number;
}

/** Shared selection recoloring preserves native source bodies, paint stacks and linked definitions. */
export class DesignRecolorEdits {
    /** Selection color rows count layers rather than individual stops or rich ranges. */
    public static groups(index: DesignSelectionIndex): readonly DesignSelectionColor[] {
        const groups: Map<string, number> = new Map();
        for (const node of this.#nodes(index)) {
            const colors: Set<string> = new Set();
            const style: DesignStyle = this.#style(index, node);
            for (const paint of [
                ...style.fills,
                ...(node.text?.runs.flatMap(
                    (run: DesignTextRun): readonly DesignPaint[] => run.fills ?? [],
                ) ?? []),
                ...(style.stroke === null ? [] : [style.stroke.paint]),
            ]) {
                if (paint.kind === DesignPaintKind.Solid) {
                    colors.add(this.#color(index, paint));
                } else if (paint.kind !== DesignPaintKind.Image) {
                    for (const stop of paint.stops) {
                        colors.add(stop.color.toUpperCase());
                    }
                }
            }
            for (const run of node.text?.runs ?? []) {
                if (run.color !== null) {
                    colors.add(run.color.toUpperCase());
                }
            }
            for (const color of colors) {
                groups.set(color, (groups.get(color) ?? 0) + 1);
            }
        }
        return [...groups].map(([color, layers]: [string, number]): DesignSelectionColor => ({
            color,
            layers,
        }));
    }

    /** Returns changed authored nodes only; locked descendant branches and reusable definitions stay intact. */
    public static replace(
        index: DesignSelectionIndex,
        before: string,
        after: string,
    ): readonly DesignNode[] {
        if (before === after) {
            return [];
        }
        const authority: DesignLayerAuthority = new DesignLayerAuthority(
            index.nodes,
            new Map(
                index.document.pages.map((page): readonly [string, typeof page] => [page.id, page]),
            ),
        );
        const changed: DesignNode[] = [];
        for (const node of this.#nodes(index)) {
            const style: DesignStyle = this.#style(index, node);
            const fills: readonly DesignPaint[] = style.fills.map(
                (paint: DesignPaint): DesignPaint => this.#paint(index, paint, before, after),
            );
            const stroke: DesignPaint | null =
                style.stroke === null
                    ? null
                    : this.#paint(index, style.stroke.paint, before, after);
            const styleChanged: boolean =
                fills.some(
                    (paint: DesignPaint, slot: number): boolean => paint !== style.fills[slot],
                ) || stroke !== (style.stroke?.paint ?? null);
            let next: DesignNode = styleChanged
                ? DesignLayerStyleEdit.apply(authority, node.id, index.pageId, (): DesignStyle => ({
                      ...style,
                      fills,
                      stroke:
                          style.stroke === null || stroke === null
                              ? null
                              : { ...style.stroke, paint: stroke },
                  }))
                : node;
            if (node.text !== null) {
                const runs: readonly DesignTextRun[] = node.text.runs.map(
                    (run: DesignTextRun): DesignTextRun => {
                        const fills: readonly DesignPaint[] | undefined = run.fills?.map(
                            (paint: DesignPaint): DesignPaint =>
                                this.#paint(index, paint, before, after),
                        );
                        const color: string | null =
                            run.color?.toUpperCase() === before ? after : run.color;
                        return color === run.color &&
                            (fills === undefined ||
                                fills.every(
                                    (paint: DesignPaint, slot: number): boolean =>
                                        paint === run.fills?.[slot],
                                ))
                            ? run
                            : { ...run, color, ...(fills === undefined ? {} : { fills }) };
                    },
                );
                if (
                    runs.some(
                        (run: DesignTextRun, slot: number): boolean =>
                            run !== node.text?.runs[slot],
                    )
                ) {
                    next = { ...next, text: { ...node.text, runs } };
                }
            }
            if (next !== node) {
                changed.push(next);
            }
        }
        return changed;
    }

    /** Topmost roots prevent selected descendants from being recolored twice. */
    static #nodes(index: DesignSelectionIndex): readonly DesignNode[] {
        const nodes: DesignNode[] = [];
        const stack: DesignNode[] = index.roots.toReversed();
        while (stack.length > 0) {
            const node: DesignNode | undefined = stack.pop();
            if (node === undefined || node.locked) {
                continue;
            }
            nodes.push(node);
            for (const id of node.children.toReversed()) {
                stack.push(index.node(id));
            }
        }
        return nodes;
    }

    static #style(index: DesignSelectionIndex, node: DesignNode): DesignStyle {
        const component: DesignNode | undefined =
            node.componentId === null ? undefined : index.nodes.get(node.componentId);
        return component === undefined
            ? node.style
            : (node.overrides.find((override): boolean => override.nodeId === component.id)
                  ?.style ?? component.style);
    }

    static #color(index: DesignSelectionIndex, paint: DesignPaint): string {
        return (
            index.document.tokens.find(
                (token): boolean =>
                    token.id === paint.tokenId && token.category === DesignTokenCategory.Color,
            )?.value ?? paint.color
        ).toUpperCase();
    }

    static #paint(
        index: DesignSelectionIndex,
        paint: DesignPaint,
        before: string,
        after: string,
    ): DesignPaint {
        if (paint.kind === DesignPaintKind.Image) {
            return paint;
        }
        if (paint.kind === DesignPaintKind.Solid) {
            return this.#color(index, paint) === before
                ? { ...paint, color: after, tokenId: null }
                : paint;
        }
        if (
            !paint.stops.some(
                (stop: DesignGradientStop): boolean => stop.color.toUpperCase() === before,
            )
        ) {
            return paint;
        }
        return {
            ...paint,
            stops: paint.stops.map((stop: DesignGradientStop): DesignGradientStop =>
                stop.color.toUpperCase() === before ? { ...stop, color: after } : stop,
            ),
        };
    }
}
