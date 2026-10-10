// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignNode, DesignPage } from './DesignTypes.js';

/** Maintains both sides of scene ownership during atomic transactions. */
export class DesignTreeEdits {
    /** Resolves or updates validated tree ownership without mutating the source document. */
    public static node(nodes: ReadonlyMap<string, DesignNode>, id: string): DesignNode {
        const node: DesignNode | undefined = nodes.get(id);
        if (node === undefined) {
            throw new Error(`Layer not found: ${id}`);
        }
        return node;
    }
    /** Resolves or updates validated tree ownership without mutating the source document. */
    public static descendants(
        nodes: ReadonlyMap<string, DesignNode>,
        id: string,
    ): ReadonlySet<string> {
        const output: Set<string> = new Set();
        const queue: string[] = [id];
        for (let cursor: number = 0; cursor < queue.length; cursor++) {
            const current: string | undefined = queue[cursor];
            if (current === undefined || output.has(current)) {
                throw new Error('Invalid layer subtree');
            }
            output.add(current);
            queue.push(...this.node(nodes, current).children);
        }
        return output;
    }
    /** Resolves or updates validated tree ownership without mutating the source document. */
    public static detach(
        nodes: Map<string, DesignNode>,
        pages: Map<string, DesignPage>,
        id: string,
    ): void {
        const node: DesignNode = this.node(nodes, id);
        if (node.parentId !== null) {
            const parent: DesignNode = this.node(nodes, node.parentId);
            nodes.set(parent.id, {
                ...parent,
                children: parent.children.filter((child: string): boolean => child !== id),
            });
        } else {
            const page: DesignPage | undefined = [...pages.values()].find(
                (entry: DesignPage): boolean => entry.roots.includes(id),
            );
            if (page === undefined) {
                throw new Error(`Layer is not placed in a page: ${id}`);
            }
            pages.set(page.id, {
                ...page,
                roots: page.roots.filter((child: string): boolean => child !== id),
            });
        }
    }
    /** Resolves or updates validated tree ownership without mutating the source document. */
    public static attach(
        nodes: Map<string, DesignNode>,
        pages: Map<string, DesignPage>,
        id: string,
        parentId: string | null,
        pageId: string,
        index: number,
    ): void {
        const page: DesignPage | undefined = pages.get(pageId);
        if (page === undefined) {
            throw new Error(`Page not found: ${pageId}`);
        }
        if (parentId !== null) {
            const parent: DesignNode = this.node(nodes, parentId);
            let root: DesignNode = parent;
            const visited: Set<string> = new Set();
            while (root.parentId !== null) {
                if (visited.has(root.id)) {
                    throw new Error('Invalid parent cycle');
                }
                visited.add(root.id);
                root = this.node(nodes, root.parentId);
            }
            if (!page.roots.includes(root.id)) {
                throw new Error('Parent belongs to a different page');
            }
            const children: string[] = [...parent.children];
            this.#insert(children, id, index);
            nodes.set(parent.id, { ...parent, children });
        } else {
            const roots: string[] = [...page.roots];
            this.#insert(roots, id, index);
            pages.set(page.id, { ...page, roots });
        }
    }
    static #insert(entries: string[], id: string, index: number): void {
        if (!Number.isSafeInteger(index) || index < 0 || index > entries.length) {
            throw new Error('Layer insertion index is outside the container');
        }
        entries.splice(index, 0, id);
    }
}
