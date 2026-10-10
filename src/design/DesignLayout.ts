// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignFlow,
    DesignSizing,
    type DesignDocument,
    type DesignBox,
    type DesignLayout,
} from './DesignTypes.js';
import { DesignScene, type DesignSceneNode, type DesignScenePage } from './DesignScene.js';
import { DesignFlex } from './DesignFlex.js';
import { DesignGrid, type DesignGridResult } from './DesignGrid.js';
import { DesignConstraints } from './DesignConstraints.js';
import { DesignTextMetrics } from './DesignTextMetrics.js';
import type {
    DesignSize,
    DesignLocalBox,
    DesignFlowItem,
    DesignTextMeasurer,
    DesignLayoutResult,
} from './DesignLayoutTypes.js';

/** Shared deterministic layout produces world-space geometry for rendering and native tooling. */
export class DesignLayoutEngine {
    readonly #nodes: ReadonlyMap<string, DesignSceneNode>;
    readonly #sizes: Map<string, DesignSize> = new Map();
    readonly #measurer: DesignTextMeasurer;
    readonly #scene: DesignScenePage;

    /** Creates a page-local solver. Source documents remain unchanged. */
    public constructor(
        document: DesignDocument,
        pageId: string,
        measurer: DesignTextMeasurer = new DesignTextMetrics(),
    ) {
        this.#scene = DesignScene.page(document, pageId);
        this.#nodes = new Map(
            this.#scene.nodes.map((node: DesignSceneNode): [string, DesignSceneNode] => [
                node.id,
                node,
            ]),
        );
        this.#measurer = measurer;
    }
    /** Resolves visible layers in painter order, preserving nested rotation and clipping identity. */
    public solve(): DesignLayoutResult {
        const boxes: DesignBox[] = [];
        for (const id of this.#scene.page.roots) {
            const node: DesignSceneNode = this.#node(id);
            const size: DesignSize = this.#measure(node);
            this.#place(node, { id, x: node.x, y: node.y, ...size }, null, null, 0, boxes);
        }
        return { nodes: this.#scene.nodes, boxes };
    }
    #node(id: string): DesignSceneNode {
        const node: DesignSceneNode | undefined = this.#nodes.get(id);
        if (node === undefined) {
            throw new Error(`Scene layer not found: ${id}`);
        }
        return node;
    }
    #measure(node: DesignSceneNode): DesignSize {
        const cached: DesignSize | undefined = this.#sizes.get(node.id);
        if (cached !== undefined) {
            return cached;
        }
        let natural: DesignSize = { width: node.width, height: node.height };
        const items: readonly DesignFlowItem[] = node.children
            .map((id: string): DesignFlowItem => {
                const child: DesignSceneNode = this.#node(id);
                return { node: child, ...this.#measure(child) };
            })
            .filter(
                (item: DesignFlowItem): boolean =>
                    item.node.visible && !item.node.placement.absolute,
            );
        const layout: DesignLayout = node.layout;
        const horizontal: number = layout.padding.left + layout.padding.right;
        const vertical: number = layout.padding.top + layout.padding.bottom;
        if (node.text !== null) {
            natural = this.#measurer.measure(
                node.text,
                node.placement.width === DesignSizing.Hug ? 100000 : node.width,
            );
        } else if (layout.flow === DesignFlow.Row || layout.flow === DesignFlow.Column) {
            const row: boolean = layout.flow === DesignFlow.Row;
            natural = {
                width:
                    horizontal +
                    (row
                        ? items.reduce(
                              (sum: number, item: DesignFlowItem): number => sum + item.width,
                              0,
                          ) +
                          Math.max(0, items.length - 1) * layout.gap
                        : Math.max(0, ...items.map((item: DesignFlowItem): number => item.width))),
                height:
                    vertical +
                    (row
                        ? Math.max(0, ...items.map((item: DesignFlowItem): number => item.height))
                        : items.reduce(
                              (sum: number, item: DesignFlowItem): number => sum + item.height,
                              0,
                          ) +
                          Math.max(0, items.length - 1) * layout.gap),
            };
            if (
                layout.wrap &&
                (row ? node.placement.width : node.placement.height) !== DesignSizing.Hug
            ) {
                const arranged: readonly DesignLocalBox[] = DesignFlex.arrange(
                    items,
                    layout,
                    row ? node.width : natural.width,
                    row ? natural.height : node.height,
                );
                natural = {
                    width: row
                        ? natural.width
                        : Math.max(
                              horizontal,
                              ...arranged.map(
                                  (box: DesignLocalBox): number =>
                                      box.x + box.width + layout.padding.right,
                              ),
                          ),
                    height: row
                        ? Math.max(
                              vertical,
                              ...arranged.map(
                                  (box: DesignLocalBox): number =>
                                      box.y + box.height + layout.padding.bottom,
                              ),
                          )
                        : natural.height,
                };
            }
        } else if (layout.flow === DesignFlow.Grid) {
            const width: number =
                node.placement.width === DesignSizing.Hug
                    ? horizontal +
                      layout.columns *
                          Math.max(
                              0,
                              ...items.map(
                                  (item: DesignFlowItem): number =>
                                      item.width /
                                      Math.min(layout.columns, item.node.placement.columnSpan),
                              ),
                          ) +
                      (layout.columns - 1) * layout.gap
                    : node.width;
            const grid: DesignGridResult = DesignGrid.arrange(items, layout, width, null);
            natural = { width, height: grid.height };
        } else if (items.length > 0) {
            natural = {
                width: Math.max(
                    horizontal,
                    ...items.map(
                        (item: DesignFlowItem): number =>
                            item.node.x + item.width + layout.padding.right,
                    ),
                ),
                height: Math.max(
                    vertical,
                    ...items.map(
                        (item: DesignFlowItem): number =>
                            item.node.y + item.height + layout.padding.bottom,
                    ),
                ),
            };
        }
        const size: DesignSize = {
            width: Math.max(
                0.01,
                node.placement.minWidth,
                Math.min(
                    node.placement.maxWidth,
                    node.placement.width === DesignSizing.Hug ? natural.width : node.width,
                ),
            ),
            height: Math.max(
                0.01,
                node.placement.minHeight,
                Math.min(
                    node.placement.maxHeight,
                    node.placement.height === DesignSizing.Hug ? natural.height : node.height,
                ),
            ),
        };
        this.#sizes.set(node.id, size);
        return size;
    }
    #children(node: DesignSceneNode, width: number, height: number): readonly DesignLocalBox[] {
        const children: readonly DesignSceneNode[] = node.children.map(
            (id: string): DesignSceneNode => this.#node(id),
        );
        const items: readonly DesignFlowItem[] = children
            .filter((child: DesignSceneNode): boolean => child.visible && !child.placement.absolute)
            .map((child: DesignSceneNode): DesignFlowItem => ({
                node: child,
                ...this.#measure(child),
            }));
        let arranged: readonly DesignLocalBox[] = [];
        if (node.layout.flow === DesignFlow.Grid) {
            arranged = DesignGrid.arrange(items, node.layout, width, height).boxes;
        } else if (node.layout.flow !== DesignFlow.Absolute) {
            arranged = DesignFlex.arrange(items, node.layout, width, height);
            const widths: ReadonlyMap<string, number> = new Map(
                arranged.map((box: DesignLocalBox): [string, number] => [box.id, box.width]),
            );
            const measured: readonly DesignFlowItem[] = items.map(
                (item: DesignFlowItem): DesignFlowItem =>
                    item.node.text === null || item.node.placement.height !== DesignSizing.Hug
                        ? item
                        : {
                              ...item,
                              height: this.#measurer.measure(
                                  item.node.text,
                                  widths.get(item.node.id) ?? item.width,
                              ).height,
                          },
            );
            arranged = DesignFlex.arrange(measured, node.layout, width, height);
        }
        const flow: ReadonlyMap<string, DesignLocalBox> = new Map(
            arranged.map((box: DesignLocalBox): [string, DesignLocalBox] => [box.id, box]),
        );
        return children
            .filter((child: DesignSceneNode): boolean => child.visible)
            .map(
                (child: DesignSceneNode): DesignLocalBox =>
                    flow.get(child.id) ??
                    DesignConstraints.box(child, node, width, height, this.#measure(child)),
            );
    }
    #place(
        node: DesignSceneNode,
        local: DesignLocalBox,
        parent: DesignBox | null,
        clipId: string | null,
        depth: number,
        output: DesignBox[],
    ): void {
        if (!node.visible) {
            return;
        }
        let centerX: number = local.x + local.width / 2;
        let centerY: number = local.y + local.height / 2;
        if (parent !== null) {
            const angle: number = (parent.rotation * Math.PI) / 180;
            const x: number = centerX - parent.width / 2;
            const y: number = centerY - parent.height / 2;
            centerX = parent.x + parent.width / 2 + x * Math.cos(angle) - y * Math.sin(angle);
            centerY = parent.y + parent.height / 2 + x * Math.sin(angle) + y * Math.cos(angle);
        }
        const box: DesignBox = {
            id: node.id,
            x: centerX - local.width / 2,
            y: centerY - local.height / 2,
            width: local.width,
            height: local.height,
            rotation: node.rotation + (parent?.rotation ?? 0),
            depth,
            clipId,
        };
        output.push(box);
        for (const child of this.#children(node, local.width, local.height)) {
            this.#place(
                this.#node(child.id),
                child,
                box,
                node.layout.clip ? node.id : clipId,
                depth + 1,
                output,
            );
        }
    }
}
