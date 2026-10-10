// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignKind, type DesignNode, type DesignInteraction } from './DesignTypes.js';
import { DesignScene, type DesignSceneNode } from './DesignScene.js';
import { DesignOperationKind as Op, type DesignOperation } from './DesignOperationTypes.js';
import type { DesignSelectionPlan } from './DesignSelectionTypes.js';
import type { DesignSelectionContext } from './DesignSelectionContext.js';

/** Detachment retains the authored root identity while baking the complete rendered subtree. */
export class DesignComponentDetach {
    /** Source definitions remain linked to their other instances and are never modified. */
    public static plan(
        context: DesignSelectionContext,
        identify: (sourceId: string) => string,
    ): DesignSelectionPlan {
        const scene: readonly DesignSceneNode[] = DesignScene.page(
            context.document,
            context.pageId,
        ).nodes;
        const nodes: ReadonlyMap<string, DesignSceneNode> = new Map(
            scene.map((node: DesignSceneNode): readonly [string, DesignSceneNode] => [
                node.id,
                node,
            ]),
        );
        const operations: DesignOperation[] = [];
        const interactions: DesignInteraction[] = [...context.document.interactions];
        for (const instance of context.roots) {
            if (instance.kind !== DesignKind.Instance) {
                throw new Error('Select linked instances to detach.');
            }
            const root: DesignSceneNode | undefined = nodes.get(instance.id);
            if (root === undefined) {
                throw new Error('Instance scene is missing.');
            }
            const expanded: DesignSceneNode[] = [];
            const pending: string[] = [root.id];
            while (pending.length > 0) {
                const id: string | undefined = pending.pop();
                const node: DesignSceneNode | undefined =
                    id === undefined ? undefined : nodes.get(id);
                if (node === undefined) {
                    throw new Error('Instance child is missing.');
                }
                expanded.push(node);
                if (expanded.length + operations.length > 256) {
                    throw new Error('Detach at most 256 layers in one atomic command.');
                }
                pending.push(...node.children.toReversed());
            }
            const remap: ReadonlyMap<string, string> = new Map(
                expanded.map((node: DesignSceneNode): readonly [string, string] => [
                    node.id,
                    node.id === root.id
                        ? instance.id
                        : identify(instance.id + ':detach:' + node.id),
                ]),
            );
            const baked: DesignNode = this.#node(root, instance.id);
            operations.push({
                op: Op.Update,
                id: instance.id,
                changes: {
                    kind: DesignKind.Frame,
                    opacity: baked.opacity,
                    visible: baked.visible,
                    style: baked.style,
                    layout: baked.layout,
                    text: baked.text,
                    path: baked.path,
                    image: baked.image,
                    componentId: null,
                    overrides: [],
                },
            });
            for (const node of expanded.slice(1)) {
                const id: string | undefined = remap.get(node.id);
                const parentId: string | undefined =
                    node.parentId === null ? undefined : remap.get(node.parentId);
                if (id === undefined || parentId === undefined) {
                    throw new Error('Missing detached layer identity.');
                }
                const index: number =
                    nodes.get(node.parentId ?? '')?.children.indexOf(node.id) ?? -1;
                operations.push({
                    op: Op.Insert,
                    node: this.#node(node, id),
                    parentId,
                    pageId: context.pageId,
                    index,
                });
            }
            for (const link of context.document.interactions) {
                for (const from of expanded) {
                    const original: DesignNode | undefined = context.nodes.get(from.sourceId);
                    const origins: readonly (string | null)[] = [
                        from.sourceId,
                        from.id === root.id
                            ? instance.componentId
                            : (original?.componentId ?? null),
                    ];
                    if (!origins.includes(link.nodeId)) {
                        continue;
                    }
                    const candidates: readonly DesignSceneNode[] = expanded.filter(
                        (node: DesignSceneNode): boolean =>
                            node.sourceId === link.targetId ||
                            (node.id === root.id
                                ? instance.componentId
                                : context.nodes.get(node.sourceId)?.componentId) === link.targetId,
                    );
                    const target: DesignSceneNode | undefined = candidates.toSorted(
                        (a: DesignSceneNode, b: DesignSceneNode): number =>
                            this.#common(from.id, b.id) - this.#common(from.id, a.id),
                    )[0];
                    interactions.push({
                        ...link,
                        id: identify(instance.id + ':prototype:' + link.id + ':' + from.id),
                        nodeId: remap.get(from.id) ?? instance.id,
                        targetId:
                            target === undefined
                                ? link.targetId
                                : (remap.get(target.id) ?? link.targetId),
                    });
                }
            }
        }
        if (interactions.length !== context.document.interactions.length) {
            operations.push({ op: Op.Metadata, interactions });
        }
        return { operations, selection: context.roots.map((node: DesignNode): string => node.id) };
    }
    static #common(a: string, b: string): number {
        const left: readonly string[] = a.split('/');
        const right: readonly string[] = b.split('/');
        let count: number = 0;
        while (left[count] !== undefined && left[count] === right[count]) {
            count++;
        }
        return count;
    }
    static #node(node: DesignSceneNode, id: string): DesignNode {
        return {
            id,
            name: node.name,
            kind: node.kind === DesignKind.Component ? DesignKind.Frame : node.kind,
            parentId: null,
            children: [],
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            rotation: node.rotation,
            opacity: node.opacity,
            visible: node.visible,
            locked: node.locked,
            style: node.style,
            layout: node.layout,
            placement: node.placement,
            text: node.text,
            path: node.path,
            image: node.image,
            componentId: null,
            overrides: [],
        };
    }
}
