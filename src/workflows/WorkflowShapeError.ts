// SPDX-License-Identifier: Apache-2.0

/** Identifies a rejected data shape without copying unexpected field names or values. */
export class WorkflowShapeError extends Error {
    /** Expected and missing names come from the host's declared schema. */
    public constructor(
        expected: readonly string[],
        missing: readonly string[],
        unexpected: number,
    ) {
        super(
            `Unexpected or missing workflow fields. Expected exactly: ${expected.join(', ')}. ` +
                `Missing: ${missing.join(', ') || 'none'}. Unexpected field count: ${unexpected}.`,
        );
        this.name = 'WorkflowShapeError';
    }
}
