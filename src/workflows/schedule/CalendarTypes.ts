// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Calendar times are resolved in the named zone instead of by adding elapsed milliseconds. */
export const WorkflowCalendarGap = { Skip: 'skip', NextValid: 'next-valid' } as const;
/** Missing local times are skipped or moved to the first valid instant on the same local date. */
export type WorkflowCalendarGap = (typeof WorkflowCalendarGap)[keyof typeof WorkflowCalendarGap];
/** A repeated local time always contributes at most one scheduled occurrence. */
export const WorkflowCalendarFold = { First: 'first', Second: 'second', Skip: 'skip' } as const;
/** Explicit repeated-time policy. */
export type WorkflowCalendarFold = (typeof WorkflowCalendarFold)[keyof typeof WorkflowCalendarFold];
/** Weekdays use ISO numbering: Monday 1 through Sunday 7; date bounds/exceptions are local dates. */
export interface WorkflowCalendarTiming {
    readonly kind: 'calendar';
    readonly time: string;
    readonly timeZone: string;
    readonly weekdays: readonly number[];
    readonly startDate: string;
    readonly endDate: string | null;
    readonly exceptDates: readonly string[];
    readonly gap: WorkflowCalendarGap;
    readonly fold: WorkflowCalendarFold;
}
/** Internal recovery checkpoint keeps one outage horizon and cap across worker restarts. */
export interface WorkflowCalendarRecovery {
    readonly firstMs: string;
    readonly throughMs: string;
    readonly cursorDate: string;
    readonly count: string;
    readonly latest: string | null;
    readonly pending: readonly string[];
}
