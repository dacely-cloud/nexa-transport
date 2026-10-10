// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignSelectionContext as Context } from './DesignSelectionContext.js';
import {
    DesignKind,
    DesignFlow,
    DesignSizing,
    DesignConstraint,
    type DesignNode,
    type DesignInteraction,
} from './DesignTypes.js';
import { DesignOperationKind as Op, type DesignOperation } from './DesignOperationTypes.js';
import type {
    DesignSelectionPlan,
    DesignSelectionGeometry,
    DesignSelectionBounds,
} from './DesignSelectionTypes.js';

/** Tree edits preserve authored identities, instance references, ordering and resolved geometry. */
export class DesignSelectionTree {
    /** Clones an entire selected forest once, including internal instance overrides and prototype links. */
    public static duplicate(
        context: Context,
        identify: (sourceId: string) => string,
    ): DesignSelectionPlan {
        const source: DesignNode[] = [];
        const pending: string[] = context.roots
            .map((node: DesignNode): string => node.id)
            .toReversed();
        while (pending.length > 0) {
            const id: string | undefined = pending.pop();
            if (id === undefined) {
                break;
            }
            const node: DesignNode = context.node(id);
            source.push(node);
            if (source.length > 255) {
                throw new Error('Duplicate at most 255 layers per command.');
            }
            pending.push(...node.children.toReversed());
        }
        const remap: ReadonlyMap<string, string> = new Map(
            source.map((node: DesignNode): readonly [string, string] => [
                node.id,
                identify(node.id),
            ]),
        );
        const roots: ReadonlySet<string> = new Set(
            context.roots.map((node: DesignNode): string => node.id),
        );
        const ordered: Map<string | null, string[]> = new Map();
        const operations: DesignOperation[] = [];
        for (const node of source) {
            const id: string | undefined = remap.get(node.id);
            if (id === undefined) {
                throw new Error('Missing duplicate identity.');
            }
            const root: boolean = roots.has(node.id);
            const parentId: string | null = root
                ? node.parentId
                : (remap.get(node.parentId ?? '') ?? null);
            let index: number;
            if (root) {
                const siblings: string[] = ordered.get(parentId) ?? [...context.siblings(parentId)];
                index = siblings.indexOf(node.id) + 1;
                siblings.splice(index, 0, id);
                ordered.set(parentId, siblings);
            } else {
                const siblings: string[] = ordered.get(parentId) ?? [];
                index = siblings.length;
                siblings.push(id);
                ordered.set(parentId, siblings);
            }
            const copy: DesignNode = {
                ...node,
                id,
                name: root ? (node.name.slice(0, 154) + ' copy').toWellFormed() : node.name,
                parentId: null,
                children: [],
                x: node.x + (root ? 16 : 0),
                y: node.y + (root ? 16 : 0),
                componentId:
                    node.componentId === null
                        ? null
                        : (remap.get(node.componentId) ?? node.componentId),
                overrides: node.overrides.map((override): typeof override => ({
                    ...override,
                    nodeId: remap.get(override.nodeId) ?? override.nodeId,
                })),
            };
            operations.push({ op: Op.Insert, node: copy, parentId, pageId: context.pageId, index });
        }
        const links: readonly DesignInteraction[] = context.document.interactions.filter(
            (link): boolean => remap.has(link.nodeId),
        );
        if (links.length > 0) {
            operations.push({
                op: Op.Metadata,
                interactions: [
                    ...context.document.interactions,
                    ...links.map((link): typeof link => ({
                        ...link,
                        id: identify(link.id),
                        nodeId: remap.get(link.nodeId) ?? link.nodeId,
                        targetId: remap.get(link.targetId) ?? link.targetId,
                    })),
                ],
            });
        }
        return {
            operations,
            selection: context.roots.map(
                (node: DesignNode): string => remap.get(node.id) ?? node.id,
            ),
        };
    }
    /** Wraps sibling layers in one transparent group, preserving rotation and solved positions. */
    public static group(context: Context, id: string): DesignSelectionPlan {
        const first: DesignNode | undefined = context.roots[0];
        if (first === undefined) {
            throw new Error('Select layers to group.');
        }
        if (context.roots.some((node: DesignNode): boolean => node.parentId !== first.parentId)) {
            throw new Error('Group layers in the same container.');
        }
        const siblings: readonly string[] = context.siblings(first.parentId);
        const indices: number[] = context.roots.map((node: DesignNode): number =>
            siblings.indexOf(node.id),
        );
        const parent: DesignNode | null =
            first.parentId === null ? null : context.node(first.parentId);
        if (
            parent !== null &&
            parent.layout.flow !== DesignFlow.Absolute &&
            (context.roots.some(
                (node: DesignNode): boolean => node.placement.absolute !== first.placement.absolute,
            ) ||
                (!first.placement.absolute &&
                    (indices.some(
                        (index: number, offset: number): boolean =>
                            index !== (indices[0] ?? 0) + offset,
                    ) ||
                        context.roots.some(
                            (node: DesignNode): boolean => node.placement.absolute,
                        ))))
        ) {
            throw new Error('Group consecutive flowing layers in an auto layout container.');
        }
        const geometry: ReadonlyMap<string, DesignSelectionGeometry> = new Map(
            context.roots.map((node: DesignNode): readonly [string, DesignSelectionGeometry] => [
                node.id,
                context.local(context.box(node.id), first.parentId),
            ]),
        );
        const bounds: DesignSelectionBounds[] = [...geometry.values()].map(
            (box: DesignSelectionGeometry): DesignSelectionBounds => Context.bounds(box),
        );
        const left: number = Math.min(
            ...bounds.map((box: DesignSelectionBounds): number => box.left),
        );
        const top: number = Math.min(
            ...bounds.map((box: DesignSelectionBounds): number => box.top),
        );
        const width: number = Math.max(
            1,
            Math.max(...bounds.map((box: DesignSelectionBounds): number => box.right)) - left,
        );
        const height: number = Math.max(
            1,
            Math.max(...bounds.map((box: DesignSelectionBounds): number => box.bottom)) - top,
        );
        const template: DesignNode = DesignDefaults.node(id, DesignKind.Group, 'Group');
        const group: DesignNode = {
            ...template,
            x: left,
            y: top,
            width,
            height,
            placement: { ...template.placement, absolute: first.placement.absolute },
        };
        const operations: DesignOperation[] = [
            {
                op: Op.Insert,
                node: group,
                parentId: first.parentId,
                pageId: context.pageId,
                index: indices[0] ?? 0,
            },
        ];
        for (const [index, node] of context.roots.entries()) {
            const box: DesignSelectionGeometry | undefined = geometry.get(node.id);
            if (box === undefined) {
                throw new Error('Missing grouping geometry.');
            }
            operations.push(
                { op: Op.Move, id: node.id, parentId: id, pageId: context.pageId, index },
                {
                    op: Op.Update,
                    id: node.id,
                    changes: {
                        ...box,
                        x: box.x - left,
                        y: box.y - top,
                        placement: this.fixed(node, true),
                    },
                },
            );
        }
        return { operations, selection: [id] };
    }
    /** Removes transparent groups, retaining world transforms and composed opacity on their children. */
    public static ungroup(context: Context): DesignSelectionPlan {
        const operations: DesignOperation[] = [];
        const selection: string[] = [];
        const ordered: Map<string | null, string[]> = new Map();
        for (const group of context.roots) {
            if (group.kind !== DesignKind.Group) {
                throw new Error('Select groups to ungroup.');
            }
            if (
                group.layout.clip ||
                group.style.fills.length > 0 ||
                group.style.stroke !== null ||
                group.style.shadows.length > 0 ||
                group.style.blur !== 0
            ) {
                throw new Error(
                    'Remove the group’s fill, stroke, effects and clipping before ungrouping.',
                );
            }
            const siblings: string[] = ordered.get(group.parentId) ?? [
                ...context.siblings(group.parentId),
            ];
            let index: number = siblings.indexOf(group.id);
            if (index < 0) {
                throw new Error('Group is outside its container.');
            }
            for (const id of group.children) {
                const child: DesignNode = context.node(id);
                if (child.locked) {
                    throw new Error('Unlock the group’s children first.');
                }
                const box: DesignSelectionGeometry = context.local(context.box(id), group.parentId);
                operations.push(
                    { op: Op.Move, id, parentId: group.parentId, pageId: context.pageId, index },
                    {
                        op: Op.Update,
                        id,
                        changes: {
                            ...box,
                            opacity: group.opacity * child.opacity,
                            placement: this.fixed(child, group.placement.absolute),
                        },
                    },
                );
                siblings.splice(index++, 0, id);
                selection.push(id);
            }
            operations.push({ op: Op.Remove, id: group.id });
            siblings.splice(siblings.indexOf(group.id), 1);
            ordered.set(group.parentId, siblings);
        }
        return { operations, selection };
    }
    /** Reparenting freezes the current solved geometry instead of jumping to authored local coordinates. */
    public static move(
        context: Context,
        parentId: string | null,
        index: number,
    ): DesignSelectionPlan {
        const operations: DesignOperation[] = [];
        const target: DesignNode | null = parentId === null ? null : context.node(parentId);
        if (
            target !== null &&
            target.kind !== DesignKind.Frame &&
            target.kind !== DesignKind.Group &&
            target.kind !== DesignKind.Component
        ) {
            throw new Error('Drop layers into a frame, group or component.');
        }
        let parent: DesignNode | null = target;
        const selected: ReadonlySet<string> = new Set(
            context.roots.map((node: DesignNode): string => node.id),
        );
        while (parent !== null) {
            if (parent.locked) {
                throw new Error('Unlock the destination container first.');
            }
            if (selected.has(parent.id)) {
                throw new Error('Cannot move a layer into its own subtree.');
            }
            parent = parent.parentId === null ? null : context.node(parent.parentId);
        }
        const siblings: string[] = [...context.siblings(parentId)];
        const destination: number = Math.max(0, Math.min(index, siblings.length));
        const anchor: string | undefined = siblings
            .slice(destination)
            .find((id: string): boolean => !selected.has(id));
        for (const node of context.roots) {
            const previous: number = siblings.indexOf(node.id);
            if (previous >= 0) {
                siblings.splice(previous, 1);
            }
            const insertion: number =
                anchor === undefined ? siblings.length : siblings.indexOf(anchor);
            siblings.splice(insertion, 0, node.id);
            const box: DesignSelectionGeometry = context.local(context.box(node.id), parentId);
            operations.push(
                { op: Op.Move, id: node.id, parentId, pageId: context.pageId, index: insertion },
                {
                    op: Op.Update,
                    id: node.id,
                    changes: { ...box, placement: this.fixed(node, true) },
                },
            );
        }
        return { operations, selection: [...selected] };
    }
    /** Freezes dimensions and start constraints while leaving the source layer immutable. */
    public static fixed(node: DesignNode, absolute: boolean): DesignNode['placement'] {
        return {
            ...node.placement,
            width: DesignSizing.Fixed,
            height: DesignSizing.Fixed,
            absolute,
            horizontal: DesignConstraint.Start,
            vertical: DesignConstraint.Start,
        };
    }
}
