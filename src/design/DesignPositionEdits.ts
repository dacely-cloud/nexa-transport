// SPDX-License-Identifier: Apache-2.0

import {
    DesignFlow,
    DesignSizing,
    DesignConstraint,
    DesignKind,
    type DesignNode,
    type DesignPlacement,
} from './DesignTypes.js';
import type { DesignPositionOperation } from './DesignOperationTypes.js';
import type { DesignSelectionGeometry } from './DesignSelectionTypes.js';
import type { DesignSize } from './DesignLayoutTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignLayoutEngine } from './DesignLayout.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignPositionReferences } from './DesignPositionReferences.js';

/** Visible coordinate edits capture constraint baselines without changing descendant geometry. */
export class DesignPositionEdits {
    readonly #changes: Map<string, DesignNode> = new Map();
    public constructor(public readonly context: DesignSelectionContext) {}

    public apply(operation: DesignPositionOperation): readonly DesignNode[] {
        return this.#apply(operation, false);
    }

    /** Batch world arrangement captures the original geometry before any sibling changes layout. */
    public capture(operation: DesignPositionOperation): DesignNode {
        const result: DesignNode | undefined = this.#apply(operation, true)[0];
        if (result === undefined) {
            throw new Error('Cannot capture a flowing layer for manual arrangement.');
        }
        return result;
    }

