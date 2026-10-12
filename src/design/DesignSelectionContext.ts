// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignFlow, type DesignDocument, type DesignNode, type DesignBox } from './DesignTypes.js';
import { DesignLayoutEngine } from './DesignLayout.js';
import type {
    DesignSelectionGeometry,
    DesignSelectionBounds,
    DesignSelectionPoint,
} from './DesignSelectionTypes.js';
import type { DesignTextMeasurer, DesignSize, DesignLocalBox } from './DesignLayoutTypes.js';
import { DesignTextMetrics } from './DesignTextMetrics.js';
import { DesignSelectionIndex } from './DesignSelectionIndex.js';

/** Indexed, page-local selection ownership and center-based geometric conversions. */
export class DesignSelectionContext {
    /** Authored nodes exclude expanded instance children, which cannot be independently moved. */
    public readonly nodes: ReadonlyMap<string, DesignNode>;
    /** Topmost selected nodes, sorted in the page's painter order. */
    public readonly roots: readonly DesignNode[];
    /** Resolved boxes include auto layout and all ancestor rotations. */
    public readonly boxes: ReadonlyMap<string, DesignBox>;
    readonly #tree: DesignSelectionIndex;
    readonly #layout: DesignLayoutEngine;
    /** Requires real page ownership and rejects locked ancestry before generating any edits. */
    public constructor(
        public readonly document: DesignDocument,
        public readonly pageId: string,
        selection: readonly string[],
        public readonly measurer: DesignTextMeasurer = new DesignTextMetrics(),
    ) {
        this.#tree = new DesignSelectionIndex(document, pageId, selection);
        this.nodes = this.#tree.nodes;
        this.roots = this.#tree.roots;
        this.#layout = new DesignLayoutEngine(document, pageId, measurer);
        this.boxes = new Map(
            this.#layout
                .solve()
                .boxes.map((box: DesignBox): readonly [string, DesignBox] => [box.id, box]),
        );
    }
    /** Resolves authored layer identity without unsafe assertions. */
    public node(id: string): DesignNode {
        return this.#tree.node(id);
    }
    /** The existing solver cache also measures hidden text and component content. */
    public measure(id: string): DesignSize {
        return this.#layout.measure(id);
    }
    /** Reading local geometry also works for hidden layers without allocating a second solver. */
    public position(id: string): DesignLocalBox {
        return this.#layout.position(id);
    }
    /** Flow placement belongs to the container's layout and sibling ordering. */
    public flowing(id: string): boolean {
        const node: DesignNode = this.node(id);
        const parent: DesignNode | null = node.parentId === null ? null : this.node(node.parentId);
        return (
            parent !== null &&
            parent.layout.flow !== DesignFlow.Absolute &&
            !node.placement.absolute
        );
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
        return DesignSelectionContext.relative(box, parentId === null ? null : this.box(parentId));
    }
    /** Inverts the same center transform against a proposed parent box as well as a saved one. */
    public static relative(box: DesignBox, parent: DesignBox | null): DesignSelectionGeometry {
        if (parent === null) {
            return {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
                rotation: box.rotation,
            };
        }
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
    /** World-space transformed top-left corner. */
    public static corner(box: DesignBox): DesignSelectionPoint {
        const angle: number = (box.rotation * Math.PI) / 180;
        return {
            x:
                box.x +
                box.width / 2 -
                (box.width / 2) * Math.cos(angle) +
                (box.height / 2) * Math.sin(angle),
            y:
                box.y +
                box.height / 2 -
                (box.width / 2) * Math.sin(angle) -
                (box.height / 2) * Math.cos(angle),
        };
    }
    /** A reflowed frame retains its transformed corner instead of rotating content around a moving center. */
    public static atCorner(box: DesignBox, corner: DesignSelectionPoint): DesignBox {
        const angle: number = (box.rotation * Math.PI) / 180;
        return {
            ...box,
            x:
                corner.x +
                (box.width / 2) * Math.cos(angle) -
                (box.height / 2) * Math.sin(angle) -
                box.width / 2,
            y:
                corner.y +
                (box.width / 2) * Math.sin(angle) +
                (box.height / 2) * Math.cos(angle) -
                box.height / 2,
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
