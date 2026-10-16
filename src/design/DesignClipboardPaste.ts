// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignClipboardPlacement,
    type DesignClipboardPasteRequest,
} from './DesignClipboardTypes.js';
import type {
    DesignClipboardSnapshot,
    DesignClipboardRootPlacement,
} from './DesignClipboardSnapshot.js';
import { DesignTransfer } from './DesignTransfer.js';
import { DesignEdits } from './DesignEdits.js';
import { DesignCodec } from './DesignCodec.js';
import {
    DesignFlow,
    type DesignDocument,
    type DesignNode,
    type DesignPlacement,
} from './DesignTypes.js';
import type { DesignTextMeasurer } from './DesignLayoutTypes.js';
import type { DesignEditResult } from './DesignOperationTypes.js';

/** Native snapshots paste as ordinary editable forests with portable geometry and responsive sizing. */
export class DesignClipboardPaste {
    /** Auto-layout destinations accept copied roots into flow; freeform destinations retain captured visual dimensions. */
    public static apply(
        snapshot: DesignClipboardSnapshot,
        target: DesignDocument,
        request: DesignClipboardPasteRequest,
        identify: (key: string) => string,
        measurer: DesignTextMeasurer,
    ): DesignEditResult {
        const x: number =
            request.placement === DesignClipboardPlacement.Original
                ? snapshot.bounds.left
                : request.placement === DesignClipboardPlacement.Center
                  ? request.x - (snapshot.bounds.right - snapshot.bounds.left) / 2
                  : request.x;
        const y: number =
            request.placement === DesignClipboardPlacement.Original
                ? snapshot.bounds.top
                : request.placement === DesignClipboardPlacement.Center
                  ? request.y - (snapshot.bounds.bottom - snapshot.bounds.top) / 2
                  : request.y;
        const copied: DesignEditResult = DesignTransfer.apply(
            snapshot.document,
            target,
            {
                id: request.id,
                expectedRevision: request.expectedRevision,
                commandId: request.commandId,
                sourceId: snapshot.document.id,
                sourceRevision: snapshot.document.revision,
                sourcePageId: snapshot.pageId,
                selection: snapshot.selection,
                pageId: request.pageId,
                parentId: request.parentId,
                x,
                y,
            },
            identify,
            measurer,
        );
        const parent: DesignNode | undefined = target.nodes.find(
            (node: DesignNode): boolean => node.id === request.parentId,
        );
        if (parent === undefined || parent.layout.flow === DesignFlow.Absolute) {
            return copied;
        }
        const placements: ReadonlyMap<string, DesignPlacement> = new Map(
            snapshot.placements.map(
                (root: DesignClipboardRootPlacement): readonly [string, DesignPlacement] => [
                    identify('layer:' + root.id),
                    root.placement,
                ],
            ),
        );
        const document: DesignDocument = DesignCodec.document({
            ...copied.document,
            nodes: copied.document.nodes.map((node: DesignNode): DesignNode => {
                const placement: DesignPlacement | undefined = placements.get(node.id);
                return placement === undefined
                    ? node
                    : { ...node, placement: { ...placement, absolute: false } };
            }),
        });
        return {
            document,
            selection: copied.selection ?? [],
            changes: DesignEdits.diff(target, document),
        };
    }
}
