// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignDocument, DesignNode } from './DesignTypes.js';
import { DesignValues as V } from './DesignValues.js';

/** Indexed page ownership, locked ancestry and topmost selection without measuring source text or geometry. */
export class DesignSelectionIndex {
    /** Authored layers retain their source references without copying or reading bodies. */
    public readonly nodes: ReadonlyMap<string, DesignNode>;
    /** Topmost selection in the page's painter order. */
    public readonly roots: readonly DesignNode[];
    /** Uses layer identity and parent/child metadata; geometry-dependent planners add their own solver. */
    public constructor(
        public readonly document: DesignDocument,
        public readonly pageId: string,
        selection: readonly string[],
        allowLocked: boolean = false,
    ) {
        V.id(pageId);
        if (
            selection.length < 1 ||
            selection.length > 128 ||
            new Set(selection).size !== selection.length
        ) {
            throw new Error('Select 1 to 128 distinct layers.');
        }
        this.nodes = new Map(
            document.nodes.map((node: DesignNode): readonly [string, DesignNode] => [
                node.id,
                node,
            ]),
        );
        const pageRoots: readonly string[] | undefined = document.pages.find(
            (page): boolean => page.id === pageId,
        )?.roots;
        if (pageRoots === undefined) {
            throw new Error('Design page not found.');
        }
        const order: Map<string, number> = new Map();
        const stack: string[] = pageRoots.toReversed();
        while (stack.length > 0) {
            const id: string | undefined = stack.pop();
            if (id === undefined) {
                break;
            }
            if (order.has(id)) {
                throw new Error('Invalid design tree.');
            }
            const node: DesignNode = this.node(id);
            order.set(id, order.size);
            stack.push(...node.children.toReversed());
        }
        const selected: Set<string> = new Set(selection.map((id: string): string => V.id(id)));
        const roots: DesignNode[] = [];
        for (const id of selected) {
            if (!order.has(id)) {
                throw new Error('Selection belongs to another page.');
            }
            const node: DesignNode = this.node(id);
            let current: DesignNode | null = node;
            let nested: boolean = false;
            let ancestors: number = 0;
            while (current !== null) {
                if (++ancestors > this.nodes.size) {
                    throw new Error('Invalid design tree.');
                }
                if (current.locked && !allowLocked) {
                    throw new Error('Unlock the selected layers and their containers first.');
                }
                if (current.id !== id && selected.has(current.id)) {
                    nested = true;
                }
                current = current.parentId === null ? null : this.node(current.parentId);
            }
            if (!nested) {
                roots.push(node);
            }
        }
        this.roots = roots.sort(
            (a: DesignNode, b: DesignNode): number =>
                (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
        );
    }
    /** Missing authored IDs fail before an operation is planned. */
    public node(id: string): DesignNode {
        const node: DesignNode | undefined = this.nodes.get(id);
        if (node === undefined) {
            throw new Error('Design layer not found: ' + id);
        }
        return node;
    }
}
