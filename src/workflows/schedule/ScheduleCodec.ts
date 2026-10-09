// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowCalendarCodec } from './CalendarCodec.js';
import { WorkflowInput } from '../WorkflowInput.js';
import { WorkflowJson } from '../WorkflowJson.js';
import { ResourceBindingCodec } from '../ResourceBindingCodec.js';
import {
    WorkflowScheduleKind,
    WorkflowScheduleMissed,
    type WorkflowScheduleTiming,
    type WorkflowScheduleConfiguration,
    type WorkflowScheduleRules,
    type WorkflowScheduleEnable,
    type WorkflowScheduleCommand,
    type WorkflowSchedulePreview,
    type WorkflowScheduleRead,
    type WorkflowScheduleSource,
} from './ScheduleTypes.js';

/** Portable strict request boundaries reject caller-supplied owners and runtime cursors. */
export class WorkflowScheduleCodec {
    /** Date-compatible positive UTC instants with exact millisecond precision. */
    public static instant(raw: unknown): string {
        const value: string = ResourceBindingCodec.decimal(raw);
        if (BigInt(value) > 8_640_000_000_000_000n) {
            throw new Error('Schedule instant is outside the supported calendar range');
        }
        return value;
    }
    /** Recurrence is bounded to one minute through one year. */
    public static timing(raw: unknown): WorkflowScheduleTiming {
        if (
            raw !== null &&
            typeof raw === 'object' &&
            Reflect.get(raw, 'kind') === WorkflowScheduleKind.Calendar
        ) {
            return WorkflowCalendarCodec.read(raw);
        }
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(
            raw,
            raw !== null &&
                typeof raw === 'object' &&
                Reflect.get(raw, 'kind') === WorkflowScheduleKind.Once
                ? ['kind', 'atMs']
                : ['kind', 'startAtMs', 'intervalMs', 'endAtMs'],
        );
        if (value['kind'] === WorkflowScheduleKind.Once) {
            return { kind: WorkflowScheduleKind.Once, atMs: this.instant(value['atMs']) };
        }
        if (
            value['kind'] !== WorkflowScheduleKind.Interval &&
            value['kind'] !== WorkflowScheduleKind.Completion
        ) {
            throw new Error('Choose a supported schedule timing mode');
        }
        const startAtMs: string = this.instant(value['startAtMs']);
        const endAtMs: string | null =
            value['endAtMs'] === null ? null : this.instant(value['endAtMs']);
        const intervalMs: string = ResourceBindingCodec.decimal(value['intervalMs']);
        if (BigInt(intervalMs) < 60_000n || BigInt(intervalMs) > 31_536_000_000n) {
            throw new Error('Schedule interval must be between one minute and one year');
        }
        if (endAtMs !== null && BigInt(endAtMs) < BigInt(startAtMs)) {
            throw new Error('Schedule end must be at or after its start');
        }
        return { kind: value['kind'], startAtMs, intervalMs, endAtMs };
    }
    /** Bounded recovery and overlap are part of the owner's reviewed activation. */
    public static configuration(raw: unknown): WorkflowScheduleConfiguration {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'publicationId',
            'timing',
            'input',
            'missed',
            'catchUpLimit',
            'lateGraceMs',
            'maxConcurrentRuns',
        ]);
        const configuration: WorkflowScheduleConfiguration = {
            publicationId: WorkflowInput.id(value['publicationId']),
            input: WorkflowJson.object(value['input']),
            ...this.rules({
                timing: value['timing'],
                missed: value['missed'],
                catchUpLimit: value['catchUpLimit'],
                lateGraceMs: value['lateGraceMs'],
                maxConcurrentRuns: value['maxConcurrentRuns'],
            }),
        };
        if (JSON.stringify(configuration).length > 65_536) {
            throw new Error(
                'Schedule configuration is too large; use resource references for input',
            );
        }
        return configuration;
    }
    /** Shared graph/activation policy validation; neither path invents a different timing contract. */
    public static rules(raw: unknown): WorkflowScheduleRules {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'timing',
            'missed',
            'catchUpLimit',
            'lateGraceMs',
            'maxConcurrentRuns',
        ]);
        const missed: unknown = value['missed'];
        if (
            missed !== WorkflowScheduleMissed.Skip &&
            missed !== WorkflowScheduleMissed.Latest &&
            missed !== WorkflowScheduleMissed.CatchUp
        ) {
            throw new Error('Choose how missed schedule occurrences are handled');
        }
        const lateGraceMs: string = ResourceBindingCodec.decimal(value['lateGraceMs']);
        if (BigInt(lateGraceMs) < 1_000n || BigInt(lateGraceMs) > 300_000n) {
            throw new Error('Schedule lateness grace must be between one second and five minutes');
        }
        const rules: WorkflowScheduleRules = {
            timing: this.timing(value['timing']),
            missed,
            catchUpLimit: this.#count(value['catchUpLimit'], 20),
            lateGraceMs,
            maxConcurrentRuns: this.#count(value['maxConcurrentRuns'], 32),
        };
        if (
            rules.timing.kind === WorkflowScheduleKind.Completion &&
            (rules.maxConcurrentRuns !== 1 ||
                rules.catchUpLimit !== 1 ||
                rules.missed === WorkflowScheduleMissed.CatchUp)
        ) {
            throw new Error(
                'After-completion timing requires one run at a time and a recovery limit of one. Choose skip or run the missed occurrence.',
            );
        }
        return rules;
    }
    /** A missing schedule has revision zero; every enable/disable creates a new revision. */
    public static command(raw: unknown): WorkflowScheduleCommand {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'commandId',
            'expectedRevision',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            commandId: WorkflowInput.id(value['commandId']),
            expectedRevision: ResourceBindingCodec.decimal(value['expectedRevision']),
        };
    }
    /** Replacing a schedule always requires an explicit review of the full configuration. */
    public static enable(raw: unknown): WorkflowScheduleEnable {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'commandId',
            'expectedRevision',
            'configuration',
        ]);
        return {
            ...this.command({
                workflowId: value['workflowId'],
                commandId: value['commandId'],
                expectedRevision: value['expectedRevision'],
            }),
            configuration: this.configuration(value['configuration']),
        };
    }
    /** Current registration identity without caller-controlled account information. */
    public static read(raw: unknown): WorkflowScheduleRead {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, ['workflowId']);
        return { workflowId: WorkflowInput.id(value['workflowId']) };
    }
    /** Preview times use the same exact timing contract as activation. */
    public static preview(raw: unknown): WorkflowSchedulePreview {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'timing',
            'afterMs',
        ]);
        return { timing: this.timing(value['timing']), afterMs: this.instant(value['afterMs']) };
    }
    /** Scheduled provenance cannot be attached to a test run. */
    public static source(raw: unknown): WorkflowScheduleSource {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'revision',
            'occurrenceMs',
        ]);
        const revision: string = ResourceBindingCodec.decimal(value['revision']);
        if (revision === '0') {
            throw new Error('Scheduled run requires an activation revision');
        }
        return { revision, occurrenceMs: this.instant(value['occurrenceMs']) };
    }
    static #count(raw: unknown, max: number): number {
        if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1 || raw > max) {
            throw new Error(`Schedule limit must be between 1 and ${max}`);
        }
        return raw;
    }
}
