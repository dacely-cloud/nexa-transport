// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignKind, type DesignNode, type DesignOverride } from './DesignTypes.js';
import { DesignComponentTargets } from './DesignComponentTargets.js';

interface DesignComponentPair {
    readonly before: string;
    readonly after: string;
    readonly depth: number;
}

/** Transfers only overrides with an unambiguous authored hierarchy in the new definition. */
export class DesignComponentSwap {
    /** Matching uses identity first, then unique sibling names and kinds, including nested instances. */
    public static overrides(
        nodes: ReadonlyMap<string, DesignNode>,
        before: string,
        after: string,
        overrides: readonly DesignOverride[],
    ): readonly DesignOverride[] {
        if (before === after || overrides.length === 0) {
            return overrides;
        }
        const reachable: ReadonlySet<string> = DesignComponentTargets.ids(nodes, after);
        const candidates: Map<string, Set<string>> = new Map();
        const visited: Set<string> = new Set();
        const pending: DesignComponentPair[] = [{ before, after, depth: 0 }];
        while (pending.length > 0) {
            const pair: DesignComponentPair | undefined = pending.pop();
            if (pair === undefined) {
                continue;
            }
            const key: string = JSON.stringify([pair.before, pair.after]);
            if (visited.has(key)) {
                continue;
            }
            if (pair.depth > 64 || visited.size >= 20000) {
                throw new Error('Component swap exceeds its layer or depth budget.');
            }
            visited.add(key);
            const source: DesignNode | undefined = nodes.get(pair.before);
            const target: DesignNode | undefined = nodes.get(pair.after);
            if (source === undefined || target === undefined || source.kind !== target.kind) {
                continue;
            }
            const matches: Set<string> = candidates.get(source.id) ?? new Set();
            matches.add(target.id);
            candidates.set(source.id, matches);
            const oldChildren: ReadonlyMap<string, string | null> = this.#children(nodes, source);
            const newChildren: ReadonlyMap<string, string | null> = this.#children(nodes, target);
            for (const [name, id] of oldChildren) {
                const next: string | null | undefined = newChildren.get(name);
                if (id !== null && next !== null && next !== undefined) {
                    pending.push({ before: id, after: next, depth: pair.depth + 1 });
                }
            }
            if (
                source.kind === DesignKind.Instance &&
                source.componentId !== null &&
                target.componentId !== null
            ) {
                pending.push({
                    before: source.componentId,
                    after: target.componentId,
                    depth: pair.depth + 1,
                });
            }
        }
        const mapping: Map<string, string> = new Map();
        const owners: Map<string, Set<string>> = new Map();
        for (const [sourceId, matches] of candidates) {
            for (const targetId of matches) {
                const sources: Set<string> = owners.get(targetId) ?? new Set();
                sources.add(sourceId);
                owners.set(targetId, sources);
            }
        }
        for (const entry of overrides) {
            const matches: ReadonlySet<string> | undefined = candidates.get(entry.nodeId);
            const id: string | undefined =
                entry.nodeId === before
                    ? after
                    : reachable.has(entry.nodeId)
                      ? entry.nodeId
                      : matches?.size === 1
                        ? matches.values().next().value
                        : undefined;
            if (id === undefined) {
                continue;
            }
            mapping.set(entry.nodeId, id);
            const sources: Set<string> = owners.get(id) ?? new Set();
            sources.add(entry.nodeId);
            owners.set(id, sources);
        }
        const result: DesignOverride[] = [];
        for (const entry of overrides) {
            const id: string | undefined = mapping.get(entry.nodeId);
            const root: boolean = id === after && mapping.has(before);
            if (
                id !== undefined &&
                (root ? entry.nodeId === before : owners.get(id)?.size === 1 || id === entry.nodeId)
            ) {
                result.push({ ...entry, nodeId: id });
            }
        }
        return result;
    }

    /** Repeated sibling names are omitted rather than matched by their incidental stacking order. */
    static #children(
        nodes: ReadonlyMap<string, DesignNode>,
        parent: DesignNode,
    ): ReadonlyMap<string, string | null> {
        const result: Map<string, string | null> = new Map();
        for (const id of parent.children) {
            const node: DesignNode | undefined = nodes.get(id);
            if (node === undefined) {
                throw new Error('Component layer is missing.');
            }
            const key: string = JSON.stringify([node.kind, node.name]);
            result.set(key, result.has(key) ? null : id);
        }
        return result;
    }
}
