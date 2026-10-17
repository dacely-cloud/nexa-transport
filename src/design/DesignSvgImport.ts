// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgImportLayers, type DesignSvgLayerImport } from './DesignSvgImportLayers.js';
import type { DesignSvgImportRequest } from './DesignSvgImportTypes.js';
import { DesignCodec } from './DesignCodec.js';
import { DesignEdits } from './DesignEdits.js';
import { DesignLayerAuthority } from './DesignLayerAuthority.js';
import type { DesignDocument, DesignNode, DesignPage } from './DesignTypes.js';
import type { DesignEditResult } from './DesignOperationTypes.js';
import type { DesignSvgImageLoader } from './DesignSvgImageTypes.js';
import type { DesignSvgFontLoader } from './DesignSvgFontTypes.js';

/** One owner-scoped revision transaction inserts the complete editable forest and records native undo. */
export class DesignSvgImport {
    public static async apply(
        document: DesignDocument,
        request: DesignSvgImportRequest,
        identify: (key: string) => string,
        images: DesignSvgImageLoader | null = null,
        fonts: DesignSvgFontLoader | null = null,
    ): Promise<DesignEditResult> {
        const pages: ReadonlyMap<string, DesignPage> = new Map(
            document.pages.map((page: DesignPage): [string, DesignPage] => [page.id, page]),
        );
        const page: DesignPage | undefined = pages.get(request.pageId);
        if (page === undefined) {
            throw new DesignSvgInputError('SVG import destination page not found.');
        }
        const nodes: ReadonlyMap<string, DesignNode> = new Map(
            document.nodes.map((node: DesignNode): [string, DesignNode] => [node.id, node]),
        );
        const parent: DesignNode | null =
            request.parentId === null
                ? null
                : new DesignLayerAuthority(nodes, pages).node(request.parentId, request.pageId);
        if (
            parent !== null &&
            parent.kind !== 'frame' &&
            parent.kind !== 'group' &&
            parent.kind !== 'component'
        ) {
            throw new DesignSvgInputError('Import SVG into a frame, group or component.');
        }
        const siblings: readonly string[] = parent?.children ?? page.roots;
        const index: number = request.index ?? siblings.length;
        if (index > siblings.length) {
            throw new DesignSvgInputError('SVG insertion index is outside its container.');
        }
        const imported: DesignSvgLayerImport = await DesignSvgImportLayers.parse(
            request.source,
            request.name,
            identify,
            images,
            fonts,
        );
        const roots: string[] = [...siblings];
        roots.splice(index, 0, imported.rootId);
        const additions: readonly DesignNode[] = imported.nodes.map(
            (node: DesignNode): DesignNode =>
                node.id === imported.rootId
                    ? { ...node, parentId: request.parentId, x: request.x, y: request.y }
                    : node,
        );
        const next: DesignDocument = DesignCodec.document({
            ...document,
            nodes: [
                ...document.nodes.map((node: DesignNode): DesignNode =>
                    node.id === request.parentId ? { ...node, children: roots } : node,
                ),
                ...additions,
            ],
            pages: [
                ...document.pages.map((source: DesignPage): DesignPage =>
                    parent === null && source.id === page.id ? { ...source, roots } : source,
                ),
                ...(imported.library === undefined ? [] : [imported.library]),
            ],
        });
        return {
            document: next,
            changes: DesignEdits.diff(document, next),
            selection: [imported.rootId],
        };
    }
}
