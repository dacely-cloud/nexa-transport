// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';
import { DesignOperationKind as Op, type DesignOperation } from './DesignOperationTypes.js';
import type { DesignSelectionPlan, DesignSelectionGeometry } from './DesignSelectionTypes.js';
import {
    DesignKind,
    DesignFlow,
    DesignSizing,
    DesignAlign,
    type DesignNode,
    type DesignLayout,
    type DesignBox,
} from './DesignTypes.js';
import type { DesignSize } from './DesignLayoutTypes.js';

interface LayoutChild {
    readonly node: DesignNode;
    readonly box: DesignSelectionGeometry;
}

/** Converts visible sibling geometry into one editable row or column without copying text bodies. */
export class DesignAutoLayout {
    /** Existing frames, groups and component definitions retain their identity; other selections get a new frame. */
    public static plan(context: DesignSelectionContext, id: string): DesignSelectionPlan {
        const first: DesignNode | undefined = context.roots[0];
        if (first === undefined) {
            throw new Error('Select layers to add auto layout.');
        }
        const existing: boolean =
            context.roots.length === 1 &&
            [DesignKind.Frame, DesignKind.Group, DesignKind.Component].some(
                (kind: DesignKind): boolean => kind === first.kind,
            );
        let container: DesignNode;
        let insertion: DesignOperation | null = null;
        let children: LayoutChild[];
        if (existing) {
            if (first.layout.flow !== DesignFlow.Absolute) {
                throw new Error('This container already uses auto layout.');
            }
            container = first;
            children = first.children.flatMap((childId: string): LayoutChild[] => {
                const node: DesignNode = context.node(childId);
                const box: DesignBox | undefined = context.boxes.get(childId);
                if (box === undefined || !node.visible) {
                    return [];
                }
                if (node.locked) {
                    throw new Error('Unlock the container’s children before adding auto layout.');
                }
                return [{ node, box: context.local(box, first.id) }];
            });
        } else {
            const grouped: DesignSelectionPlan = DesignSelectionTree.group(context, id);
            const operation: DesignOperation | undefined = grouped.operations[0];
            if (operation?.op !== Op.Insert) {
                throw new Error('Missing auto layout frame.');
            }
            insertion = operation;
            container = operation.node;
            children = context.roots.map((node: DesignNode): LayoutChild => {
                const box: DesignSelectionGeometry = context.local(
                    context.box(node.id),
                    node.parentId,
                );
                return { node, box: { ...box, x: box.x - container.x, y: box.y - container.y } };
            });
        }
        if (children.length > 128) {
            throw new Error('Add auto layout to at most 128 visible children per command.');
        }
        const row: boolean = this.#row(children);
        children.sort(
            (a: LayoutChild, b: LayoutChild): number =>
                (row ? a.box.x - b.box.x : a.box.y - b.box.y) ||
                (row ? a.box.y - b.box.y : a.box.x - b.box.x),
        );
        const size: DesignSelectionGeometry = existing
            ? context.local(context.box(container.id), container.parentId)
            : container;
        const layout: DesignLayout = this.#layout(container.layout, children, size, row, existing);
        const changes: DesignNode = {
            ...container,
            kind: container.kind === DesignKind.Group ? DesignKind.Frame : container.kind,
            name: existing ? container.name : 'Auto layout',
            layout,
            width: size.width,
            height: size.height,
            placement: existing
                ? container.placement
                : {
                      ...container.placement,
                      width: DesignSizing.Hug,
                      height: DesignSizing.Hug,
                  },
        };
        const operations: DesignOperation[] =
            insertion?.op === Op.Insert
                ? [{ ...insertion, node: changes }]
                : [
                      {
                          op: Op.Update,
                          id: container.id,
                          changes: {
                              kind: changes.kind,
                              layout,
                              width: size.width,
                              height: size.height,
                          },
                      },
                  ];
        for (let index: number = 0; index < children.length; index++) {
            const child: LayoutChild | undefined = children[index];
            if (child === undefined) {
                throw new Error('Missing auto layout child.');
            }
            const natural: DesignSize = context.measure(child.node.id);
            operations.push(
                {
                    op: Op.Move,
                    id: child.node.id,
                    parentId: container.id,
                    pageId: context.pageId,
                    index,
                },
                {
                    op: Op.Update,
                    id: child.node.id,
                    changes: {
                        ...child.box,
                        placement: {
                            ...DesignSelectionTree.fixed(child.node, false),
                            width:
                                child.node.placement.width === DesignSizing.Hug &&
                                Math.abs(natural.width - child.box.width) < 0.000001
                                    ? DesignSizing.Hug
                                    : DesignSizing.Fixed,
                            height:
                                child.node.placement.height === DesignSizing.Hug &&
                                Math.abs(natural.height - child.box.height) < 0.000001
                                    ? DesignSizing.Hug
                                    : DesignSizing.Fixed,
                        },
                    },
                },
            );
        }
        return { operations, selection: [container.id] };
    }

    static #row(children: readonly LayoutChild[]): boolean {
        if (children.length < 2) {
            return true;
        }
        const xs: number[] = children.map(
            (child: LayoutChild): number => child.box.x + child.box.width / 2,
        );
        const ys: number[] = children.map(
            (child: LayoutChild): number => child.box.y + child.box.height / 2,
        );
        return Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys);
    }

    static #layout(
        previous: DesignLayout,
        children: readonly LayoutChild[],
        size: DesignSelectionGeometry,
        row: boolean,
        existing: boolean,
    ): DesignLayout {
        const gaps: number[] = children
            .slice(1)
            .map((child: LayoutChild, index: number): number => {
                const before: LayoutChild | undefined = children[index];
                if (before === undefined) {
                    throw new Error('Missing auto layout neighbor.');
                }
                return Math.max(
                    0,
                    row
                        ? child.box.x - before.box.x - before.box.width
                        : child.box.y - before.box.y - before.box.height,
                );
            })
            .sort((a: number, b: number): number => a - b);
        const gap: number = gaps[Math.floor(gaps.length / 2)] ?? 8;
        const left: number =
            children.length === 0
                ? previous.padding.left
                : Math.max(
                      0,
                      Math.min(...children.map((child: LayoutChild): number => child.box.x)),
                  );
        const top: number =
            children.length === 0
                ? previous.padding.top
                : Math.max(
                      0,
                      Math.min(...children.map((child: LayoutChild): number => child.box.y)),
                  );
        const right: number =
            children.length === 0
                ? previous.padding.right
                : Math.max(
                      0,
                      size.width -
                          Math.max(
                              ...children.map(
                                  (child: LayoutChild): number => child.box.x + child.box.width,
                              ),
                          ),
                  );
        const bottom: number =
            children.length === 0
                ? previous.padding.bottom
                : Math.max(
                      0,
                      size.height -
                          Math.max(
                              ...children.map(
                                  (child: LayoutChild): number => child.box.y + child.box.height,
                              ),
                          ),
                  );
        return {
            ...previous,
            flow: row ? DesignFlow.Row : DesignFlow.Column,
            wrap: false,
            gap,
            rowGap: gap,
            justify: DesignAlign.Start,
            align: DesignAlign.Start,
            padding: existing
                ? { left, top, right, bottom }
                : { left: 0, top: 0, right: 0, bottom: 0 },
        };
    }
}
