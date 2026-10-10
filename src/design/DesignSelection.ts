// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignDocument, DesignNode, DesignBox } from './DesignTypes.js';
import { DesignOperationKind as Op, type DesignOperation } from './DesignOperationTypes.js';
import { DesignOperationCodec } from './DesignOperationCodec.js';
import { DesignSelectionContext as Context } from './DesignSelectionContext.js';
import { DesignSelectionTree as Tree } from './DesignSelectionTree.js';
import {
    DesignSelectionAction as Action,
    type DesignSelectionPlan,
    type DesignSelectionBounds,
    type DesignSelectionGeometry,
    type DesignArrangeRequest,
} from './DesignSelectionTypes.js';
import { DesignValues as V } from './DesignValues.js';
import { DesignBooleanSelection } from './DesignBooleanSelection.js';

interface PositionedLayer {
    readonly node: DesignNode;
    readonly box: DesignBox;
    readonly bounds: DesignSelectionBounds;
}

/** Pure atomic command planning keeps browser gestures and agent geometry identical. */
export class DesignSelection {
    /** Strict tool boundary validation never accepts caller-supplied owner identities. */
    public static request(raw: unknown): DesignArrangeRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'expectedRevision',
            'commandId',
            'pageId',
            'selection',
            'action',
        ]);
        return {
            id: V.id(value['id']),
            expectedRevision: V.revision(value['expectedRevision']),
            commandId: V.id(value['commandId']),
            pageId: V.id(value['pageId']),
            selection: V.list(value['selection'], 128, (id: unknown): string => V.id(id)),
            action: V.choice(value['action'], Object.values(Action)),
        };
    }
    /** Identity generation is supplied by the caller: random in the browser, deterministic in durable agent commands. */
    public static plan(
        document: DesignDocument,
        pageId: string,
        selection: readonly string[],
        action: Action,
        identify: (sourceId: string) => string,
    ): DesignSelectionPlan {
        const context: Context = new Context(document, pageId, selection);
        let plan: DesignSelectionPlan;
        if (action === Action.Duplicate) {
            plan = Tree.duplicate(context, identify);
        } else if (action === Action.Group) {
            plan = Tree.group(context, identify('group'));
        } else if (action === Action.Ungroup) {
            plan = Tree.ungroup(context);
        } else if (
            action === Action.Union ||
            action === Action.Subtract ||
            action === Action.Intersect ||
            action === Action.Exclude
        ) {
            plan = DesignBooleanSelection.plan(context, action, identify('boolean'));
        } else if (action === Action.Flatten) {
            plan = DesignBooleanSelection.flatten(context);
        } else if (action === Action.Front || action === Action.Back) {
            plan = this.#order(context, action === Action.Front);
        } else {
            plan = this.#arrange(context, action);
        }
        return {
            operations: DesignOperationCodec.operations(plan.operations),
            selection: plan.selection,
        };
    }
    /** Layer drops preserve current world-space rotation, position and size in the destination frame. */
    public static move(
        document: DesignDocument,
        pageId: string,
        selection: readonly string[],
        parentId: string | null,
        index: number,
    ): DesignSelectionPlan {
        V.number(index, 0, 10000, true);
        const plan: DesignSelectionPlan = Tree.move(
            new Context(document, pageId, selection),
            parentId,
            index,
        );
        return {
            operations: DesignOperationCodec.operations(plan.operations),
            selection: plan.selection,
        };
    }
    static #order(context: Context, front: boolean): DesignSelectionPlan {
        const operations: DesignOperation[] = [];
        const containers: Map<string | null, DesignNode[]> = new Map();
        for (const node of context.roots) {
            const group: DesignNode[] = containers.get(node.parentId) ?? [];
            group.push(node);
            containers.set(node.parentId, group);
        }
        for (const [parentId, nodes] of containers) {
            const siblings: string[] = [...context.siblings(parentId)];
            for (const node of front ? nodes : nodes.toReversed()) {
                siblings.splice(siblings.indexOf(node.id), 1);
                const index: number = front ? siblings.length : 0;
                siblings.splice(index, 0, node.id);
                operations.push({
                    op: Op.Move,
                    id: node.id,
                    parentId,
                    pageId: context.pageId,
                    index,
                });
            }
        }
        return { operations, selection: context.roots.map((node: DesignNode): string => node.id) };
    }
    static #arrange(context: Context, action: Action): DesignSelectionPlan {
        const horizontal: boolean =
            action === Action.Left ||
            action === Action.Center ||
            action === Action.Right ||
            action === Action.DistributeHorizontal;
        const distribute: boolean =
            action === Action.DistributeHorizontal || action === Action.DistributeVertical;
        if (context.roots.length < (distribute ? 3 : 2)) {
            throw new Error(
                distribute
                    ? 'Select at least three layers to distribute.'
                    : 'Select at least two layers to align.',
            );
        }
        const positioned: PositionedLayer[] = context.roots.map(
            (node: DesignNode): PositionedLayer => {
                const box: DesignBox = context.box(node.id);
                return { node, box, bounds: Context.bounds(box) };
            },
        );
        const lower: (entry: PositionedLayer) => number = (entry: PositionedLayer): number =>
            horizontal ? entry.bounds.left : entry.bounds.top;
        const upper: (entry: PositionedLayer) => number = (entry: PositionedLayer): number =>
            horizontal ? entry.bounds.right : entry.bounds.bottom;
        const start: number = Math.min(...positioned.map(lower));
        const end: number = Math.max(...positioned.map(upper));
        const operations: DesignOperation[] = [];
        if (distribute) {
            positioned.sort(
                (a: PositionedLayer, b: PositionedLayer): number => lower(a) - lower(b),
            );
        }
        const first: PositionedLayer | undefined = positioned[0];
        const last: PositionedLayer | undefined = positioned.at(-1);
        const gap: number =
            first === undefined || last === undefined
                ? 0
                : (upper(last) -
                      lower(first) -
                      positioned.reduce(
                          (sum: number, entry: PositionedLayer): number =>
                              sum + upper(entry) - lower(entry),
                          0,
                      )) /
                  (positioned.length - 1);
        let cursor: number = first === undefined ? 0 : lower(first);
        for (const [index, entry] of positioned.entries()) {
            const extent: number = upper(entry) - lower(entry);
            const target: number = distribute
                ? cursor
                : action === Action.Left || action === Action.Top
                  ? start
                  : action === Action.Right || action === Action.Bottom
                    ? end - extent
                    : (start + end - extent) / 2;
            cursor += extent + gap;
            if (distribute && (index === 0 || index === positioned.length - 1)) {
                continue;
            }
            const delta: number = target - lower(entry);
            if (Math.abs(delta) < 0.000001) {
                continue;
            }
            const box: DesignSelectionGeometry = context.local(
                {
                    ...entry.box,
                    x: entry.box.x + (horizontal ? delta : 0),
                    y: entry.box.y + (horizontal ? 0 : delta),
                },
                entry.node.parentId,
            );
            operations.push({
                op: Op.Update,
                id: entry.node.id,
                changes: { ...box, placement: Tree.fixed(entry.node, true) },
            });
        }
        if (operations.length === 0) {
            throw new Error('The selected layers are already arranged.');
        }
        return { operations, selection: context.roots.map((node: DesignNode): string => node.id) };
    }
}
