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
import { DesignStackGeometry } from './DesignStackGeometry.js';
import { DesignFlowMeasurement } from './DesignFlowMeasurement.js';
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
    readonly #widthSizes: Map<string, Map<number, DesignSize>> = new Map();
    readonly #positions: Map<string, DesignLocalBox> = new Map();
    #solved: boolean = false;
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
        this.#positions.clear();
        this.#solved = true;
        const boxes: DesignBox[] = [];
        for (const id of this.#scene.page.roots) {
            const node: DesignSceneNode = this.#node(id);
            const size: DesignSize = this.#measure(node);
            this.#place(node, { id, x: node.x, y: node.y, ...size }, null, null, 0, boxes);
        }
        return { nodes: this.#scene.nodes, boxes };
    }
    /** Hidden layers still have natural font and container dimensions for authored constraint edits. */
    public measure(id: string): DesignSize {
        return this.#measure(this.#node(id));
    }
    /** Includes expanded instances and hidden authored layers on this page. */
    public has(id: string): boolean {
        return this.#nodes.has(id);
    }
    /** Parent-local positions share the actual flow solver; hidden absolute layers retain their constraints. */
    public position(id: string): DesignLocalBox {
        if (!this.#solved) {
            this.solve();
        }
        const cached: DesignLocalBox | undefined = this.#positions.get(id);
        if (cached !== undefined) {
            return cached;
        }
        const node: DesignSceneNode = this.#node(id);
        const size: DesignSize = this.#measure(node);
        const parent: DesignSceneNode | null =
            node.parentId === null ? null : this.#node(node.parentId);
        const frame: DesignLocalBox | null = parent === null ? null : this.position(parent.id);
        if (
            node.visible &&
            parent !== null &&
            frame !== null &&
            parent.layout.flow !== DesignFlow.Absolute &&
            !node.placement.absolute
        ) {
            for (const child of this.#children(parent, frame.width, frame.height)) {
                this.#positions.set(child.id, child);
            }
            const arranged: DesignLocalBox | undefined = this.#positions.get(id);
            if (arranged !== undefined) {
                return arranged;
            }
        }
        const position: DesignLocalBox =
            parent !== null &&
            frame !== null &&
            (parent.layout.flow === DesignFlow.Absolute || node.placement.absolute)
                ? DesignConstraints.box(node, parent, frame.width, frame.height, size)
                : { id, x: node.x, y: node.y, ...size };
        this.#positions.set(id, position);
        return position;
    }
    #node(id: string): DesignSceneNode {
        const node: DesignSceneNode | undefined = this.#nodes.get(id);
        if (node === undefined) {
            throw new Error(`Scene layer not found: ${id}`);
        }
        return node;
    }
    #measure(node: DesignSceneNode, allocatedWidth: number | null = null): DesignSize {
        const cached: DesignSize | undefined =
            allocatedWidth === null
                ? this.#sizes.get(node.id)
                : this.#widthSizes.get(node.id)?.get(allocatedWidth);
        if (cached !== undefined) {
            return cached;
        }
        let natural: DesignSize = { width: node.width, height: node.height };
        let items: readonly DesignFlowItem[] = node.children
            .map((id: string): DesignSceneNode => this.#node(id))
            .filter((child: DesignSceneNode): boolean => child.visible && !child.placement.absolute)
            .map((child: DesignSceneNode): DesignFlowItem => ({
                node: child,
                ...this.#measure(child),
            }));
        const layout: DesignLayout = node.layout;
        const horizontal: number = layout.padding.left + layout.padding.right;
        const vertical: number = layout.padding.top + layout.padding.bottom;
        if (node.text !== null) {
            natural = this.#measurer.measure(
                node.text,
                Math.max(
                    node.placement.minWidth,
                    Math.min(
                        node.placement.maxWidth,
                        allocatedWidth !== null
                            ? allocatedWidth
                            : node.placement.width === DesignSizing.Hug
                              ? 100000
                              : Math.max(0.01, node.width),
                    ),
                ),
                node.id,
            );
        } else if (layout.flow === DesignFlow.Row || layout.flow === DesignFlow.Column) {
            const row: boolean = layout.flow === DesignFlow.Row;
            const gap: number = DesignFlex.gap(layout);
            natural = {
                width:
                    horizontal +
                    (row
                        ? DesignStackGeometry.span(
                              items.map((item: DesignFlowItem): number => item.width),
                              gap,
                          )
                        : Math.max(0, ...items.map((item: DesignFlowItem): number => item.width))),
                height:
                    vertical +
                    (row
                        ? Math.max(0, ...items.map((item: DesignFlowItem): number => item.height))
                        : DesignStackGeometry.span(
                              items.map((item: DesignFlowItem): number => item.height),
                              gap,
                          )),
            };
            items = DesignFlowMeasurement.atWidth(
                items,
                layout,
                Math.max(
                    node.placement.minWidth,
                    Math.min(
                        node.placement.maxWidth,
                        allocatedWidth ??
                            (node.placement.width === DesignSizing.Hug
                                ? natural.width
                                : node.width),
                    ),
                ),
                node.placement.height === DesignSizing.Hug ? natural.height : node.height,
                (child: DesignSceneNode, width: number): DesignSize => this.#measure(child, width),
            );
            natural = {
                ...natural,
                height:
                    vertical +
                    (row
                        ? Math.max(0, ...items.map((item: DesignFlowItem): number => item.height))
                        : DesignStackGeometry.span(
                              items.map((item: DesignFlowItem): number => item.height),
                              gap,
                          )),
            };
            if (
                layout.wrap &&
                ((row && allocatedWidth !== null) ||
                    (row ? node.placement.width : node.placement.height) !== DesignSizing.Hug ||
                    (row
                        ? natural.width > node.placement.maxWidth
                        : natural.height > node.placement.maxHeight))
            ) {
                const arranged: readonly DesignLocalBox[] = DesignFlex.arrange(
                    items,
                    layout,
                    row
                        ? Math.max(
                              node.placement.minWidth,
                              Math.min(
                                  node.placement.maxWidth,
                                  allocatedWidth !== null
                                      ? allocatedWidth
                                      : node.placement.width === DesignSizing.Hug
                                        ? natural.width
                                        : node.width,
                              ),
                          )
                        : natural.width,
                    row
                        ? natural.height
                        : Math.max(
                              node.placement.minHeight,
                              Math.min(
                                  node.placement.maxHeight,
                                  node.placement.height === DesignSizing.Hug
                                      ? natural.height
                                      : node.height,
                              ),
                          ),
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
                allocatedWidth !== null
                    ? allocatedWidth
                    : node.placement.width === DesignSizing.Hug
                      ? horizontal +
                        DesignStackGeometry.uniform(
                            Math.max(
                                0,
                                ...items.map((item: DesignFlowItem): number => {
                                    const span: number = Math.min(
                                        layout.columns,
                                        item.node.placement.columnSpan,
                                    );
                                    return (
                                        (item.width - Math.min(0, layout.gap) * (span - 1)) / span
                                    );
                                }),
                            ),
                            layout.columns,
                            layout.gap,
                        )
                      : node.width;
            const bounded: number = Math.max(
                node.placement.minWidth,
                Math.min(node.placement.maxWidth, width),
            );
            const grid: DesignGridResult = DesignGrid.arrange(
                items,
                layout,
                bounded,
                null,
                this.#measurer,
                (child: DesignSceneNode, width: number): DesignSize => this.#measure(child, width),
            );
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
                node.placement.minWidth,
                Math.min(
                    node.placement.maxWidth,
                    Math.max(
                        0.01,
                        allocatedWidth ??
                            (node.placement.width === DesignSizing.Hug
                                ? natural.width
                                : node.width),
                    ),
                ),
            ),
            height: Math.max(
                node.placement.minHeight,
                Math.min(
                    node.placement.maxHeight,
                    Math.max(
                        0.01,
                        node.placement.height === DesignSizing.Hug ? natural.height : node.height,
                    ),
                ),
            ),
        };
        if (allocatedWidth === null) {
            this.#sizes.set(node.id, size);
        } else {
            let widths: Map<number, DesignSize> | undefined = this.#widthSizes.get(node.id);
            if (widths === undefined) {
                widths = new Map();
                this.#widthSizes.set(node.id, widths);
            }
            widths.set(allocatedWidth, size);
        }
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
            arranged = DesignGrid.arrange(
                items,
                node.layout,
                width,
                height,
                this.#measurer,
                (child: DesignSceneNode, width: number): DesignSize => this.#measure(child, width),
            ).boxes;
        } else if (node.layout.flow !== DesignFlow.Absolute) {
            const measured: readonly DesignFlowItem[] = DesignFlowMeasurement.atWidth(
                items,
                node.layout,
                width,
                height,
                (child: DesignSceneNode, width: number): DesignSize => this.#measure(child, width),
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
        this.#positions.set(node.id, local);
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
