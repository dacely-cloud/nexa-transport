// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowCalendarRecovery } from './CalendarTypes.js';
import { WorkflowCalendarClock } from './CalendarClock.js';
import { WorkflowCalendarBatches } from './CalendarRecovery.js';
import {
    WorkflowScheduleKind,
    WorkflowScheduleMissed,
    type WorkflowScheduleTiming,
    type WorkflowScheduleConfiguration,
} from './ScheduleTypes.js';

/** A bounded recovery batch advances past all evaluated occurrences, including intentionally skipped ones. */
export interface WorkflowScheduleBatch {
    readonly recovery?: WorkflowCalendarRecovery;
    readonly pending: readonly string[];
    readonly nextAtMs: string | null;
    readonly skipped: string;
}
/** Exact fixed-interval arithmetic has constant cost even after years of downtime. */
export class WorkflowScheduleTimes {
    /** First occurrence strictly after an instant; start/end bounds remain inclusive. */
    public static next(timing: WorkflowScheduleTiming, after: bigint): string | null {
        if (timing.kind === WorkflowScheduleKind.Calendar) {
            return new WorkflowCalendarClock(timing).next(after);
        }
        if (timing.kind === WorkflowScheduleKind.Once) {
            return BigInt(timing.atMs) > after ? timing.atMs : null;
        }
        const start: bigint = BigInt(timing.startAtMs);
        const interval: bigint = BigInt(timing.intervalMs);
        const next: bigint =
            after < start ? start : start + ((after - start) / interval + 1n) * interval;
        return next > 8_640_000_000_000_000n ||
            (timing.endAtMs !== null && next > BigInt(timing.endAtMs))
            ? null
            : next.toString();
    }
    /** No runs, subscriptions or preparation are created by previews. */
    public static preview(timing: WorkflowScheduleTiming, after: bigint): readonly string[] {
        const times: string[] = [];
        let cursor: bigint = after;
        for (let index: number = 0; index < 5; index++) {
            const next: string | null = this.next(timing, cursor);
            if (next === null) {
                break;
            }
            times.push(next);
            cursor = BigInt(next);
        }
        return times;
    }
    /** Catch-up takes the oldest bounded occurrences; later missed occurrences are explicitly skipped. */
    public static due(
        configuration: WorkflowScheduleConfiguration,
        firstMs: string,
        now: bigint,
        recovery: WorkflowCalendarRecovery | null = null,
    ): WorkflowScheduleBatch {
        const first: bigint = BigInt(firstMs);
        if (first > now) {
            return { pending: [], nextAtMs: firstMs, skipped: '0' };
        }
        const timing: WorkflowScheduleTiming = configuration.timing;
        if (timing.kind === WorkflowScheduleKind.Calendar) {
            return WorkflowCalendarBatches.due(configuration, timing, firstMs, now, recovery);
        }
        const interval: bigint =
            timing.kind === WorkflowScheduleKind.Once ? 1n : BigInt(timing.intervalMs);
        const end: bigint =
            timing.kind === WorkflowScheduleKind.Interval &&
            timing.endAtMs !== null &&
            BigInt(timing.endAtMs) < now
                ? BigInt(timing.endAtMs)
                : now;
        const count: bigint =
            timing.kind === WorkflowScheduleKind.Once ? 1n : (end - first) / interval + 1n;
        const latest: bigint = first + (count - 1n) * interval;
        const nextAtMs: string | null = this.next(timing, now);
        if (configuration.missed === WorkflowScheduleMissed.Latest) {
            return { pending: [latest.toString()], nextAtMs, skipped: (count - 1n).toString() };
        }
        const pending: string[] = [];
        if (configuration.missed === WorkflowScheduleMissed.Skip) {
            const cutoff: bigint = now - BigInt(configuration.lateGraceMs);
            const offset: bigint =
                cutoff <= first ? 0n : (cutoff - first + interval - 1n) / interval;
            for (
                let index: bigint = offset;
                index < count && pending.length < configuration.catchUpLimit;
                index++
            ) {
                pending.push((first + index * interval).toString());
            }
        } else {
            for (
                let index: bigint = 0n;
                index < count && pending.length < configuration.catchUpLimit;
                index++
            ) {
                pending.push((first + index * interval).toString());
            }
        }
        return { pending, nextAtMs, skipped: (count - BigInt(pending.length)).toString() };
    }
}
