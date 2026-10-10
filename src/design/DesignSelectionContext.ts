// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignDocument, DesignNode, DesignBox } from './DesignTypes.js';
import { DesignLayoutEngine } from './DesignLayout.js';
import type { DesignSelectionGeometry, DesignSelectionBounds } from './DesignSelectionTypes.js';
import { DesignValues as V } from './DesignValues.js';

/** Indexed, page-local selection ownership and center-based geometric conversions. */
export class DesignSelectionContext {
    /** Authored nodes exclude expanded instance children, which cannot be independently moved. */
    public readonly nodes: ReadonlyMap<string, DesignNode>;
    /** Topmost selected nodes, sorted in the page's painter order. */
    public readonly roots: readonly DesignNode[];
    /** Resolved boxes include auto layout and all ancestor rotations. */
    public readonly boxes: ReadonlyMap<string, DesignBox>;
    /** Requires real page ownership and rejects locked ancestry before generating any edits. */
    public constructor(
        public readonly document: DesignDocument,
        public readonly pageId: string,
        selection: readonly string[],
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
            while (current !== null) {
                if (current.locked) {
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
        this.boxes = new Map(
            new DesignLayoutEngine(document, pageId)
                .solve()
                .boxes.map((box: DesignBox): readonly [string, DesignBox] => [box.id, box]),
        );
    }
    /** Resolves authored layer identity without unsafe assertions. */
    public node(id: string): DesignNode {
        const node: DesignNode | undefined = this.nodes.get(id);
        if (node === undefined) {
            throw new Error('Design layer not found: ' + id);
        }
        return node;
    }
    /** Hidden layers have no rendered geometry; duplication and ordering can still handle them. */
    public box(id: string): DesignBox {
        const box: DesignBox | undefined = this.boxes.get(id);
        if (box === undefined) {
            throw new Error('Show the selected layers before arranging their geometry.');
        }
        return box;
    }
    /** Resolves the exact ordering of an existing page or parent. */
    public siblings(parentId: string | null): readonly string[] {
        return parentId === null
            ? (this.document.pages.find((page): boolean => page.id === this.pageId)?.roots ?? [])
            : this.node(parentId).children;
    }
    /** Inverts the parent's rotation around its center, matching the shared layout engine. */
    public local(box: DesignBox, parentId: string | null): DesignSelectionGeometry {
        if (parentId === null) {
            return {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
                rotation: box.rotation,
            };
        }
        const parent: DesignBox = this.box(parentId);
        const angle: number = (-parent.rotation * Math.PI) / 180;
        const dx: number = box.x + box.width / 2 - parent.x - parent.width / 2;
        const dy: number = box.y + box.height / 2 - parent.y - parent.height / 2;
        return {
            x: dx * Math.cos(angle) - dy * Math.sin(angle) + parent.width / 2 - box.width / 2,
            y: dx * Math.sin(angle) + dy * Math.cos(angle) + parent.height / 2 - box.height / 2,
            width: box.width,
            height: box.height,
            rotation: box.rotation - parent.rotation,
        };
    }
    /** Measures all four rotated corners without allocating a point array. */
    public static bounds(box: DesignSelectionGeometry): DesignSelectionBounds {
        const angle: number = (box.rotation * Math.PI) / 180;
        const halfX: number =
            (Math.abs(Math.cos(angle)) * box.width + Math.abs(Math.sin(angle)) * box.height) / 2;
        const halfY: number =
            (Math.abs(Math.sin(angle)) * box.width + Math.abs(Math.cos(angle)) * box.height) / 2;
        return {
            left: box.x + box.width / 2 - halfX,
            right: box.x + box.width / 2 + halfX,
            top: box.y + box.height / 2 - halfY,
            bottom: box.y + box.height / 2 + halfY,
        };
    }
}
