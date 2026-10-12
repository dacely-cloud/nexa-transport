// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignStyleCodec } from './DesignStyleCodec.js';
import type { DesignText, DesignTextRun } from './DesignTypes.js';
import type { DesignTypographyOverrides } from './DesignTypographyStyleTypes.js';

/** Base typography changes retain source characters, rich styles and previously inherited private faces. */
export class DesignTypographyMerge {
    /** A family or italic change without an explicit font releases the incompatible previous binding. */
    public static changes(previous: DesignText, changes: DesignTypographyOverrides): DesignText {
        const faceChanged: boolean =
            (changes.family !== undefined && changes.family !== previous.family) ||
            (changes.italic !== undefined && changes.italic !== previous.italic);
        const bindingChanged: boolean =
            changes.font !== undefined &&
            JSON.stringify(changes.font) !== JSON.stringify(previous.font);
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
        return DesignStyleCodec.text({
            ...previous,
            ...changes,
            runs,
            ...(faceChanged && changes.font === undefined ? { font: null } : {}),
        });
    }
}
