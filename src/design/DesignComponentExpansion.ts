// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    type DesignDocument,
    type DesignNode,
    type DesignPage,
} from './DesignTypes.js';

interface Expansion {
    readonly layers: number;
    readonly depth: number;
}

/** Counts linked occurrences without materializing repeated source bodies or geometry. */
export class DesignComponentExpansion {
    /** Checks the same 20,000-layer and depth-64 scene limits before inserting a repeat group. */
    public static repeat(
        document: DesignDocument,
        page: DesignPage,
        componentId: string,
        copies: number,
    ): void {
        const nodes: ReadonlyMap<string, DesignNode> = new Map(
            document.nodes.map((node: DesignNode): readonly [string, DesignNode] => [
                node.id,
                node,
            ]),
        );
        const cache: Map<string, Expansion> = new Map();
        const active: Set<string> = new Set();
        const count: (id: string) => Expansion = (id: string): Expansion => {
            if (active.has(id) || active.size > 64) {
                throw new Error('Expanded page exceeds its layer or depth budget');
            }
            const cached: Expansion | undefined = cache.get(id);
            if (cached !== undefined) {
                return cached;
            }
            const node: DesignNode | undefined = nodes.get(id);
            const source: DesignNode | undefined =
                node?.kind === DesignKind.Instance ? nodes.get(node.componentId ?? '') : node;
            if (
                source === undefined ||
                (node?.kind === DesignKind.Instance && source.kind !== DesignKind.Component)
            ) {
                throw new Error('Component source is missing or invalid');
            }
            active.add(id);
            let layers: number = 1;
            let depth: number = 0;
            for (const child of source.children) {
                const nested: Expansion = count(child);
                layers = Math.min(20001, layers + nested.layers);
                depth = Math.max(depth, nested.depth + 1);
            }
            active.delete(id);
            const result: Expansion = { layers, depth };
            cache.set(id, result);
            return result;
        };
        const source: Expansion = count(componentId);
        let total: number = 1 + source.layers * copies;
        if (source.depth + 1 > 64) {
            throw new Error('Expanded page exceeds its layer or depth budget');
        }
        for (const root of page.roots) {
            const expanded: Expansion = count(root);
            total += expanded.layers;
            if (expanded.depth > 64) {
                throw new Error('Expanded page exceeds its layer or depth budget');
            }
        }
        if (total > 20000) {
            throw new Error('Expanded page exceeds its layer or depth budget');
        }
    }
}
