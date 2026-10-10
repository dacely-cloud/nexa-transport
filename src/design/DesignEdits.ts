// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignOperationCodec } from './DesignOperationCodec.js';
import { DesignTreeEdits as Tree } from './DesignTreeEdits.js';
import { DesignEntityChanges as Entity } from './DesignEntityChanges.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignCodec } from './DesignCodec.js';
import {
    DesignOperationKind,
    type DesignOperation,
    type DesignChangeSet,
    type DesignEntityChange,
    type DesignMetadataState,
    type DesignEditResult,
} from './DesignOperationTypes.js';
import type {
    DesignDocument,
    DesignNode,
    DesignPage,
    DesignInteraction,
    DesignComment,
} from './DesignTypes.js';

interface Identified {
    readonly id: string;
}

/** Atomic editing and compare-before-write undo for the shared scene graph. */
export class DesignEdits {
    /** Applies a complete transaction or throws without mutating the input document. */
    public static apply(
        source: DesignDocument,
        operations: readonly DesignOperation[],
    ): DesignEditResult {
        if (operations.length < 1 || operations.length > 256) {
            throw new Error('A design transaction requires 1 to 256 operations');
        }
        const document: DesignDocument = DesignCodec.document(source);
        const nodes: Map<string, DesignNode> = new Map(
            document.nodes.map((node: DesignNode): [string, DesignNode] => [node.id, node]),
        );
        const pages: Map<string, DesignPage> = new Map(
            document.pages.map((page: DesignPage): [string, DesignPage] => [page.id, page]),
        );
        let metadata: DesignMetadataState = this.#metadata(document);
        for (const operation of DesignOperationCodec.operations(operations)) {
            switch (operation.op) {
                case DesignOperationKind.Insert: {
                    if (nodes.has(operation.node.id)) {
                        throw new Error(`Layer already exists: ${operation.node.id}`);
                    }
                    if (operation.node.parentId !== null || operation.node.children.length > 0) {
                        throw new Error(
                            'Insert standalone layers, then build the tree with insert or move',
                        );
                    }
                    nodes.set(operation.node.id, {
                        ...operation.node,
                        parentId: operation.parentId,
                    });
                    Tree.attach(
                        nodes,
                        pages,
                        operation.node.id,
                        operation.parentId,
                        operation.pageId,
                        operation.index,
                    );
                    break;
                }
                case DesignOperationKind.Update: {
                    const node: DesignNode = Tree.node(nodes, operation.id);
                    nodes.set(node.id, DesignPaths.resize(node, operation.changes));
                    break;
                }
                case DesignOperationKind.Move: {
                    const node: DesignNode = Tree.node(nodes, operation.id);
                    if (
                        operation.parentId !== null &&
                        Tree.descendants(nodes, node.id).has(operation.parentId)
                    ) {
                        throw new Error('Cannot move a layer into its subtree');
                    }
                    Tree.detach(nodes, pages, node.id);
                    nodes.set(node.id, { ...node, parentId: operation.parentId });
                    Tree.attach(
                        nodes,
                        pages,
                        node.id,
                        operation.parentId,
                        operation.pageId,
                        operation.index,
                    );
                    break;
                }
                case DesignOperationKind.Remove: {
                    const ids: ReadonlySet<string> = Tree.descendants(nodes, operation.id);
                    Tree.detach(nodes, pages, operation.id);
                    for (const id of ids) {
                        nodes.delete(id);
                    }
                    metadata = {
                        ...metadata,
                        interactions: metadata.interactions.filter(
                            (entry: DesignInteraction): boolean =>
                                !ids.has(entry.nodeId) && !ids.has(entry.targetId),
                        ),
                        comments: metadata.comments.filter(
                            (entry: DesignComment): boolean =>
                                entry.nodeId === null || !ids.has(entry.nodeId),
                        ),
                    };
                    break;
                }
                case DesignOperationKind.Page: {
                    const page: DesignPage | undefined = pages.get(operation.id);
                    if (operation.name === null) {
                        if (page === undefined) {
                            throw new Error(`Page not found: ${operation.id}`);
                        }
                        if (page.roots.length > 0) {
                            throw new Error('Move or delete page layers before deleting the page');
                        }
                        pages.delete(page.id);
                    } else {
                        pages.set(operation.id, {
                            id: operation.id,
                            name: operation.name,
                            background: operation.background,
                            roots: page?.roots ?? [],
                        });
                    }
                    break;
                }
                case DesignOperationKind.Metadata: {
                    metadata = {
                        ...metadata,
                        ...(operation.name === undefined ? {} : { name: operation.name }),
                        ...(operation.tokens === undefined ? {} : { tokens: operation.tokens }),
                        ...(operation.interactions === undefined
                            ? {}
                            : { interactions: operation.interactions }),
                        ...(operation.comments === undefined
                            ? {}
                            : { comments: operation.comments }),
                    };
                    break;
                }
            }
        }
        const next: DesignDocument = DesignCodec.document({
            ...document,
            ...metadata,
            nodes: [...nodes.values()],
            pages: [...pages.values()],
        });
        return { document: next, changes: this.diff(document, next) };
    }

