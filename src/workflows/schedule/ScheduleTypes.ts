// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowObject } from '../WorkflowTypes.js';

/** Fixed elapsed intervals are anchored to an instant; they never drift with run completion. */
export const WorkflowScheduleKind = { Interval: 'interval', Once: 'once' } as const;
/** Supported timing forms, with inclusive start and end instants. */
export type WorkflowScheduleTiming = WorkflowIntervalTiming | WorkflowOnceTiming;
/** Millisecond strings preserve exact instants across transport and MongoDB. */
export interface WorkflowIntervalTiming {
    readonly kind: typeof WorkflowScheduleKind.Interval;
    readonly startAtMs: string;
    readonly intervalMs: string;
    readonly endAtMs: string | null;
}
/** A single UTC instant, displayed in the user's selected timezone by the client. */
export interface WorkflowOnceTiming {
    readonly kind: typeof WorkflowScheduleKind.Once;
    readonly atMs: string;
}
/** Late occurrences are skipped, coalesced into the latest, or replayed up to a configured cap. */
export const WorkflowScheduleMissed = {
    Skip: 'skip',
    Latest: 'latest',
    CatchUp: 'catch-up',
} as const;
/** Explicit outage handling policy. */
export type WorkflowScheduleMissed =
    (typeof WorkflowScheduleMissed)[keyof typeof WorkflowScheduleMissed];
/** Activation never follows a mutable published pointer or changes a draft. */
export interface WorkflowScheduleConfiguration {
    readonly publicationId: string;
    readonly timing: WorkflowScheduleTiming;
    readonly input: WorkflowObject;
    readonly missed: WorkflowScheduleMissed;
    readonly catchUpLimit: number;
    readonly lateGraceMs: string;
    readonly maxConcurrentRuns: number;
}
/** Configuration revision is independent of execution progress. */
export interface WorkflowScheduleCommand {
    readonly workflowId: string;
    readonly commandId: string;
    readonly expectedRevision: string;
}
/** Explicit enable or replace command containing the reviewed complete configuration. */
export interface WorkflowScheduleEnable extends WorkflowScheduleCommand {
    readonly configuration: WorkflowScheduleConfiguration;
}
/** Owner-scoped current automation state. */
export interface WorkflowScheduleRead {
    readonly workflowId: string;
}
/** Preview performs no activation, storage mutation or run preparation. */
export interface WorkflowSchedulePreview {
    readonly timing: WorkflowScheduleTiming;
    readonly afterMs: string;
}
/** UI and runtime share these lifecycle meanings. */
export const WorkflowScheduleStatus = {
    Enabled: 'enabled',
    Disabled: 'disabled',
    Blocked: 'blocked',
    Complete: 'complete',
} as const;
/** Durable activation state, separate from run status. */
export type WorkflowScheduleStatus =
    (typeof WorkflowScheduleStatus)[keyof typeof WorkflowScheduleStatus];
/** Last dispatch outcome is bounded metadata; accepted work remains in the run journal. */
export const WorkflowScheduleOutcome = {
    Accepted: 'accepted',
    Skipped: 'skipped',
    Blocked: 'blocked',
} as const;
/** Concise automation status evidence. */
export interface WorkflowScheduleEvent {
    readonly occurrenceMs: string;
    readonly atMs: string;
    readonly outcome: (typeof WorkflowScheduleOutcome)[keyof typeof WorkflowScheduleOutcome];
    readonly runId: string | null;
    readonly message: string | null;
}
/** No graph, outputs, credentials or unbounded event collections are embedded here. */
export interface WorkflowScheduleView {
    readonly workflowId: string;
    readonly revision: string;
    readonly configuration: WorkflowScheduleConfiguration;
    readonly status: WorkflowScheduleStatus;
    readonly nextAtMs: string | null;
    readonly pendingCount: number;
    readonly skippedOccurrences: string;
    readonly last: WorkflowScheduleEvent | null;
    readonly updatedAtMs: string;
}
/** Immutable provenance included in both the execution snapshot and run metadata. */
export interface WorkflowScheduleSource {
    readonly revision: string;
    readonly occurrenceMs: string;
}
