// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { Temporal } from '@js-temporal/polyfill';
import { WorkflowCalendarClock } from './CalendarClock.js';
import type { WorkflowCalendarRecovery, WorkflowCalendarTiming } from './CalendarTypes.js';
import { WorkflowScheduleMissed, type WorkflowScheduleConfiguration } from './ScheduleTypes.js';
import type { WorkflowScheduleBatch } from './ScheduleTiming.js';

/** Recovery evaluates at most 64 local dates per pass and persists the original outage horizon. */
export class WorkflowCalendarBatches {
    public static due(
        configuration: WorkflowScheduleConfiguration,
        timing: WorkflowCalendarTiming,
        firstMs: string,
        now: bigint,
        previous: WorkflowCalendarRecovery | null,
    ): WorkflowScheduleBatch {
        const clock: WorkflowCalendarClock = new WorkflowCalendarClock(timing);
        const throughMs: string = previous?.throughMs ?? now.toString();
        const through: bigint = BigInt(throughMs);
        const first: bigint = BigInt(firstMs);
        let date: Temporal.PlainDate = Temporal.PlainDate.from(
            previous?.cursorDate ?? clock.date(first).toString(),
        );
        const horizon: Temporal.PlainDate = clock.date(through);
        const end: Temporal.PlainDate = Temporal.PlainDate.from(timing.endDate ?? '9999-12-31');
        const last: Temporal.PlainDate =
            Temporal.PlainDate.compare(horizon, end) > 0 ? end : horizon;
        let count: bigint = BigInt(previous?.count ?? '0');
        let latest: string | null = previous?.latest ?? null;
        const pending: string[] = [...(previous?.pending ?? [])];
        for (
            let visited: number = 0;
            visited < 64 && Temporal.PlainDate.compare(date, last) <= 0;
            visited++
        ) {
            const occurrence: bigint | null = clock.occurrence(date);
            if (occurrence !== null && occurrence >= first && occurrence <= through) {
                count++;
                latest = occurrence.toString();
                if (
                    configuration.missed !== WorkflowScheduleMissed.Latest &&
                    pending.length < configuration.catchUpLimit &&
                    (configuration.missed === WorkflowScheduleMissed.CatchUp ||
                        occurrence >= through - BigInt(configuration.lateGraceMs))
                ) {
                    pending.push(occurrence.toString());
                }
            }
            date = date.add({ days: 1 });
        }
        if (Temporal.PlainDate.compare(date, last) <= 0) {
            return {
                pending: [],
                nextAtMs: firstMs,
                skipped: '0',
                recovery: {
                    firstMs,
                    throughMs,
                    cursorDate: date.toString(),
                    count: count.toString(),
                    latest,
                    pending,
                },
            };
        }
        if (configuration.missed === WorkflowScheduleMissed.Latest && latest !== null) {
            pending.push(latest);
        }
        return {
            pending,
            nextAtMs: clock.next(through),
            skipped: (count - BigInt(pending.length)).toString(),
        };
    }
}