    /** Computes the minimal set of changed entities rather than transmitting every layer. */
    public static diff(before: DesignDocument, after: DesignDocument): DesignChangeSet {
        const previous: DesignMetadataState = this.#metadata(before);
        const next: DesignMetadataState = this.#metadata(after);
        return {
            nodes: Entity.diff(before.nodes, after.nodes),
            pages: Entity.diff(before.pages, after.pages),
            metadata: Entity.equal(previous, next)
                ? null
                : { id: before.id, before: previous, after: next },
        };
    }

    /** Restores a commit only if touched entities still match, preserving independent edits. */
    public static restore(
        document: DesignDocument,
        changes: DesignChangeSet,
        reverse: boolean = true,
    ): DesignEditResult {
        const nodes: readonly DesignNode[] = this.#restore(document.nodes, changes.nodes, reverse);
        const pages: readonly DesignPage[] = this.#restore(document.pages, changes.pages, reverse);
        let metadata: DesignMetadataState = this.#metadata(document);
        if (changes.metadata !== null) {
            const expected: DesignMetadataState | null = reverse
                ? changes.metadata.after
                : changes.metadata.before;
            const next: DesignMetadataState | null = reverse
                ? changes.metadata.before
                : changes.metadata.after;
            if (!Entity.equal(metadata, expected) || next === null) {
                throw new Error('Document metadata changed since this edit');
            }
            metadata = next;
        }
        const next: DesignDocument = DesignCodec.document({
            ...document,
            ...metadata,
            nodes,
            pages,
        });
        return { document: next, changes: this.diff(document, next) };
    }

    static #metadata(document: DesignDocument): DesignMetadataState {
        return {
            name: document.name,
            tokens: document.tokens,
            interactions: document.interactions,
            comments: document.comments,
        };
    }
    static #restore<T extends Identified>(
        source: readonly T[],
        changes: readonly DesignEntityChange<T>[],
        reverse: boolean,
    ): readonly T[] {
        const entries: Map<string, T> = new Map(
            source.map((entry: T): [string, T] => [entry.id, entry]),
        );
        const touched: Set<string> = new Set();
        for (const change of changes) {
            if (touched.has(change.id)) {
                throw new Error('Duplicate layer in design change set');
            }
            touched.add(change.id);
            const expected: T | null = reverse ? change.after : change.before;
            const next: T | null = reverse ? change.before : change.after;
            if (!Entity.equal(entries.get(change.id) ?? null, expected)) {
                throw new Error(`Layer changed since this edit: ${change.id}`);
            }
            if (next === null) {
                entries.delete(change.id);
            } else {
                if (next.id !== change.id) {
                    throw new Error('Design change identity mismatch');
                }
                entries.set(change.id, next);
            }
        }
        return [...entries.values()];
    }
}
