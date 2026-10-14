// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignTypographyLinks } from './DesignTypographyLinks.js';
import { DesignTypographyStyleEdits } from './DesignTypographyStyleEdits.js';

import { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignStrokeEdits } from './DesignStrokeEdits.js';
import { DesignStyleEdits } from './DesignStyleEdits.js';
import { DesignPaintImageEdits } from './DesignPaintImageEdits.js';
import { DesignPaintGradientEdits } from './DesignPaintGradientEdits.js';
import { DesignPaintColorEdits } from './DesignPaintColorEdits.js';
import { DesignTokenEdits } from './DesignTokenEdits.js';
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
import { DesignKind } from './DesignTypes.js';
import { DesignResizeEdits } from './DesignResizeEdits.js';
import { DesignPositionEdits } from './DesignPositionEdits.js';
import { DesignScaleEdits } from './DesignScaleEdits.js';
import { DesignRotateEdits } from './DesignRotateEdits.js';
import { DesignTranslateEdits } from './DesignTranslateEdits.js';
import { DesignTextStyleEdits } from './DesignTextStyleEdits.js';
import { DesignTypographyEdits } from './DesignTypographyEdits.js';
import { DesignSizingEdits } from './DesignSizingEdits.js';
import { DesignLayoutEdits } from './DesignLayoutEdits.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignTextMeasurer } from './DesignLayoutTypes.js';
import { DesignTextMetrics } from './DesignTextMetrics.js';
import type {
    DesignDocument,
    DesignNode,
    DesignGuideValue,
    DesignRulerGuide,
    DesignPage,
    DesignInteraction,
    DesignComment,
    DesignTextRun,
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
        measurer: DesignTextMeasurer = new DesignTextMetrics(),
    ): DesignEditResult {
        if (operations.length < 1 || operations.length > 512) {
            throw new Error('A design transaction requires 1 to 512 operations');
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
                            'Insert templates require node.parentId:null and node.children:[]; specify the parent in operation.parentId',
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
                    if (
                        node.kind === DesignKind.Boolean &&
                        operation.changes.path !== undefined &&
                        operation.changes.kind !== DesignKind.Path
                    ) {
                        throw new Error(
                            'Boolean outlines are derived. Edit the source layers or flatten the group first.',
                        );
                    }
                    nodes.set(node.id, DesignPaths.resize(node, operation.changes));
                    break;
                }
                case DesignOperationKind.Text: {
                    const node: DesignNode = Tree.node(nodes, operation.id);
                    if (node.text === null) {
                        throw new Error(`Layer has no editable text: ${node.id}`);
                    }
                    const content: string = operation.content;
                    const runs: DesignTextRun[] = [];
                    for (const run of node.text.runs) {
                        let start: number = Math.min(run.start, content.length);
                        let end: number = Math.min(run.end, content.length);
                        if (
                            start < end &&
                            !content.slice(start, start + 1).isWellFormed() &&
                            content.charCodeAt(start) >= 0xdc00
                        ) {
                            start++;
                        }
                        if (
                            start < end &&
                            !content.slice(end - 1, end).isWellFormed() &&
                            content.charCodeAt(end - 1) <= 0xdbff
                        ) {
                            end--;
                        }
                        if (start < end) {
                            runs.push({ ...run, start, end });
                        }
                    }
                    nodes.set(node.id, { ...node, text: { ...node.text, content, runs } });
                    break;
                }
                case DesignOperationKind.Resize:
                case DesignOperationKind.Position:
                case DesignOperationKind.Translate:
                case DesignOperationKind.Rotate:
                case DesignOperationKind.Layout:
                case DesignOperationKind.Sizing:
                case DesignOperationKind.Typography:
                case DesignOperationKind.TextStyle:
                case DesignOperationKind.Scale: {
                    const current: DesignDocument = {
                        ...document,
                        ...metadata,
                        nodes: [...nodes.values()],
                        pages: [...pages.values()],
                    };
                    const context: DesignSelectionContext = new DesignSelectionContext(
                        current,
                        operation.pageId,
                        operation.op === DesignOperationKind.Position ||
                            operation.op === DesignOperationKind.Layout ||
                            operation.op === DesignOperationKind.Sizing ||
                            operation.op === DesignOperationKind.Typography ||
                            operation.op === DesignOperationKind.TextStyle
                            ? [operation.id]
                            : operation.selection,
                        measurer,
                    );
                    const changed: readonly DesignNode[] =
                        operation.op === DesignOperationKind.TextStyle
                            ? new DesignTextStyleEdits(context).apply(operation)
                            : operation.op === DesignOperationKind.Typography
                              ? new DesignTypographyEdits(context).apply(operation)
                              : operation.op === DesignOperationKind.Sizing
                                ? new DesignSizingEdits(context).apply(operation)
                                : operation.op === DesignOperationKind.Layout
                                  ? new DesignLayoutEdits(context).apply(operation)
                                  : operation.op === DesignOperationKind.Resize
                                    ? new DesignResizeEdits(context).apply(operation)
                                    : operation.op === DesignOperationKind.Position
                                      ? new DesignPositionEdits(context).apply(operation)
                                      : operation.op === DesignOperationKind.Rotate
                                        ? new DesignRotateEdits(context).apply(operation)
                                        : operation.op === DesignOperationKind.Scale
                                          ? new DesignScaleEdits(context).apply(operation)
                                          : new DesignTranslateEdits(context).apply(operation);
                    for (const node of changed) {
                        nodes.set(node.id, node);
                    }
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
                case DesignOperationKind.Guide: {
                    const page: DesignPage | undefined = pages.get(operation.pageId);
                    if (page === undefined) {
                        throw new Error('Page not found: ' + operation.pageId);
                    }
                    const guides: readonly DesignRulerGuide[] = page.guides ?? [];
                    const value: DesignGuideValue | null = operation.value;
                    const exists: boolean = guides.some(
                        (guide: DesignRulerGuide): boolean => guide.id === operation.id,
                    );
                    if (value === null && !exists) {
                        throw new Error('Page guide not found: ' + operation.id);
                    }
                    const next: readonly DesignRulerGuide[] =
                        value === null
                            ? guides.filter(
                                  (guide: DesignRulerGuide): boolean => guide.id !== operation.id,
                              )
                            : exists
                              ? guides.map((guide: DesignRulerGuide): DesignRulerGuide =>
                                    guide.id === operation.id
                                        ? { id: operation.id, ...value }
                                        : guide,
                                )
                              : [...guides, { id: operation.id, ...value }];
                    const rest: DesignPage = {
                        id: page.id,
                        name: page.name,
                        background: page.background,
                        roots: page.roots,
                    };
                    pages.set(page.id, next.length === 0 ? rest : { ...rest, guides: next });
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
                            ...page,
                            id: operation.id,
                            name: operation.name,
                            background: operation.background,
                            roots: page?.roots ?? [],
                        });
                    }
                    break;
                }
                case DesignOperationKind.Stroke: {
                    const node: DesignNode = DesignStrokeEdits.apply(
                        new DesignLayerAuthority(nodes, pages),
                        operation,
                    );
                    nodes.set(node.id, node);
                    break;
                }
                case DesignOperationKind.Style: {
                    const node: DesignNode = DesignStyleEdits.apply(
                        new DesignLayerAuthority(nodes, pages),
                        operation,
                    );
                    nodes.set(node.id, node);
                    break;
                }
                case DesignOperationKind.PaintImage: {
                    const node: DesignNode = DesignPaintImageEdits.apply(
                        new DesignLayerAuthority(nodes, pages),
                        operation,
                    );
                    nodes.set(node.id, node);
                    break;
                }
                case DesignOperationKind.PaintGradient: {
                    const node: DesignNode = DesignPaintGradientEdits.apply(
                        new DesignLayerAuthority(nodes, pages),
                        operation,
                    );
                    nodes.set(node.id, node);
                    break;
                }
                case DesignOperationKind.PaintColor: {
                    const node: DesignNode = DesignPaintColorEdits.apply(
                        new DesignLayerAuthority(nodes, pages),
                        metadata.tokens,
                        operation,
                    );
                    nodes.set(node.id, node);
                    break;
                }
                case DesignOperationKind.TypographyStyle: {
                    const node: DesignNode = DesignTypographyStyleEdits.apply(
                        new DesignLayerAuthority(nodes, pages),
                        metadata.tokens,
                        operation,
                    );
                    nodes.set(node.id, node);
                    break;
                }
                case DesignOperationKind.Token: {
                    const edited: DesignDocument = DesignTokenEdits.apply(
                        {
                            ...document,
                            ...metadata,
                            nodes: [...nodes.values()],
                            pages: [...pages.values()],
                        },
                        operation,
                    );
                    metadata = this.#metadata(edited);
                    for (const node of edited.nodes) {
                        nodes.set(node.id, node);
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
            nodes: DesignTypographyLinks.resolve([...nodes.values()], metadata.tokens),
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
            if (expected === null || next === null) {
                throw new Error('Document metadata changed since this edit');
            }
            metadata = {
                name: this.#restoreValue(metadata.name, expected.name, next.name),
                tokens: this.#restoreMetadataEntries(metadata.tokens, expected.tokens, next.tokens),
                interactions: this.#restoreMetadataEntries(
                    metadata.interactions,
                    expected.interactions,
                    next.interactions,
                ),
                comments: this.#restoreMetadataEntries(
                    metadata.comments,
                    expected.comments,
                    next.comments,
                ),
            };
        }
        const next: DesignDocument = DesignCodec.document({
            ...document,
            ...metadata,
            nodes,
            pages,
        });
        return { document: next, changes: this.diff(document, next) };
    }

    static #restoreMetadataEntries<T extends Identified>(
        source: readonly T[],
        expected: readonly T[],
        next: readonly T[],
    ): readonly T[] {
        if (Entity.equal(source, expected)) {
            return next;
        }
        const restored: readonly T[] = this.#restore(source, Entity.diff(expected, next), false);
        const original: ReadonlySet<string> = new Set(expected.map((entry: T): string => entry.id));
        const added: ReadonlySet<string> = new Set(
            next
                .filter((entry: T): boolean => !original.has(entry.id))
                .map((entry: T): string => entry.id),
        );
        if (added.size === 0) {
            return restored;
        }
        const values: ReadonlyMap<string, T> = new Map(
            restored.map((entry: T): [string, T] => [entry.id, entry]),
        );
        const ordered: T[] = restored.filter((entry: T): boolean => !added.has(entry.id));
        for (let index: number = 0; index < next.length; index++) {
            const item: T | undefined = next[index];
            if (item === undefined || !added.has(item.id)) {
                continue;
            }
            const value: T | undefined = values.get(item.id);
            if (value === undefined) {
                throw new Error('Missing restored metadata identity');
            }
            const anchor: T | undefined = next
                .slice(index + 1)
                .find((entry: T): boolean =>
                    ordered.some((current: T): boolean => current.id === entry.id),
                );
            const position: number =
                anchor === undefined
                    ? ordered.length
                    : ordered.findIndex((entry: T): boolean => entry.id === anchor.id);
            ordered.splice(position, 0, value);
        }
        return ordered;
    }
    static #restoreValue<T>(current: T, expected: T, next: T): T {
        if (Entity.equal(expected, next)) {
            return current;
        }
        if (!Entity.equal(current, expected)) {
            throw new Error('Document metadata changed since this edit');
        }
        return next;
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
