// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignKind, type DesignNode, type DesignBox, type DesignOverride } from './DesignTypes.js';
import type { DesignScaleOperation, DesignOperation } from './DesignOperationTypes.js';
import { DesignOperationKind } from './DesignOperationTypes.js';
import { DesignScaleMetrics } from './DesignScaleMetrics.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignWorldPositions } from './DesignWorldPositions.js';
import { DesignPaths } from './DesignPaths.js';
import type { DesignSelectionBounds } from './DesignSelectionTypes.js';

/** One source forest scales typography, effects and layout while retaining linked definitions and one native undo. */
export class DesignScaleEdits {
    public constructor(public readonly context: DesignSelectionContext) {}
    public apply(operation: DesignScaleOperation): readonly DesignNode[] {
        if (operation.factor === 1) {
            return [];
        }
        const boxes: readonly DesignBox[] = this.context.roots.map((node: DesignNode): DesignBox =>
            this.context.box(node.id),
        );
        const first: DesignBox | undefined = boxes[0];
        if (first === undefined) {
            throw new Error('Select a visible layer to scale.');
        }
        let bounds: DesignSelectionBounds = DesignSelectionContext.bounds(first);
        for (const box of boxes.slice(1)) {
            const area: DesignSelectionBounds = DesignSelectionContext.bounds(box);
            bounds = {
                left: Math.min(bounds.left, area.left),
                top: Math.min(bounds.top, area.top),
                right: Math.max(bounds.right, area.right),
                bottom: Math.max(bounds.bottom, area.bottom),
            };
        }
        const x: number = operation.pivotX ?? bounds.left;
        const y: number = operation.pivotY ?? bounds.top;
        const captured: Map<string, DesignNode> = new Map();
        const pending: string[] = this.context.roots.map((node: DesignNode): string => node.id);
        while (pending.length > 0) {
            const id: string | undefined = pending.pop();
            if (id === undefined) {
                break;
            }
            if (captured.has(id)) {
                throw new Error('Invalid scale forest.');
            }
            const node: DesignNode = this.context.node(id);
            captured.set(id, DesignScaleMetrics.node(node, operation.factor));
            pending.push(...node.children);
        }
        // A selected definition already supplies scaled artwork. Compensate dependent instances so each visible forest scales once.
        const scaledIds: ReadonlySet<string> = new Set(captured.keys());
        for (const original of this.context.document.nodes) {
            if (
                original.kind !== DesignKind.Instance ||
                original.componentId === null ||
                !scaledIds.has(original.componentId)
            ) {
                continue;
            }
            const selected: boolean = scaledIds.has(original.id);
            const current: DesignNode = captured.get(original.id) ?? original;
            const properties: DesignNode = DesignPaths.resize(current, { contentScale: null });
            captured.set(original.id, {
                ...properties,
                ...(selected && original.contentScale === undefined
                    ? {}
                    : {
                          contentScale: selected
                              ? (original.contentScale ?? 1)
                              : (original.contentScale ?? 1) / operation.factor,
                      }),
                placement: {
                    ...current.placement,
                    ...(original.placement.contentReferenceWidth === undefined
                        ? {}
                        : {
                              contentReferenceWidth:
                                  original.placement.contentReferenceWidth * operation.factor,
                          }),
                    ...(original.placement.contentReferenceHeight === undefined
                        ? {}
                        : {
                              contentReferenceHeight:
                                  original.placement.contentReferenceHeight * operation.factor,
                          }),
                },
                overrides: original.overrides.map((entry: DesignOverride): DesignOverride => ({
                    ...entry,
                    style:
                        entry.style === null
                            ? null
                            : DesignScaleMetrics.style(entry.style, operation.factor),
                })),
            });
        }
        const targets: readonly DesignBox[] = boxes.map((box: DesignBox): DesignBox => ({
            ...box,
            x: x + (box.x - x) * operation.factor,
            y: y + (box.y - y) * operation.factor,
            width: box.width * operation.factor,
            height: box.height * operation.factor,
        }));
        const operations: readonly DesignOperation[] = new DesignWorldPositions(
            this.context,
            targets,
            captured,
            null,
            true,
        ).operations();
        return operations.map((edit: DesignOperation): DesignNode => {
            if (edit.op !== DesignOperationKind.Update) {
                throw new Error('Artwork scaling requires captured layer updates.');
            }
            return DesignPaths.resize(
                captured.get(edit.id) ?? this.context.node(edit.id),
                edit.changes,
            );
        });
    }
}
