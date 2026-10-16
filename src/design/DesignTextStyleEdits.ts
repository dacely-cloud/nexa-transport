// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignNode, DesignText } from './DesignTypes.js';
import type { DesignTextStyleOperation } from './DesignOperationTypes.js';
import { DesignTextStyles } from './DesignTextStyles.js';

/** Authored range formatting shares page, lock and revision authority with other native operations. */
export class DesignTextStyleEdits {
    /** Complete native sources supply the actual body and rich ranges. */
    public constructor(public readonly context: DesignSelectionContext) {}
    /** Partial font/style changes leave base typography, geometry and all source characters untouched. */
    public apply(operation: DesignTextStyleOperation): readonly DesignNode[] {
        const node: DesignNode = this.context.node(operation.id);
        if (node.text === null) {
            throw new Error('Layer has no editable text styles: ' + node.id);
        }
        const text: DesignText = DesignTextStyles.apply(
            node.text,
            operation.start,
            operation.end,
            operation.changes,
        );
        return text === node.text ? [] : [{ ...node, text }];
    }
}
