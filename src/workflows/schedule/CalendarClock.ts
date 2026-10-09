// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { Temporal } from '@js-temporal/polyfill';
import {
    WorkflowCalendarGap,
    WorkflowCalendarFold,
    type WorkflowCalendarTiming,
} from './CalendarTypes.js';

/** Pure named-zone calendar math; no process clock, I/O, persistent state or native-only API. */
export class WorkflowCalendarClock {
    readonly #time: Temporal.PlainTime;
    readonly #excluded: ReadonlySet<string>;
    readonly #days: ReadonlySet<number>;
    public constructor(public readonly timing: WorkflowCalendarTiming) {
        this.#time = Temporal.PlainTime.from(timing.time);
        this.#excluded = new Set(timing.exceptDates);
        this.#days = new Set(timing.weekdays);
    }
    public date(instant: bigint): Temporal.PlainDate {
        return Temporal.Instant.fromEpochNanoseconds(instant * 1_000_000n)
            .toZonedDateTimeISO(this.timing.timeZone)
            .toPlainDate();
    }
    /** At most one instant per local date, including folds and whole-date timezone jumps. */
    public occurrence(date: Temporal.PlainDate): bigint | null {
        const key: string = date.toString();
        if (
            key < this.timing.startDate ||
            key > (this.timing.endDate ?? '9999-12-31') ||
            !this.#days.has(date.dayOfWeek) ||
            this.#excluded.has(key)
        ) {
            return null;
        }
        const local: Temporal.PlainDateTime = date.toPlainDateTime(this.#time);
        const first: Temporal.ZonedDateTime = local.toZonedDateTime(this.timing.timeZone, {
            disambiguation: 'earlier',
        });
        const second: Temporal.ZonedDateTime = local.toZonedDateTime(this.timing.timeZone, {
            disambiguation: 'later',
        });
        if (first.epochNanoseconds === second.epochNanoseconds) {
            return first.epochNanoseconds / 1_000_000n;
        }
        if (first.toPlainDateTime().equals(local) && second.toPlainDateTime().equals(local)) {
            if (this.timing.fold === WorkflowCalendarFold.Skip) {
                return null;
            }
            return (
                (this.timing.fold === WorkflowCalendarFold.Second ? second : first)
                    .epochNanoseconds / 1_000_000n
            );
        }
        if (this.timing.gap === WorkflowCalendarGap.Skip) {
            return null;
        }
        const transition: Temporal.ZonedDateTime | null = second
            .add({ nanoseconds: 1 })
            .getTimeZoneTransition('previous');
        if (
            transition === null ||
            !transition.toPlainDate().equals(date) ||
            Temporal.PlainDateTime.compare(transition.toPlainDateTime(), local) < 0
        ) {
            return null;
        }
        return transition.epochNanoseconds / 1_000_000n;
    }
    /** Exception bounds and weekly recurrence provide a finite lookahead without scanning epoch minutes. */
    public next(after: bigint): string | null {
        if (after > 253_402_473_600_000n) {
            return null;
        }
        const start: Temporal.PlainDate = Temporal.PlainDate.from(this.timing.startDate);
        let date: Temporal.PlainDate = this.date(after);
        if (Temporal.PlainDate.compare(date, start) < 0) {
            date = start;
        }
        const limit: number = (this.timing.exceptDates.length + 8) * 8;
        for (let checked: number = 0; checked < limit; checked++) {
            if (date.year > 9999 || date.toString() > (this.timing.endDate ?? '9999-12-31')) {
                return null;
            }
            const occurrence: bigint | null = this.occurrence(date);
            if (occurrence !== null && occurrence > after) {
                return occurrence.toString();
            }
            date = date.add({ days: 1 });
        }
        throw new Error(
            'Calendar lookahead exceeded its bounded search; review the timezone and exceptions',
        );
    }
}
