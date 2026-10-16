// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0
import { DesignKind, type DesignDocument, type DesignNode } from './DesignTypes.js';
import type { DesignTransferGraph } from './DesignTransferGraph.js';

/** Copies inside one saved document keep live definition links when the referenced tree still exists. */
export class DesignTransferLinks {
    public static reusable(
        source: DesignDocument,
        target: DesignDocument,
        graph: DesignTransferGraph,
    ): ReadonlySet<string> {
        if (source.id !== target.id) {
            return new Set();
        }
        const existing: ReadonlyMap<string, DesignNode> = new Map(
            target.nodes.map((node: DesignNode): readonly [string, DesignNode] => [node.id, node]),
        );
        const reused: Set<string> = new Set();
        for (const root of graph.dependencyRoots) {
            const pending: string[] = [root];
            const tree: Set<string> = new Set();
            let valid: boolean = true;
            while (pending.length > 0 && valid) {
                const id: string | undefined = pending.pop();
                if (id === undefined || tree.has(id)) {
                    continue;
                }
                tree.add(id);
                const node: DesignNode = graph.context.node(id);
                const current: DesignNode | undefined = existing.get(id);
                valid =
                    current !== undefined &&
                    current.kind === node.kind &&
                    (id === root || current.parentId === node.parentId);
                if (
                    id === root &&
                    node.kind !== DesignKind.Component &&
                    node.kind !== DesignKind.ComponentSet
                ) {
                    valid = false;
                }
                pending.push(...node.children);
            }
            if (valid) {
                for (const id of tree) {
                    reused.add(id);
                }
            }
        }
        return reused;
    }
}
