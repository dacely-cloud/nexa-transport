// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Saved reasoning levels shared by workflows and provider requests; null uses the service default. */
export const WorkflowModelEffort = {
    Off: 'off',
    Minimal: 'minimal',
    Low: 'low',
    Medium: 'medium',
    High: 'high',
    XHigh: 'xhigh',
    Max: 'max',
} as const;
/** One explicit effort level, independent of model-selection policy. */
export type WorkflowModelEffort = (typeof WorkflowModelEffort)[keyof typeof WorkflowModelEffort];

/** Validates model effort at document and persisted-run boundaries. */
export class WorkflowModelEfforts {
    /** Older documents and service-default selections carry no explicit override. */
    public static parse(raw: unknown): WorkflowModelEffort | null {
        if (raw === undefined || raw === null || raw === '') {
            return null;
        }
        const effort: WorkflowModelEffort | undefined = Object.values(WorkflowModelEffort).find(
            (candidate: WorkflowModelEffort): boolean => candidate === raw,
        );
        if (effort === undefined) {
            throw new Error('Invalid workflow model effort');
        }
        return effort;
    }
}
