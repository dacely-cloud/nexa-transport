// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignStyleCodec } from './DesignStyleCodec.js';
import type { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignNode, DesignText, DesignTextRun } from './DesignTypes.js';
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
        const faceChanged: boolean =
            (operation.changes.family !== undefined &&
                operation.changes.family !== previous.family) ||
            (operation.changes.italic !== undefined &&
                operation.changes.italic !== previous.italic);
        const bindingChanged: boolean =
            operation.changes.font !== undefined &&
            JSON.stringify(operation.changes.font) !== JSON.stringify(previous.font);
        const runs: readonly DesignTextRun[] = previous.runs.map(
            (run: DesignTextRun): DesignTextRun =>
                previous.font != null &&
                (faceChanged || bindingChanged) &&
                run.font === undefined &&
                run.family.toLowerCase() === previous.family.toLowerCase() &&
                run.italic === previous.italic
                    ? { ...run, font: previous.font }
                    : run,
        );
        const text: DesignText = DesignStyleCodec.text({
            ...previous,
            ...operation.changes,
            runs,
            ...(faceChanged && operation.changes.font === undefined ? { font: null } : {}),
        });
        return JSON.stringify(previous) === JSON.stringify(text) ? [] : [{ ...node, text }];
    }
}
