// SPDX-License-Identifier: Apache-2.0

import {
    DesignConstraint,
    DesignKind,
    DesignSizing,
    type DesignBox,
    type DesignDocument,
    type DesignNode,
} from './DesignTypes.js';
import type {
    DesignSelectionGeometry,
    DesignSelectionPoint as Point,
} from './DesignSelectionTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignPositionEdits } from './DesignPositionEdits.js';
import { DesignOperationKind, type DesignOperation } from './DesignOperationTypes.js';
import { DesignLayoutEngine } from './DesignLayout.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignPositionReferences } from './DesignPositionReferences.js';

interface Target {
    readonly node: DesignNode;
    readonly box: DesignBox;
    readonly captured: DesignNode;
}
interface Anchor {
    readonly node: DesignNode;
    readonly corner: Point;
}

/** World arrangements capture a forest together and keep reflowing frames' transformed origins stable. */
export class DesignWorldPositions {
    readonly #nodes: Map<string, DesignNode>;
    readonly #targets: readonly Target[];
    readonly #anchors: readonly Anchor[];
    readonly #changed: Set<string> = new Set();

    /** Captured resize records seed the new geometry while freely positioned ancestor origins come from the original scene. */
    public constructor(
        public readonly context: DesignSelectionContext,
        targets: readonly DesignBox[],
        captured: ReadonlyMap<string, DesignNode> = new Map(),
        captureContext: DesignSelectionContext | null = null,
        dimensions: boolean = false,
    ) {
        this.#nodes = new Map(context.nodes);
        for (const [id, node] of captured) {
            context.node(id);
            this.#nodes.set(id, node);
            this.#changed.add(id);
        }
        const working: DesignSelectionContext =
            captured.size === 0
                ? context
                : new DesignSelectionContext(
                      { ...context.document, nodes: [...this.#nodes.values()] },
                      context.pageId,
                      context.roots.map((node: DesignNode): string => node.id),
                      context.measurer,
                  );
        const measurements: DesignSelectionContext = captureContext ?? working;
        const capture: DesignPositionEdits = new DesignPositionEdits(measurements);
        this.#targets = targets.map((box: DesignBox): Target => {
            const node: DesignNode = measurements.node(box.id);
            if (working.flowing(node.id)) {
                throw new Error(
                    'Auto layout controls this position. Enable absolute positioning before manually arranging these layers.',
                );
            }
            const local: DesignSelectionGeometry = measurements.local(box, node.parentId);
            const positioned: DesignNode = capture.capture({
                op: DesignOperationKind.Position,
                id: node.id,
                pageId: context.pageId,
                x: local.x,
                y: local.y,
            });
            const natural: DesignSelectionGeometry = {
                ...measurements.measure(node.id),
                x: 0,
                y: 0,
                rotation: 0,
            };
            const sized: DesignNode = dimensions
                ? DesignPaths.resize(positioned, {
                      width: box.width > 0 ? box.width : positioned.width,
                      height: box.height > 0 ? box.height : positioned.height,
                      placement: {
                          ...positioned.placement,
                          width:
                              positioned.placement.width === DesignSizing.Hug &&
                              Math.abs(natural.width - box.width) > 0.000001
                                  ? DesignSizing.Fixed
                                  : positioned.placement.width,
                          height:
                              positioned.placement.height === DesignSizing.Hug &&
                              Math.abs(natural.height - box.height) > 0.000001
                                  ? DesignSizing.Fixed
                                  : positioned.placement.height,
                          ...(node.kind === DesignKind.Instance || positioned.width === box.width
                              ? {}
                              : {
                                    contentReferenceWidth:
                                        positioned.placement.contentReferenceWidth ??
                                        positioned.width,
                                }),
                          ...(node.kind === DesignKind.Instance || positioned.height === box.height
                              ? {}
                              : {
                                    contentReferenceHeight:
                                        positioned.placement.contentReferenceHeight ??
                                        positioned.height,
                                }),
                      },
                  })
                : positioned;
            return {
                node,
                box,
                captured: {
                    ...sized,
                    rotation:
                        DesignWorldPositions.#angle(
                            box.rotation - context.box(node.id).rotation,
                        ) === 0
                            ? node.rotation
                            : DesignWorldPositions.#angle(local.rotation),
                },
            };
        });
        const ancestors: Set<string> = new Set();
        for (const root of context.roots) {
            let id: string | null = root.parentId;
            while (id !== null) {
                ancestors.add(id);
                id = context.node(id).parentId;
            }
        }
        this.#anchors = [...ancestors]
            .map((id: string): DesignNode => context.node(id))
            .filter(
                (node: DesignNode): boolean =>
                    !context.flowing(node.id) && context.boxes.has(node.id),
            )
            .map((node: DesignNode): Anchor => ({
                node,
                corner: DesignSelectionContext.corner(context.box(node.id)),
            }));
        for (const target of this.#targets) {
            if (!DesignWorldPositions.#same(context.box(target.node.id), target.box)) {
                this.#nodes.set(target.node.id, target.captured);
                this.#changed.add(target.node.id);
            }
        }
    }

    /** Produces one bounded atomic save; a failed solve leaves the saved document untouched. */
    public operations(): readonly DesignOperation[] {
        for (let iteration: number = 0; iteration < 64; iteration++) {
            const boxes: ReadonlyMap<string, DesignBox> = this.#boxes();
            if (
                this.#targets.every((target: Target): boolean =>
                    DesignWorldPositions.#same(this.#box(boxes, target.node.id), target.box),
                ) &&
                this.#anchors.every((anchor: Anchor): boolean =>
                    DesignWorldPositions.#point(
                        DesignSelectionContext.corner(this.#box(boxes, anchor.node.id)),
                        anchor.corner,
                    ),
                )
            ) {
                return [...this.#changed].map((id: string): DesignOperation => {
                    const node: DesignNode = this.#node(id);
                    return {
                        op: DesignOperationKind.Update,
                        id,
                        changes: {
                            x: node.x,
                            y: node.y,
                            width: node.width,
                            height: node.height,
                            rotation: node.rotation,
                            placement: node.placement,
                            ...(node.kind === DesignKind.Boolean ? {} : { path: node.path }),
                        },
                    };
                });
            }
            for (const anchor of this.#anchors) {
                let node: DesignNode = this.#node(anchor.node.id);
                const current: DesignBox = this.#box(boxes, node.id);
                const wanted: DesignBox = DesignSelectionContext.atCorner(current, anchor.corner);
                const parent: DesignBox | null =
                    node.parentId === null ? null : this.#parent(boxes, node.parentId);
                const local: Point = DesignSelectionContext.relative(wanted, parent);
                const sourceParent: DesignNode | null =
                    node.parentId === null ? null : this.#node(node.parentId);
                let x: number =
                    sourceParent === null || parent === null
                        ? local.x
                        : DesignWorldPositions.#authored(
                              local.x,
                              node.x,
                              node.placement.horizontal,
                              node.placement.referenceWidth ??
                                  sourceParent.placement.contentReferenceWidth ??
                                  sourceParent.width,
                              parent.width,
                          );
                let y: number =
                    sourceParent === null || parent === null
                        ? local.y
                        : DesignWorldPositions.#authored(
                              local.y,
                              node.y,
                              node.placement.vertical,
                              node.placement.referenceHeight ??
                                  sourceParent.placement.contentReferenceHeight ??
                                  sourceParent.height,
                              parent.height,
                          );
                /** Capture a shrinking parent's Scale baseline while retaining the ancestor's pins and sizing. */
                const rebaseX: boolean =
                    parent !== null &&
                    parent.width >= 0.01 &&
                    Math.abs(x) > 100000 &&
                    node.placement.horizontal === DesignConstraint.Scale;
                const rebaseY: boolean =
                    parent !== null &&
                    parent.height >= 0.01 &&
                    Math.abs(y) > 100000 &&
                    node.placement.vertical === DesignConstraint.Scale;
                if (rebaseX || rebaseY) {
                    node = {
                        ...node,
                        placement: {
                            ...node.placement,
                            ...(rebaseX && parent !== null ? { referenceWidth: parent.width } : {}),
                            ...(rebaseY && parent !== null
                                ? { referenceHeight: parent.height }
                                : {}),
                        },
                    };
                    if (rebaseX) {
                        x = local.x;
                    }
                    if (rebaseY) {
                        y = local.y;
                    }
                    this.#nodes.set(node.id, node);
                    this.#changed.add(node.id);
                }
                /** Relax origin corrections when nested Hug extents feed back into parent constraints. */
                const nextX: number = iteration === 0 ? x : (node.x + x) / 2;
                const nextY: number = iteration === 0 ? y : (node.y + y) / 2;
                if (
                    Math.abs(node.x - x) > 0.000000000001 ||
                    Math.abs(node.y - y) > 0.000000000001
                ) {
                    this.#nodes.set(node.id, { ...node, x: nextX, y: nextY });
                    this.#changed.add(node.id);
                }
            }
            for (const target of this.#targets) {
                const current: DesignBox = this.#box(boxes, target.node.id);
                if (
                    !this.#changed.has(target.node.id) &&
                    DesignWorldPositions.#same(current, target.box)
                ) {
                    continue;
                }
                const parent: DesignBox | null =
                    target.node.parentId === null
                        ? null
                        : this.#parent(boxes, target.node.parentId);
                const local: Point = DesignSelectionContext.relative(target.box, parent);
                this.#nodes.set(target.node.id, {
                    ...target.captured,
                    rotation:
                        DesignWorldPositions.#angle(
                            target.box.rotation - this.context.box(target.node.id).rotation,
                        ) === 0
                            ? target.node.rotation
                            : DesignWorldPositions.#angle(
                                  target.box.rotation - (parent?.rotation ?? 0),
                              ),
                    x:
                        parent?.width === 0 &&
                        target.node.placement.horizontal === DesignConstraint.Scale
                            ? target.node.x
                            : local.x,
                    y:
                        parent?.height === 0 &&
                        target.node.placement.vertical === DesignConstraint.Scale
                            ? target.node.y
                            : local.y,
                    placement: {
                        ...target.captured.placement,
                        ...DesignPositionReferences.capture(
                            target.node,
                            target.node.parentId === null
                                ? null
                                : this.context.node(target.node.parentId),
                            target.node.parentId === null
                                ? null
                                : this.context.position(target.node.parentId),
                            parent,
                            target.box,
                        ),
                    },
                });
                this.#changed.add(target.node.id);
            }
        }
        throw new Error(
            'The automatic containers cannot retain these world positions. Make the affected container dimensions fixed before arranging.',
        );
    }

    #boxes(): ReadonlyMap<string, DesignBox> {
        const document: DesignDocument = {
            ...this.context.document,
            nodes: [...this.#nodes.values()],
        };
        return new Map(
            new DesignLayoutEngine(document, this.context.pageId, this.context.measurer)
                .solve()
                .boxes.map((box: DesignBox): readonly [string, DesignBox] => [box.id, box]),
        );
    }
    #parent(boxes: ReadonlyMap<string, DesignBox>, id: string): DesignBox {
        const box: DesignBox = this.#box(boxes, id);
        const anchor: Anchor | undefined = this.#anchors.find(
            (anchor: Anchor): boolean => anchor.node.id === id,
        );
        return anchor === undefined ? box : DesignSelectionContext.atCorner(box, anchor.corner);
    }
    #node(id: string): DesignNode {
        const node: DesignNode | undefined = this.#nodes.get(id);
        if (node === undefined) {
            throw new Error('Missing arranged layer ' + id);
        }
        return node;
    }
    #box(boxes: ReadonlyMap<string, DesignBox>, id: string): DesignBox {
        const box: DesignBox | undefined = boxes.get(id);
        if (box === undefined) {
            throw new Error('Show the selected layers before arranging their geometry.');
        }
        return box;
    }
    static #authored(
        position: number,
        previous: number,
        pin: DesignConstraint,
        reference: number,
        available: number,
    ): number {
        if (pin === DesignConstraint.Center) {
            return position - (available - reference) / 2;
        }
        if (pin === DesignConstraint.End) {
            return position - available + reference;
        }
        if (pin === DesignConstraint.Scale) {
            if (available === 0) {
                if (Math.abs(position) > 0.00000001) {
                    throw new Error('Expand the collapsed parent axis before arranging.');
                }
                return previous;
            }
            return (position * reference) / available;
        }
        return position;
    }
    static #point(a: Point, b: Point): boolean {
        return Math.abs(a.x - b.x) < 0.00000001 && Math.abs(a.y - b.y) < 0.00000001;
    }
    static #angle(angle: number): number {
        return ((((angle + 180) % 360) + 360) % 360) - 180;
    }
    static #same(a: DesignBox, b: DesignBox): boolean {
        return (
            this.#point(a, b) &&
            Math.abs(a.width - b.width) < 0.00000001 &&
            Math.abs(a.height - b.height) < 0.00000001 &&
            Math.abs(this.#angle(a.rotation - b.rotation)) < 0.00000001
        );
    }
}
