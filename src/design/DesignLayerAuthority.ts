// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignNode, DesignPage } from './DesignTypes.js';

/** Property edits check authored page ownership and locks without solving unrelated layout or text. */
export class DesignLayerAuthority {
    /** Indexed maps can be shared with the transaction and remain authoritative after earlier tree edits. */
    public constructor(
        public readonly nodes: ReadonlyMap<string, DesignNode>,
        public readonly pages: ReadonlyMap<string, DesignPage>,
    ) {}
    /** Virtual instance children and layers from another page cannot receive authored property edits. */
    public node(id: string, pageId: string): DesignNode {
        const page: DesignPage | undefined = this.pages.get(pageId);
        if (page === undefined) {
            throw new Error('Design page not found.');
        }
        const node: DesignNode | undefined = this.nodes.get(id);
        if (node === undefined) {
            throw new Error('Design layer not found: ' + id);
        }
        let current: DesignNode = node;
        for (let depth: number = 0; depth <= 64; depth++) {
            if (current.locked) {
                throw new Error('Unlock the selected layers and their containers first.');
            }
            if (current.parentId === null) {
                if (!page.roots.includes(current.id)) {
                    throw new Error('Selection belongs to another page.');
                }
                return node;
            }
            const parent: DesignNode | undefined = this.nodes.get(current.parentId);
            if (parent === undefined) {
                throw new Error('Design container not found.');
            }
            current = parent;
        }
        throw new Error('Design ancestry is cyclic or too deep.');
    }
}
