// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from '../WorkflowInput.js';

/** Discovery of a registered source is not a grant or an executable resource binding. */
export const PlanningSourceState = {
    NeedsAdapter: 'needs-adapter',
    Unavailable: 'unavailable',
} as const;
export type PlanningSourceState = (typeof PlanningSourceState)[keyof typeof PlanningSourceState];
/** Metadata only. No filesystem paths, credentials, file contents, or host telemetry. */
export interface PlanningSource {
    readonly id: string;
    readonly name: string;
    readonly state: PlanningSourceState;
    readonly reason: string;
}
/** Owner-scoped catalog pagination; a cursor is an opaque source identity, not a path. */
export interface PlanningSourcesRequest {
    readonly workflowId: string;
    readonly after: string | null;
}
export interface PlanningSourcesPage {
    readonly available: boolean;
    readonly items: readonly PlanningSource[];
    readonly next: string | null;
}
/** Shared validation for discovery requests and explicitly selected metadata references. */
export class PlanningSourceCodec {
    public static request(raw: unknown): PlanningSourcesRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'after',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            after: value['after'] === null ? null : WorkflowInput.id(value['after']),
        };
    }
    public static ids(raw: unknown): readonly string[] {
        const ids: readonly string[] = WorkflowInput.list(raw, 16, (value: unknown): string =>
            WorkflowInput.id(value),
        );
        WorkflowInput.unique(ids);
        return ids;
    }
    public static source(raw: unknown): PlanningSource {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'name',
            'state',
            'reason',
        ]);
        const state: unknown = value['state'];
        if (
            state !== PlanningSourceState.NeedsAdapter &&
            state !== PlanningSourceState.Unavailable
        ) {
            throw new Error('Invalid planning source state');
        }
        return Object.freeze({
            id: WorkflowInput.id(value['id']),
            name: WorkflowInput.text(value['name'], 160),
            state,
            reason: WorkflowInput.text(value['reason'], 500),
        });
    }
}
