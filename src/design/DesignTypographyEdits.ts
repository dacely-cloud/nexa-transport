// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignTypographyMerge } from './DesignTypographyMerge.js';
import type { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignNode, DesignText } from './DesignTypes.js';
import type { DesignTypographyOperation } from './DesignOperationTypes.js';

/** Partial base styles use complete native sources and retain authored rich-text overrides. */
export class DesignTypographyEdits {
    /** Shared selection authority verifies page ownership and locked ancestry. */
    public constructor(public readonly context: DesignSelectionContext) {}
    /** An unbound family or italic change releases an incompatible previous saved-font binding. */
    public apply(operation: DesignTypographyOperation): readonly DesignNode[] {
        const node: DesignNode = this.context.node(operation.id);
        if (node.text === null) {
            throw new Error('Layer has no editable typography: ' + node.id);
        }
        const previous: DesignText = node.text;
        let text: DesignText = DesignTypographyMerge.changes(previous, operation.changes);
        if (previous.typographyStyle != null) {
            const faceChanged: boolean =
                (operation.changes.family !== undefined &&
                    operation.changes.family !== previous.family) ||
                (operation.changes.italic !== undefined &&
                    operation.changes.italic !== previous.italic);
            text = {
                ...text,
                typographyStyle: {
                    ...previous.typographyStyle,
                    overrides: {
                        ...previous.typographyStyle.overrides,
                        ...operation.changes,
                        ...(faceChanged && operation.changes.font === undefined
                            ? { font: null }
                            : {}),
                    },
                },
            };
        }
        return JSON.stringify(previous) === JSON.stringify(text) ? [] : [{ ...node, text }];
    }
}
