// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { Temporal } from '@js-temporal/polyfill';
import { WorkflowInput } from '../WorkflowInput.js';
import {
    WorkflowCalendarGap,
    WorkflowCalendarFold,
    type WorkflowCalendarTiming,
} from './CalendarTypes.js';

/** Named-zone and ISO calendar validation shared by the server and setup UI. */
export class WorkflowCalendarCodec {
    public static date(raw: unknown): string {
        if (typeof raw !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(raw)) {
            throw new Error('Choose a calendar date in YYYY-MM-DD format');
        }
        const date: Temporal.PlainDate = Temporal.PlainDate.from(raw, { overflow: 'reject' });
        if (date.year < 1970 || date.year > 9999) {
            throw new Error('Calendar dates must be between 1970 and 9999');
        }
        return date.toString();
    }
    public static read(raw: unknown): WorkflowCalendarTiming {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'kind',
            'time',
            'timeZone',
            'weekdays',
            'startDate',
            'endDate',
            'exceptDates',
            'gap',
            'fold',
        ]);
        if (value['kind'] !== 'calendar') {
            throw new Error('Select a calendar schedule');
        }
        const time: unknown = value['time'];
        if (typeof time !== 'string' || !/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/u.test(time)) {
            throw new Error('Choose a local time in HH:MM format');
        }
        const timeZone: unknown = value['timeZone'];
        if (
            typeof timeZone !== 'string' ||
            timeZone.length < 1 ||
            timeZone.length > 100 ||
            /^[+-]/u.test(timeZone)
        ) {
            throw new Error('Choose a named timezone, such as Europe/London');
        }
        Temporal.Instant.fromEpochNanoseconds(0n).toZonedDateTimeISO(timeZone);
        const weekdays: readonly number[] = WorkflowInput.list(
            value['weekdays'],
            7,
            (day: unknown): number => {
                if (typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > 7) {
                    throw new Error('Choose weekdays from Monday through Sunday');
                }
                return day;
            },
        );
        if (weekdays.length === 0 || new Set(weekdays).size !== weekdays.length) {
            throw new Error('Choose at least one weekday without duplicates');
        }
        const startDate: string = this.date(value['startDate']);
        const endDate: string | null =
            value['endDate'] === null ? null : this.date(value['endDate']);
        if (endDate !== null && endDate < startDate) {
            throw new Error('Calendar end date is before its start date');
        }
        const exceptDates: readonly string[] = WorkflowInput.list(
            value['exceptDates'],
            366,
            this.date.bind(this),
        );
        if (
            new Set(exceptDates).size !== exceptDates.length ||
            exceptDates.some(
                (date: string): boolean => date < startDate || (endDate !== null && date > endDate),
            )
        ) {
            throw new Error('Exception dates must be unique and within the schedule date bounds');
        }
        const gap: unknown = value['gap'];
        const fold: unknown = value['fold'];
        if (gap !== WorkflowCalendarGap.Skip && gap !== WorkflowCalendarGap.NextValid) {
            throw new Error('Choose how missing local times are handled');
        }
        if (
            fold !== WorkflowCalendarFold.First &&
            fold !== WorkflowCalendarFold.Second &&
            fold !== WorkflowCalendarFold.Skip
        ) {
            throw new Error('Choose how repeated local times are handled');
        }
        return {
            kind: 'calendar',
            time,
            timeZone,
            weekdays: weekdays.toSorted(),
            startDate,
            endDate,
            exceptDates: exceptDates.toSorted(),
            gap,
            fold,
        };
    }
}
