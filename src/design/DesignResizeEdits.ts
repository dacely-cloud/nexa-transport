// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignFlow,
    DesignSizing,
    DesignKind,
    DesignConstraint,
    type DesignNode,
    type DesignBox,
} from './DesignTypes.js';
import type { DesignResizeOperation } from './DesignOperationTypes.js';
import type { DesignSelectionGeometry } from './DesignSelectionTypes.js';
import type { DesignLocalBox, DesignSize } from './DesignLayoutTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignConstraints } from './DesignConstraints.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignLayoutEngine } from './DesignLayout.js';

interface ResizeAxes {
    readonly width: boolean;
    readonly height: boolean;
}

/** Explicit resizes rebase constraints into the new authored dimensions; ordinary updates keep their meaning. */
export class DesignResizeEdits {
    readonly #changes: Map<string, DesignNode> = new Map();
    public constructor(public readonly context: DesignSelectionContext) {}

    /** Selected descendants are pruned, so a subtree is never resized twice by a common property edit. */
    public apply(operation: DesignResizeOperation): readonly DesignNode[] {
        this.#changes.clear();
        const axes: ResizeAxes = {
            width: operation.width !== undefined,
            height: operation.height !== undefined,
        };
        for (const node of this.context.roots) {
            const geometry: DesignSelectionGeometry = this.#geometry(node);
            const width: number =
                operation.width === undefined
                    ? node.width
                    : Math.max(
                          0.01,
                          node.placement.minWidth,
                          Math.min(node.placement.maxWidth, operation.width),
                      );
            const height: number =
                operation.height === undefined
                    ? node.height
                    : Math.max(
                          0.01,
                          node.placement.minHeight,
                          Math.min(node.placement.maxHeight, operation.height),
                      );
            if (
                (!axes.width ||
                    (Math.abs(width - geometry.width) < 0.000001 &&
                        node.placement.width === DesignSizing.Fixed)) &&
                (!axes.height ||
                    (Math.abs(height - geometry.height) < 0.000001 &&
                        node.placement.height === DesignSizing.Fixed)) &&
                (operation.x === undefined || Math.abs(operation.x - geometry.x) < 0.000001) &&
                (operation.y === undefined || Math.abs(operation.y - geometry.y) < 0.000001)
            ) {
                continue;
            }
            const parent: DesignNode | null =
                node.parentId === null ? null : this.context.node(node.parentId);
            const parentBox: DesignSelectionGeometry | null =
                parent === null ? null : this.#geometry(parent);
            this.#changes.set(
                node.id,
                DesignPaths.resize(node, {
                    ...(axes.width ? { width, x: operation.x ?? geometry.x } : {}),
                    ...(axes.height ? { height, y: operation.y ?? geometry.y } : {}),
                    placement: {
                        ...node.placement,
                        width: axes.width ? DesignSizing.Fixed : node.placement.width,
                        height: axes.height ? DesignSizing.Fixed : node.placement.height,
                        ...(axes.width && parentBox !== null
                            ? {
                                  referenceWidth:
                                      parentBox.width > 0
                                          ? parentBox.width
                                          : (parent?.width ?? 0.01),
                              }
                            : {}),
                        ...(axes.height && parentBox !== null
                            ? {
                                  referenceHeight:
                                      parentBox.height > 0
                                          ? parentBox.height
                                          : (parent?.height ?? 0.01),
                              }
                            : {}),
                    },
                }),
            );
        }
        if (this.#changes.size === 0) {
            return [];
        }
        // Parent content sizing may change when a child is resized. Its final baseline must match the new geometry.
        const boxes: ReadonlyMap<string, DesignBox> = new Map(
            new DesignLayoutEngine(
                {
                    ...this.context.document,
                    nodes: this.context.document.nodes.map(
                        (node: DesignNode): DesignNode => this.#changes.get(node.id) ?? node,
                    ),
                },
                this.context.pageId,
                this.context.measurer,
            )
                .solve()
                .boxes.map((box: DesignBox): readonly [string, DesignBox] => [box.id, box]),
        );
        for (const before of this.context.roots) {
            const next: DesignNode | undefined = this.#changes.get(before.id);
            if (next === undefined) {
                continue;
            }
            const parent: DesignBox | undefined =
                next.parentId === null ? undefined : boxes.get(next.parentId);
            const after: DesignNode =
                parent === undefined
                    ? next
                    : {
                          ...next,
                          placement: {
                              ...next.placement,
                              ...(axes.width && parent.width > 0
                                  ? { referenceWidth: parent.width }
                                  : {}),
                              ...(axes.height && parent.height > 0
                                  ? { referenceHeight: parent.height }
                                  : {}),
                          },
                      };
            this.#changes.set(after.id, after);
            this.#children(before, after, axes, boxes);
        }
        return [...this.#changes.values()];
    }