    #apply(operation: DesignPositionOperation, capture: boolean): readonly DesignNode[] {
        this.#changes.clear();
        const node: DesignNode = this.context.node(operation.id);
        const geometry: DesignSelectionGeometry = this.#geometry(node);
        const parent: DesignNode | null =
            node.parentId === null ? null : this.context.node(node.parentId);
        const parentGeometry: DesignSelectionGeometry | null =
            parent === null ? null : this.#geometry(parent);
        const flowing: boolean = parent !== null && parent.layout.flow !== DesignFlow.Absolute;
        if (
            parent === null &&
            (operation.horizontal !== undefined || operation.vertical !== undefined)
        ) {
            throw new Error('Pins require a parent frame.');
        }
        if (flowing && !(operation.absolute ?? node.placement.absolute)) {
            if (
                operation.x !== undefined ||
                operation.y !== undefined ||
                operation.horizontal !== undefined ||
                operation.vertical !== undefined
            ) {
                throw new Error(
                    'Auto layout controls this position. Reorder the layer or enable absolute positioning.',
                );
            }
            return node.placement.absolute
                ? [{ ...node, placement: { ...node.placement, absolute: false } }]
                : [];
        }
        const x: number = operation.x ?? geometry.x;
        const y: number = operation.y ?? geometry.y;
        const horizontal: DesignConstraint = operation.horizontal ?? node.placement.horizontal;
        const vertical: DesignConstraint = operation.vertical ?? node.placement.vertical;
        if (
            !capture &&
            Math.abs(x - geometry.x) < 0.000001 &&
            Math.abs(y - geometry.y) < 0.000001 &&
            horizontal === node.placement.horizontal &&
            vertical === node.placement.vertical &&
            (operation.absolute === undefined || operation.absolute === node.placement.absolute)
        ) {
            return [];
        }
        const natural: DesignSize = this.context.measure(node.id);
        const placement: DesignPlacement = {
            ...node.placement,
            horizontal,
            vertical,
            absolute: operation.absolute ?? node.placement.absolute,
            width:
                geometry.width > 0 &&
                ((node.placement.width === DesignSizing.Hug &&
                    Math.abs(natural.width - geometry.width) > 0.000001) ||
                    (flowing &&
                        !node.placement.absolute &&
                        node.placement.width === DesignSizing.Fill))
                    ? DesignSizing.Fixed
                    : node.placement.width,
            height:
                geometry.height > 0 &&
                ((node.placement.height === DesignSizing.Hug &&
                    Math.abs(natural.height - geometry.height) > 0.000001) ||
                    (flowing &&
                        !node.placement.absolute &&
                        node.placement.height === DesignSizing.Fill))
                    ? DesignSizing.Fixed
                    : node.placement.height,
            ...DesignPositionReferences.capture(
                node,
                parent,
                parentGeometry,
                parentGeometry,
                geometry,
            ),
        };
        this.#collapsed(
            geometry.width,
            x,
            horizontal,
            node.placement.horizontal,
            parentGeometry?.width ?? null,
            node.placement.maxWidth,
        );
        this.#collapsed(
            geometry.height,
            y,
            vertical,
            node.placement.vertical,
            parentGeometry?.height ?? null,
            node.placement.maxHeight,
        );
        const collapsedX: boolean =
            horizontal === DesignConstraint.Scale && parentGeometry?.width === 0;
        const collapsedY: boolean =
            vertical === DesignConstraint.Scale && parentGeometry?.height === 0;
        let next: DesignNode = DesignPaths.resize(node, {
            x: collapsedX ? node.x : x,
            y: collapsedY ? node.y : y,
            width: geometry.width > 0 ? geometry.width : node.width,
            height: geometry.height > 0 ? geometry.height : node.height,
            placement,
        });
        next = this.#baselines(node, next);
        this.#changes.set(node.id, next);
        let layout: DesignLayoutEngine = this.#layout();
        const measured: DesignSize = layout.measure(node.id);
        // Normalizing a constrained width can change wrapped content's natural height.
        if (
            (geometry.width > 0 &&
                next.placement.width === DesignSizing.Hug &&
                Math.abs(measured.width - geometry.width) > 0.000001) ||
            (geometry.height > 0 &&
                next.placement.height === DesignSizing.Hug &&
                Math.abs(measured.height - geometry.height) > 0.000001)
        ) {
            next = {
                ...next,
                placement: {
                    ...next.placement,
                    width:
                        geometry.width > 0 &&
                        next.placement.width === DesignSizing.Hug &&
                        Math.abs(measured.width - geometry.width) > 0.000001
                            ? DesignSizing.Fixed
                            : next.placement.width,
                    height:
                        geometry.height > 0 &&
                        next.placement.height === DesignSizing.Hug &&
                        Math.abs(measured.height - geometry.height) > 0.000001
                            ? DesignSizing.Fixed
                            : next.placement.height,
                },
            };
            this.#changes.set(node.id, next);
            layout = this.#layout();
        }
        const parentSize: DesignSize | undefined =
            parent === null ? undefined : layout.position(parent.id);
        if (parentSize !== undefined) {
            next = {
                ...next,
                placement: {
                    ...next.placement,
                    ...DesignPositionReferences.capture(
                        node,
                        parent,
                        parentGeometry,
                        parentSize,
                        geometry,
                    ),
                },
            };
            this.#changes.set(node.id, next);
        }
        return [...this.#changes.values()];
    }

    #collapsed(
        size: number,
        position: number,
        pin: DesignConstraint,
        previous: DesignConstraint,
        available: number | null,
        maximum: number,
    ): void {
        if (
            (pin === DesignConstraint.Scale &&
                available === 0 &&
                (Math.abs(position) > 0.000001 || size !== 0)) ||
            (size === 0 && maximum > 0 && pin !== previous)
        ) {
            throw new Error(
                'Expand the collapsed parent axis before positioning or changing this pin.',
            );
        }
    }

    #baselines(before: DesignNode, after: DesignNode): DesignNode {
        if (before.children.length === 0 && before.kind !== DesignKind.Instance) {
            return after;
        }
        return {
            ...after,
            placement: {
                ...after.placement,
                ...(before.width !== after.width
                    ? {
                          contentReferenceWidth:
                              before.placement.contentReferenceWidth ?? before.width,
                      }
                    : {}),
                ...(before.height !== after.height
                    ? {
                          contentReferenceHeight:
                              before.placement.contentReferenceHeight ?? before.height,
                      }
                    : {}),
            },
        };
    }
    #layout(): DesignLayoutEngine {
        return new DesignLayoutEngine(
            {
                ...this.context.document,
                nodes: this.context.document.nodes.map(
                    (node: DesignNode): DesignNode => this.#changes.get(node.id) ?? node,
                ),
            },
            this.context.pageId,
            this.context.measurer,
        );
    }
    #geometry(node: DesignNode): DesignSelectionGeometry {
        return { ...this.context.position(node.id), rotation: node.rotation };
    }
}
