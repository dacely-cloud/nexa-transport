// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignDocument, DesignNode } from './DesignTypes.js';
import { DesignSelectionIndex } from './DesignSelectionIndex.js';
import { DesignEdits } from './DesignEdits.js';
import {
    DesignOperationKind,
    type DesignOperation,
    type DesignEditResult,
} from './DesignOperationTypes.js';

/** Cutting removes topmost selected forests using ordinary reversible scene edits. */
export class DesignClipboardCut {
    /** Locked ancestry, other pages and invalid remaining references reject before any source is removed. */
    public static apply(
        document: DesignDocument,
        pageId: string,
        selection: readonly string[],
    ): DesignEditResult {
        const context: DesignSelectionIndex = new DesignSelectionIndex(document, pageId, selection);
        const operations: readonly DesignOperation[] = context.roots.map(
            (node: DesignNode): DesignOperation => ({
                op: DesignOperationKind.Remove,
                id: node.id,
            }),
        );
        return { ...DesignEdits.apply(document, operations), selection: [] };
    }
}
