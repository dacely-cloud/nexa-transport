// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import type {
    RobloxScene,
    RobloxSceneNode,
    RobloxHierarchyDelta,
    RobloxHierarchyNode,
} from './RobloxSceneTypes';

/** Normalized topology plus all first-observed instance definitions. */
export interface RobloxHierarchyDecoded {
    readonly deltas: readonly RobloxHierarchyDelta[];
    readonly catalog: ReadonlyMap<string, RobloxSceneNode>;
    readonly activeSeconds: ReadonlyMap<string, number>;
}
interface HierarchyIndex {
    readonly catalog: ReadonlyMap<string, RobloxSceneNode>;
    last: number;
    active: Map<string, RobloxSceneNode>;
    nodes: readonly RobloxSceneNode[];
}

/** Bounded native topology validation and stateless forward/backward projection. */
export class RobloxSceneHierarchy {
    static readonly #indices: WeakMap<RobloxScene, HierarchyIndex> = new WeakMap();

    /** Validates every atomic delta against the currently active graph. */
    public static decode(
        raw: unknown,
        initial: readonly RobloxSceneNode[],
        duration: number,
    ): RobloxHierarchyDecoded {
        const catalog: Map<string, RobloxSceneNode> = new Map(
            initial.map((node: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                node.id,
                node,
            ]),
        );
        const active: Map<string, RobloxSceneNode> = new Map(catalog);
        const started: Map<string, number> = new Map(
            initial.map((node: RobloxSceneNode): readonly [string, number] => [node.id, 0]),
        );
        const seconds: Map<string, number> = new Map();
        let previous: number = 0;
        let operations: number = 0;
        const deltas: RobloxHierarchyDelta[] = [];
        for (const value of raw === undefined ? [] : RobloxSceneCodec.array(raw, 4096)) {
            const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(value, [
                'at',
                'created',
                'changed',
                'removed',
            ]);
            const at: number = RobloxSceneCodec.number(fields['at'], previous, duration);
            const created: readonly RobloxSceneNode[] = RobloxSceneCodec.array(
                fields['created'],
                2048,
            ).map((node: unknown): RobloxSceneNode => RobloxSceneCodec.node(node));
            const changed: readonly RobloxHierarchyNode[] = RobloxSceneCodec.array(
                fields['changed'],
                2048,
            ).map((raw: unknown): RobloxHierarchyNode => {
                const node: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
                    'id',
                    'name',
                    'parentId',
                ]);
                return Object.freeze({
                    id: RobloxSceneCodec.identity(node['id']),
                    name: RobloxSceneCodec.text(node['name'], 160),
                    parentId:
                        node['parentId'] === null
                            ? null
                            : RobloxSceneCodec.identity(node['parentId']),
                });
            });
            const removed: readonly string[] = RobloxSceneCodec.array(fields['removed'], 2048).map(
                (id: unknown): string => RobloxSceneCodec.identity(id),
            );
            operations += created.length + changed.length + removed.length;
            if (operations > 65536 || created.length + changed.length + removed.length === 0) {
                throw new Error('Invalid hierarchy operation budget');
            }
            const touched: Set<string> = new Set();
            for (const node of created) {
                if (catalog.has(node.id) || touched.has(node.id) || catalog.size >= 2048) {
                    throw new Error('Duplicate or excessive lifetime hierarchy identity');
                }
                touched.add(node.id);
                catalog.set(node.id, node);
                active.set(node.id, node);
                started.set(node.id, at);
            }
            for (const node of changed) {
                const original: RobloxSceneNode | undefined =
                    active.get(node.id) ?? catalog.get(node.id);
                if (original === undefined || touched.has(node.id)) {
                    throw new Error('Unknown or duplicate changed hierarchy identity');
                }
                touched.add(node.id);
                if (!active.has(node.id)) {
                    started.set(node.id, at);
                }
                if (active.get(node.id)?.parentId !== node.parentId) {
                    active.delete(node.id);
                }
                active.set(
                    node.id,
                    Object.freeze({ ...original, parentId: node.parentId, name: node.name }),
                );
            }
            for (const id of removed) {
                if (!active.has(id) || touched.has(id)) {
                    throw new Error('Unknown or duplicate removed hierarchy identity');
                }
                touched.add(id);
                const start: number | undefined = started.get(id);
                if (start === undefined) {
                    throw new Error('Missing hierarchy lifetime start');
                }
                seconds.set(id, (seconds.get(id) ?? 0) + at - start);
                started.delete(id);
                active.delete(id);
            }
            RobloxSceneCodec.topology([...active.values()]);
            deltas.push(
                Object.freeze({
                    at,
                    created: Object.freeze(created),
                    changed: Object.freeze(changed),
                    removed: Object.freeze(removed),
                }),
            );
            previous = at;
        }
        for (const [id, start] of started) {
            seconds.set(id, (seconds.get(id) ?? 0) + duration - start);
        }
        return { deltas: Object.freeze(deltas), catalog, activeSeconds: seconds };
    }

    /** Returns each real instance's first-observed definition, including future births. */
    public static catalog(scene: RobloxScene): ReadonlyMap<string, RobloxSceneNode> {
        return this.#index(scene).catalog;
    }

    /** Reads the current membership without allocating an index for each particle birth. */
    public static active(scene: RobloxScene, time: number): ReadonlyMap<string, RobloxSceneNode> {
        this.nodes(scene, time);
        return this.#index(scene).active;
    }

    /** Accepts birth poses only from graph states observed at that exact command time. */
    public static ancestors(
        initial: readonly RobloxSceneNode[],
        deltas: readonly RobloxHierarchyDelta[],
        id: string,
        time: number,
    ): readonly (readonly string[])[] {
        const active: Map<string, RobloxSceneNode> = new Map(
            initial.map((node: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                node.id,
                node,
            ]),
        );
        const catalog: Map<string, RobloxSceneNode> = new Map(active);
        let candidates: readonly string[][] = [];
        const chain: () => string[] | null = (): string[] | null => {
            const emitter: RobloxSceneNode | undefined = active.get(id);
            if (emitter === undefined) {
                return null;
            }
            const result: string[] = [];
            let parent: RobloxSceneNode | undefined =
                emitter.parentId === null ? undefined : active.get(emitter.parentId);
            while (
                parent !== undefined &&
                ['Attachment', 'Part', 'WedgePart', 'CornerWedgePart'].includes(parent.className)
            ) {
                result.push(parent.id);
                parent = parent.parentId === null ? undefined : active.get(parent.parentId);
            }
            return result;
        };
        let current: string[] | null = chain();
        if (current !== null) {
            candidates = [current];
        }
        for (const delta of deltas) {
            if (delta.at > time) {
                break;
            }
            for (const node of delta.created) {
                catalog.set(node.id, node);
                active.set(node.id, node);
            }
            for (const node of delta.changed) {
                const original: RobloxSceneNode | undefined =
                    active.get(node.id) ?? catalog.get(node.id);
                if (original === undefined) {
                    throw new Error('Missing hierarchy instance');
                }
                if (original.parentId !== node.parentId) {
                    active.delete(node.id);
                }
                active.set(node.id, { ...original, name: node.name, parentId: node.parentId });
            }
            for (const removed of delta.removed) {
                active.delete(removed);
            }
            current = chain();
            if (delta.at < time) {
                candidates = current === null ? [] : [current];
            } else if (current !== null) {
                candidates = [...candidates, current];
            }
        }
        return candidates;
    }

    /** Evaluates native membership, parenting and names at one timestamp. */
    public static nodes(scene: RobloxScene, time: number): readonly RobloxSceneNode[] {
        const deltas: readonly RobloxHierarchyDelta[] = scene.hierarchy ?? [];
        if (deltas.length === 0) {
            return scene.nodes;
        }
        const index: HierarchyIndex = this.#index(scene);
        let low: number = 0;
        let high: number = deltas.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            const delta: RobloxHierarchyDelta | undefined = deltas[middle];
            if (delta !== undefined && delta.at <= time) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        if (index.last === low) {
            return index.nodes;
        }
        const forward: boolean = index.last >= 0 && index.last <= low;
        const active: Map<string, RobloxSceneNode> = forward
            ? index.active
            : new Map(
                  scene.nodes.map((node: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                      node.id,
                      node,
                  ]),
              );
        for (let position: number = forward ? index.last : 0; position < low; position++) {
            const delta: RobloxHierarchyDelta | undefined = deltas[position];
            if (delta === undefined) {
                throw new Error('Missing hierarchy delta');
            }
            for (const node of delta.created) {
                active.set(node.id, node);
            }
            for (const node of delta.changed) {
                const original: RobloxSceneNode | undefined =
                    active.get(node.id) ?? index.catalog.get(node.id);
                if (original === undefined) {
                    throw new Error('Missing hierarchy instance definition');
                }
                if (original.parentId !== node.parentId) {
                    active.delete(node.id);
                }
                active.set(node.id, { ...original, parentId: node.parentId, name: node.name });
            }
            for (const id of delta.removed) {
                active.delete(id);
            }
        }
        index.last = low;
        index.active = active;
        index.nodes = Object.freeze([...active.values()]);
        return index.nodes;
    }
    static #index(scene: RobloxScene): HierarchyIndex {
        const cached: HierarchyIndex | undefined = this.#indices.get(scene);
        if (cached !== undefined) {
            return cached;
        }
        const catalog: Map<string, RobloxSceneNode> = new Map(
            scene.nodes.map((node: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                node.id,
                node,
            ]),
        );
        for (const delta of scene.hierarchy ?? []) {
            for (const node of delta.created) {
                catalog.set(node.id, node);
            }
        }
        const index: HierarchyIndex = {
            catalog,
            last: 0,
            active: new Map(
                scene.nodes.map((node: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                    node.id,
                    node,
                ]),
            ),
            nodes: scene.nodes,
        };
        this.#indices.set(scene, index);
        return index;
    }
}
