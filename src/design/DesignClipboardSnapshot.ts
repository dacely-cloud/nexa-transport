// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0
/** Pure selected-source capture; no clipboard body crosses an ordinary browser copy request. */
import { DesignCodec } from './DesignCodec.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';
import { DesignTransferGraph } from './DesignTransferGraph.js';
import { DesignTransfer } from './DesignTransfer.js';
import {
    DesignKind,
    type DesignDocument,
    type DesignNode,
    type DesignBox,
    type DesignPage,
    type DesignPlacement,
} from './DesignTypes.js';
import type { DesignTextMeasurer, DesignLocalBox } from './DesignLayoutTypes.js';
import type { DesignSelectionBounds } from './DesignSelectionTypes.js';

/** Complete selected forests, referenced definitions and the geometry needed to interpret their source roots. */
export interface DesignClipboardSnapshot {
    readonly document: DesignDocument;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly bounds: DesignSelectionBounds;
    readonly placements: readonly DesignClipboardRootPlacement[];
}

/** Original responsive sizing is retained separately from the captured resolved geometry. */
export interface DesignClipboardRootPlacement {
    readonly id: string;
    readonly placement: DesignPlacement;
}

/** Capture preserves original IDs so same-document pastes can retain existing component/style links. */
export class DesignClipboardCapture {
    /** Freezes selected source geometry and dependencies without retaining unrelated source bodies. */
    public static create(
        document: DesignDocument,
        pageId: string,
        selection: readonly string[],
        measurer: DesignTextMeasurer,
    ): DesignClipboardSnapshot {
        const context: DesignSelectionContext = new DesignSelectionContext(
            document,
            pageId,
            selection,
            measurer,
            true,
        );
        const graph: DesignTransferGraph = new DesignTransferGraph(context);
        const content: ReadonlySet<string> = new Set([...graph.content, ...graph.dependencies]);
        const retained: Set<string> = new Set(content);
        for (const interaction of document.interactions) {
            if (content.has(interaction.nodeId)) {
                retained.add(interaction.targetId);
            }
        }
        for (const id of [...retained]) {
            let parentId: string | null = context.node(id).parentId;
            while (parentId !== null && !retained.has(parentId)) {
                retained.add(parentId);
                parentId = context.node(parentId).parentId;
            }
        }
        const roots: ReadonlySet<string> = new Set(
            context.roots.map((node: DesignNode): string => node.id),
        );
        const geometryRequired: Set<string> = new Set();
        for (const node of context.roots) {
            let id: string | null = node.id;
            while (id !== null && !geometryRequired.has(id)) {
                geometryRequired.add(id);
                id = context.node(id).parentId;
            }
        }
        const nodes: DesignNode[] = [];
        for (const node of document.nodes) {
            if (!retained.has(node.id)) {
                continue;
            }
            const local: DesignLocalBox = geometryRequired.has(node.id)
                ? context.position(node.id)
                : { id: node.id, x: node.x, y: node.y, width: node.width, height: node.height };
            if (!content.has(node.id)) {
                const shell: DesignNode = DesignDefaults.node(node.id, DesignKind.Frame, node.name);
                nodes.push({
                    ...shell,
                    ...local,
                    rotation: node.rotation,
                    parentId: node.parentId,
                    children: node.children.filter((id: string): boolean => retained.has(id)),
                    style: { ...shell.style, fills: [] },
                });
                continue;
            }
            const { variant, ...base }: DesignNode = node;
            const parent: DesignNode | undefined = context.nodes.get(node.parentId ?? '');
            const parentSize: DesignLocalBox | null =
                parent === undefined || !roots.has(node.id) ? null : context.position(parent.id);
            nodes.push({
                ...base,
                ...(variant === undefined || (node.parentId !== null && !content.has(node.parentId))
                    ? {}
                    : { variant }),
                ...(roots.has(node.id)
                    ? {
                          ...local,
                          placement: {
                              ...DesignSelectionTree.fixed(node, true),
                              contentReferenceWidth:
                                  node.placement.contentReferenceWidth ?? node.width,
                              contentReferenceHeight:
                                  node.placement.contentReferenceHeight ?? node.height,
                              ...(parentSize === null
                                  ? {}
                                  : {
                                        referenceWidth: parentSize.width,
                                        referenceHeight: parentSize.height,
                                    }),
                          },
                      }
                    : {}),
            });
        }
        const pages: readonly DesignPage[] = document.pages
            .map((page: DesignPage): DesignPage => ({
                ...page,
                roots: page.roots.filter((id: string): boolean => retained.has(id)),
            }))
            .filter((page: DesignPage): boolean => page.id === pageId || page.roots.length > 0);
        const snapshot: DesignDocument = DesignCodec.document({
            ...document,
            nodes,
            pages,
            comments: [],
            interactions: document.interactions.filter((interaction): boolean =>
                content.has(interaction.nodeId),
            ),
        });
        const boxes: readonly DesignSelectionBounds[] = context.roots.map(
            (node: DesignNode): DesignSelectionBounds => {
                const box: DesignBox = DesignTransfer.world(context, node.id);
                return DesignSelectionContext.bounds(box);
            },
        );
        return {
            document: snapshot,
            pageId,
            selection: context.roots.map((node: DesignNode): string => node.id),
            placements: context.roots.map((node: DesignNode): DesignClipboardRootPlacement => ({
                id: node.id,
                placement: node.placement,
            })),
            bounds: {
                left: Math.min(...boxes.map((box: DesignSelectionBounds): number => box.left)),
                top: Math.min(...boxes.map((box: DesignSelectionBounds): number => box.top)),
                right: Math.max(...boxes.map((box: DesignSelectionBounds): number => box.right)),
                bottom: Math.max(...boxes.map((box: DesignSelectionBounds): number => box.bottom)),
            },
        };
    }
}