    #children(
        before: DesignNode,
        after: DesignNode,
        axes: ResizeAxes,
        boxes: ReadonlyMap<string, DesignBox>,
    ): void {
        if (before.kind === DesignKind.Boolean || before.kind === DesignKind.Instance) {
            return;
        }
        const parentBox: DesignSelectionGeometry = this.#geometry(before);
        const collapsedWidth: boolean =
            parentBox.width === 0 && (boxes.get(after.id)?.width ?? after.width) === 0;
        const collapsedHeight: boolean =
            parentBox.height === 0 && (boxes.get(after.id)?.height ?? after.height) === 0;
        for (const id of before.children) {
            const child: DesignNode = this.context.node(id);
            if (before.layout.flow !== DesignFlow.Absolute && !child.placement.absolute) {
                continue;
            }
            const editWidth: boolean =
                axes.width && child.placement.horizontal !== DesignConstraint.Start;
            const editHeight: boolean =
                axes.height && child.placement.vertical !== DesignConstraint.Start;
            if (!editWidth && !editHeight) {
                continue;
            }
            const widthActive: boolean = editWidth && !collapsedWidth;
            const heightActive: boolean = editHeight && !collapsedHeight;
            if (!widthActive && !heightActive) {
                this.#changes.set(id, {
                    ...child,
                    placement: {
                        ...child.placement,
                        ...(editWidth
                            ? {
                                  referenceWidth:
                                      child.placement.referenceWidth ??
                                      before.placement.contentReferenceWidth ??
                                      before.width,
                              }
                            : {}),
                        ...(editHeight
                            ? {
                                  referenceHeight:
                                      child.placement.referenceHeight ??
                                      before.placement.contentReferenceHeight ??
                                      before.height,
                              }
                            : {}),
                    },
                });
                continue;
            }
            const shown: boolean = this.context.boxes.has(id);
            const previous: DesignSelectionGeometry = this.#geometry(child);
            const reference: DesignNode = {
                ...before,
                width:
                    shown && parentBox.width > 0
                        ? parentBox.width
                        : (child.placement.referenceWidth ??
                          before.placement.contentReferenceWidth ??
                          before.width),
                height:
                    shown && parentBox.height > 0
                        ? parentBox.height
                        : (child.placement.referenceHeight ??
                          before.placement.contentReferenceHeight ??
                          before.height),
            };
            const target: DesignLocalBox = DesignConstraints.box(
                {
                    ...child,
                    ...previous,
                    placement: {
                        ...child.placement,
                        referenceWidth: reference.width,
                        referenceHeight: reference.height,
                    },
                },
                reference,
                widthActive ? after.width : reference.width,
                heightActive ? after.height : reference.height,
                { width: previous.width, height: previous.height },
            );
            const natural: DesignSize = this.context.measure(id);
            const widthConstraint: boolean =
                child.placement.horizontal === DesignConstraint.Stretch ||
                child.placement.horizontal === DesignConstraint.Scale;
            const heightConstraint: boolean =
                child.placement.vertical === DesignConstraint.Stretch ||
                child.placement.vertical === DesignConstraint.Scale;
            const resized: ResizeAxes = {
                width:
                    widthActive &&
                    widthConstraint &&
                    (child.placement.width !== DesignSizing.Hug ||
                        Math.abs(target.width - natural.width) > 0.000001),
                height:
                    heightActive &&
                    heightConstraint &&
                    (child.placement.height !== DesignSizing.Hug ||
                        Math.abs(target.height - natural.height) > 0.000001),
            };
            const next: DesignNode = DesignPaths.resize(child, {
                ...(widthActive ? { x: target.x } : {}),
                ...(heightActive ? { y: target.y } : {}),
                ...(resized.width ? { width: Math.max(0.01, target.width) } : {}),
                ...(resized.height ? { height: Math.max(0.01, target.height) } : {}),
                placement: {
                    ...child.placement,
                    width: resized.width ? DesignSizing.Fixed : child.placement.width,
                    height: resized.height ? DesignSizing.Fixed : child.placement.height,
                    ...(editWidth
                        ? {
                              referenceWidth: collapsedWidth
                                  ? (child.placement.referenceWidth ??
                                    before.placement.contentReferenceWidth ??
                                    before.width)
                                  : after.width,
                          }
                        : {}),
                    ...(editHeight
                        ? {
                              referenceHeight: collapsedHeight
                                  ? (child.placement.referenceHeight ??
                                    before.placement.contentReferenceHeight ??
                                    before.height)
                                  : after.height,
                          }
                        : {}),
                },
            });
            this.#changes.set(id, next);
            if (resized.width || resized.height) {
                this.#children(child, next, resized, boxes);
            }
        }
    }

    #geometry(node: DesignNode): DesignSelectionGeometry {
        const box: DesignBox | undefined = this.context.boxes.get(node.id);
        if (box !== undefined) {
            return this.context.local(box, node.parentId);
        }
        const size: DesignSize = this.context.measure(node.id);
        return {
            x: node.x,
            y: node.y,
            width: size.width,
            height: size.height,
            rotation: node.rotation,
        };
    }
}
