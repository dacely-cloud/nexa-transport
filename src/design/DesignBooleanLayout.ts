// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignDocument, DesignNode, DesignBox } from './DesignTypes.js';
import type { DesignLayoutResult } from './DesignLayoutTypes.js';
import { DesignLayoutEngine } from './DesignLayout.js';
import { DesignBooleanTransforms } from './DesignBooleanTransforms.js';

/** Source geometry remains available when a Boolean operand or one of its ancestors is hidden. */
export class DesignBooleanLayout {
    readonly #document: DesignDocument;
    readonly #nodes: ReadonlyMap<string, DesignNode>;
    readonly #boxes: Map<string, DesignBox> = new Map();

    /** Indexes an immutable saved document for visible and hidden source layout. */
    public constructor(document: DesignDocument) {
        this.#document = document;
        this.#nodes = new Map(
            document.nodes.map((node: DesignNode): readonly [string, DesignNode] => [
                node.id,
                node,
            ]),
        );
    }

    /** Visible sources use normal layout; hidden containers still resolve their own flow and padding. */
    public resolve(): Map<string, DesignBox> {
        for (const page of this.#document.pages) {
            const scene: DesignLayoutResult = new DesignLayoutEngine(
                this.#document,
                page.id,
            ).solve();
            for (const box of scene.boxes) {
                this.#boxes.set(box.id, box);
            }
        }
        for (const node of this.#document.nodes) {
            this.#box(node.id);
        }
        return new Map(this.#boxes);
    }

    #box(id: string): DesignBox {
        const cached: DesignBox | undefined = this.#boxes.get(id);
        if (cached !== undefined) {
            return cached;
        }
        const node: DesignNode | undefined = this.#nodes.get(id);
        if (node === undefined) {
            throw new Error('Missing Boolean source layer.');
        }
        const parent: DesignBox | null = node.parentId === null ? null : this.#box(node.parentId);
        const resolved: DesignBox | undefined = this.#boxes.get(id);
        if (resolved !== undefined) {
            return resolved;
        }
        if (node.children.length === 0) {
            const box: DesignBox = DesignBooleanTransforms.world(id, node, parent);
            this.#boxes.set(id, box);
            return box;
        }
        const pageId: string = this.#document.pages[0]?.id ?? '';
        const isolated: DesignDocument = {
            ...this.#document,
            pages: [{ id: pageId, name: 'Source geometry', background: '#FFFFFF', roots: [id] }],
            nodes: this.#document.nodes.map((entry: DesignNode): DesignNode =>
                entry.id === id
                    ? { ...entry, visible: true, parentId: null, x: 0, y: 0, rotation: 0 }
                    : entry,
            ),
        };
        const scene: DesignLayoutResult = new DesignLayoutEngine(isolated, pageId).solve();
        const root: DesignBox | undefined = scene.boxes.find(
            (box: DesignBox): boolean => box.id === id,
        );
        if (root === undefined) {
            throw new Error('Hidden Boolean source has no resolved geometry.');
        }
        const owner: DesignBox = DesignBooleanTransforms.world(
            id,
            { ...node, width: root.width, height: root.height },
            parent,
        );
        this.#boxes.set(id, owner);
        for (const box of scene.boxes) {
            if (box.id !== id) {
                this.#boxes.set(box.id, DesignBooleanTransforms.world(box.id, box, owner));
            }
        }
        return owner;
    }
}
