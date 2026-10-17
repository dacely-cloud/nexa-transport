// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignCodec } from './DesignCodec.js';
import { DesignEdits } from './DesignEdits.js';
import { DesignSelectionContext as Context } from './DesignSelectionContext.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';
import { DesignTransferGraph } from './DesignTransferGraph.js';
import { DesignTransferLinks } from './DesignTransferLinks.js';
import type { DesignTransferRequest } from './DesignTransferTypes.js';
import type { DesignEditResult } from './DesignOperationTypes.js';
import type { DesignTextMeasurer } from './DesignLayoutTypes.js';
import type { DesignSelectionGeometry, DesignSelectionBounds } from './DesignSelectionTypes.js';
import {
    DesignKind,
    type DesignDocument,
    type DesignBox,
    type DesignNode,
    type DesignPage,
    type DesignPaint,
    type DesignStyle,
    type DesignText,
    type DesignTextRun,
    type DesignToken,
    type DesignInteraction,
} from './DesignTypes.js';

/** Immutable native cross-document copying preserves editable dependencies without wire hydration. */
export class DesignTransfer {
    /** Both documents must belong to the authenticated owner; the writer enforces revision pins atomically. */
    public static apply(
        source: DesignDocument,
        target: DesignDocument,
        request: DesignTransferRequest,
        identify: (key: string) => string,
        measurer: DesignTextMeasurer,
    ): DesignEditResult {
        const context: Context = new Context(
            source,
            request.sourcePageId,
            request.selection,
            measurer,
            true,
        );
        const graph: DesignTransferGraph = new DesignTransferGraph(context);
        const reused: ReadonlySet<string> = DesignTransferLinks.reusable(source, target, graph);
        const page: DesignPage | undefined = target.pages.find(
            (entry: DesignPage): boolean => entry.id === request.pageId,
        );
        if (page === undefined) {
            throw new Error('Destination page not found.');
        }
        const destination: Context | null =
            request.parentId === null
                ? null
                : new Context(target, page.id, [request.parentId], measurer);
        const parent: DesignNode | null =
            destination === null ? null : destination.node(request.parentId ?? '');
        if (
            parent !== null &&
            ![DesignKind.Frame, DesignKind.Group, DesignKind.Component].some(
                (kind: DesignKind): boolean => kind === parent.kind,
            )
        ) {
            throw new Error('Copy into a frame, group or component.');
        }
        const parentBox: DesignBox | null =
            parent === null || destination === null ? null : destination.box(parent.id);
        const content: ReadonlyMap<string, string> = new Map(
            [...graph.content].map((id: string): [string, string] => [id, identify('layer:' + id)]),
        );
        const dependencies: ReadonlyMap<string, string> = new Map(
            [...graph.dependencies].map((id: string): [string, string] => [
                id,
                reused.has(id) ? id : identify('definition:' + id),
            ]),
        );
        const tokens: Map<string, string> = new Map();
        const copiedTokens: DesignToken[] = [];
        const copyToken: (sourceId: string) => string = (sourceId: string): string => {
            const known: string | undefined = tokens.get(sourceId);
            if (known !== undefined) {
                return known;
            }
            const token: DesignToken | undefined = source.tokens.find(
                (entry: DesignToken): boolean => entry.id === sourceId,
            );
            if (token === undefined) {
                throw new Error('Missing copied design token.');
            }
            const id: string = identify('token:' + token.id);
            if (
                source.id === target.id &&
                target.tokens.some(
                    (value: DesignToken): boolean =>
                        value.id === token.id && value.category === token.category,
                )
            ) {
                tokens.set(token.id, token.id);
                return token.id;
            }
            tokens.set(token.id, id);
            copiedTokens.push({ ...token, id });
            return id;
        };
        const paint: (value: DesignPaint) => DesignPaint = (value: DesignPaint): DesignPaint => ({
            ...value,
            tokenId: value.tokenId === null ? null : copyToken(value.tokenId),
            ...(value.patternId == null
                ? {}
                : {
                      patternId:
                          value.kind === 'pattern'
                              ? graph.reference(value.patternId, content, dependencies)
                              : (content.get(value.patternId) ??
                                dependencies.get(value.patternId) ??
                                value.patternId),
                  }),
        });
        const style: (value: DesignStyle) => DesignStyle = (value: DesignStyle): DesignStyle => ({
            ...value,
            fills: value.fills.map(paint),
            stroke:
                value.stroke === null
                    ? null
                    : { ...value.stroke, paint: paint(value.stroke.paint) },
        });
        const roots: ReadonlySet<string> = new Set(
            context.roots.map((node: DesignNode): string => node.id),
        );
        const geometry: Map<string, DesignBox> = new Map();
        let left: number = Infinity;
        let top: number = Infinity;
        for (const node of context.roots) {
            const box: DesignBox = this.world(context, node.id);
            geometry.set(node.id, box);
            const bounds: DesignSelectionBounds = Context.bounds(box);
            left = Math.min(left, bounds.left);
            top = Math.min(top, bounds.top);
        }
        const clone: (
            id: string,
            mapping: ReadonlyMap<string, string>,
            library: boolean,
        ) => DesignNode = (
            id: string,
            mapping: ReadonlyMap<string, string>,
            library: boolean,
        ): DesignNode => {
            const node: DesignNode = context.node(id);
            const { variant, ...rest }: DesignNode = node;
            const root: boolean = !library && roots.has(id);
            const box: DesignBox | undefined = geometry.get(id);
            const local: DesignSelectionGeometry | null =
                root && box !== undefined
                    ? Context.relative(
                          {
                              ...box,
                              x: box.x - left + request.x,
                              y: box.y - top + request.y,
                          },
                          parentBox,
                      )
                    : null;
            const parentId: string | null = root
                ? request.parentId
                : (mapping.get(node.parentId ?? '') ?? null);
            return {
                ...rest,
                ...(variant === undefined || (root && !mapping.has(node.parentId ?? ''))
                    ? {}
                    : { variant }),
                id: this.#mapped(mapping, id),
                parentId,
                children: node.children.map((child: string): string =>
                    this.#mapped(mapping, child),
                ),
                ...(local === null
                    ? {}
                    : {
                          ...local,
                          placement: {
                              ...DesignSelectionTree.fixed(node, true),
                              contentReferenceWidth:
                                  node.placement.contentReferenceWidth ?? node.width,
                              contentReferenceHeight:
                                  node.placement.contentReferenceHeight ?? node.height,
                              ...(parentBox === null
                                  ? {}
                                  : {
                                        referenceWidth: parentBox.width,
                                        referenceHeight: parentBox.height,
                                    }),
                          },
                      }),
                style: style(node.style),
                text: this.#text(node.text, paint, copyToken),
                componentId:
                    node.componentId === null
                        ? null
                        : graph.reference(node.componentId, content, dependencies),
                overrides: node.overrides.map((override): DesignNode['overrides'][number] => ({
                    ...override,
                    nodeId: graph.reference(override.nodeId, content, dependencies),
                    style: override.style === null ? null : style(override.style),
                })),
                ...(node.mask === undefined
                    ? {}
                    : {
                          mask: {
                              ...node.mask,
                              sourceId:
                                  node.mask.sourceId === null
                                      ? null
                                      : this.#mapped(mapping, node.mask.sourceId),
                          },
                      }),
                ...(node.variants === undefined
                    ? {}
                    : {
                          variants: {
                              ...node.variants,
                              defaultId:
                                  node.variants.defaultId === null
                                      ? null
                                      : this.#mapped(mapping, node.variants.defaultId),
                          },
                      }),
            };
        };
        const additions: DesignNode[] = [...graph.content].map((id: string): DesignNode =>
            clone(id, content, false),
        );
        additions.push(
            ...[...graph.dependencies]
                .filter((id: string): boolean => !reused.has(id))
                .map((id: string): DesignNode => clone(id, dependencies, true)),
        );
        const selection: readonly string[] = context.roots.map((node: DesignNode): string =>
            this.#mapped(content, node.id),
        );
        const occupied: ReadonlySet<string> = new Set(
            [...target.nodes, ...additions].map((node: DesignNode): string => node.id),
        );
        let libraryId: string = 'imported-components';
        let suffix: number = 2;
        while (occupied.has(libraryId)) {
            libraryId = 'imported-components-' + String(suffix++);
        }
        const libraryRoots: readonly string[] = graph.dependencyRoots
            .filter((id: string): boolean => !reused.has(id))
            .map((id: string): string => this.#mapped(dependencies, id));
        const pages: DesignPage[] = target.pages.map((entry: DesignPage): DesignPage => ({
            ...entry,
            roots: [
                ...entry.roots,
                ...(entry.id === page.id && parent === null ? selection : []),
                ...(entry.id === libraryId ? libraryRoots : []),
            ],
        }));
        if (
            libraryRoots.length > 0 &&
            !pages.some((entry: DesignPage): boolean => entry.id === libraryId)
        ) {
            pages.push({
                id: libraryId,
                name: 'Imported components',
                roots: libraryRoots,
                background: '#F5F5F5',
            });
        }
        const interactions: DesignInteraction[] = [];
        for (const mapping of [content, dependencies]) {
            for (const interaction of source.interactions) {
                if (mapping === dependencies && reused.has(interaction.nodeId)) {
                    continue;
                }
                const nodeId: string | undefined = mapping.get(interaction.nodeId);
                const targetId: string | undefined =
                    mapping.get(interaction.targetId) ??
                    (mapping === content ? dependencies : content).get(interaction.targetId) ??
                    (source.id === target.id &&
                    target.nodes.some(
                        (node: DesignNode): boolean => node.id === interaction.targetId,
                    )
                        ? interaction.targetId
                        : undefined);
                if (nodeId !== undefined && targetId !== undefined) {
                    interactions.push({
                        ...interaction,
                        id: identify(
                            (mapping === content ? 'interaction:' : 'definition-interaction:') +
                                interaction.id,
                        ),
                        nodeId,
                        targetId,
                    });
                }
            }
        }
        const document: DesignDocument = DesignCodec.document({
            ...target,
            pages,
            nodes: [
                ...target.nodes.map((node: DesignNode): DesignNode =>
                    node.id !== parent?.id
                        ? node
                        : { ...node, children: [...node.children, ...selection] },
                ),
                ...additions,
            ],
            tokens: [...target.tokens, ...copiedTokens],
            interactions: [...target.interactions, ...interactions],
        });
        return { document, changes: DesignEdits.diff(target, document), selection };
    }
    /** Read-only source geometry also includes hidden and locked layers. */
    public static world(context: Context, id: string): DesignBox {
        const visible: DesignBox | undefined = context.boxes.get(id);
        if (visible !== undefined) {
            return visible;
        }
        const node: DesignNode = context.node(id);
        const local: DesignSelectionGeometry = { ...context.position(id), rotation: node.rotation };
        if (node.parentId === null) {
            return { ...local, id, depth: 0, clipId: null };
        }
        const parent: DesignBox = this.world(context, node.parentId);
        const angle: number = (parent.rotation * Math.PI) / 180;
        const x: number = local.x + local.width / 2 - parent.width / 2;
        const y: number = local.y + local.height / 2 - parent.height / 2;
        return {
            ...local,
            id,
            depth: parent.depth + 1,
            clipId: null,
            x:
                parent.x +
                parent.width / 2 +
                x * Math.cos(angle) -
                y * Math.sin(angle) -
                local.width / 2,
            y:
                parent.y +
                parent.height / 2 +
                x * Math.sin(angle) +
                y * Math.cos(angle) -
                local.height / 2,
            rotation: parent.rotation + local.rotation,
        };
    }
    static #mapped(mapping: ReadonlyMap<string, string>, id: string): string {
        const value: string | undefined = mapping.get(id);
        if (value === undefined) {
            throw new Error('Missing copied layer identity: ' + id);
        }
        return value;
    }
    static #text(
        text: DesignText | null,
        paint: (value: DesignPaint) => DesignPaint,
        copyToken: (id: string) => string,
    ): DesignText | null {
        if (text === null) {
            return null;
        }
        return {
            ...text,
            ...(text.typographyStyle == null
                ? {}
                : {
                      typographyStyle: {
                          ...text.typographyStyle,
                          tokenId: copyToken(text.typographyStyle.tokenId),
                      },
                  }),
            runs: text.runs.map((run: DesignTextRun): DesignTextRun =>
                run.fills == null ? run : { ...run, fills: run.fills.map(paint) },
            ),
        };
    }
}
