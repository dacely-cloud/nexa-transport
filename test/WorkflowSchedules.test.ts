import { ComponentRegistry } from '../src/workflows/ComponentRegistry.js';
import { WorkflowTimedTrigger } from '../src/workflows/TimedTrigger.js';
import { WorkflowGraphValidation } from '../src/workflows/GraphValidation.js';
import type { WorkflowNode } from '../src/workflows/WorkflowTypes.js';
import type { WorkflowRunSnapshot } from '../src/workflows/runtime/RunTypes.js';
import type {
    WorkflowScheduleRules,
    WorkflowScheduleConfiguration,
} from '../src/workflows/schedule/ScheduleTypes.js';
import type { WorkflowCalendarTiming } from '../src/workflows/schedule/CalendarTypes.js';
import type { WorkflowScheduleTiming } from '../src/workflows/schedule/ScheduleTypes.js';
import { WorkflowScheduleTimes } from '../src/workflows/schedule/ScheduleTiming.js';
import { expect, it } from 'vitest';
import { WorkflowScheduleCodec } from '../src/workflows/schedule/ScheduleCodec.js';
import type { WorkflowScheduleEnable } from '../src/workflows/schedule/ScheduleTypes.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
it('carries exact schedule revisions, reviewed policy and bounded scalar time values without caller authority', (): void => {
    const request: WorkflowScheduleEnable = {
        workflowId: 'workflow',
        commandId: 'enable',
        expectedRevision: '9007199254740993',
        configuration: {
            publicationId: 'release',
            timing: {
                kind: 'interval',
                startAtMs: '1791000000000',
                intervalMs: '3600000',
                endAtMs: null,
            },
            input: {},
            missed: 'catch-up',
            catchUpLimit: 3,
            lateGraceMs: '5000',
            maxConcurrentRuns: 2,
        },
    };
    expect(methodValidators[Method.WorkflowsSchedulesEnable].params(request)).toBe(true);
    expect(WorkflowScheduleCodec.enable(request)).toEqual(request);
    expect((): WorkflowScheduleEnable =>
        WorkflowScheduleCodec.enable({ ...request, principal: 'another-owner' }),
    ).toThrow();
    expect((): WorkflowScheduleEnable =>
        WorkflowScheduleCodec.enable({
            ...request,
            configuration: { ...request.configuration, catchUpLimit: 21 },
        }),
    ).toThrow();
    expect(
        methodValidators[Method.WorkflowsSchedulesDisable].params({
            workflowId: 'workflow',
            commandId: 'disable',
            expectedRevision: '9007199254740994',
        }),
    ).toBe(true);
});
it('preserves named-zone calendar policies through the wire contract and computes actual DST instants', (): void => {
    const timing: WorkflowCalendarTiming = {
        kind: 'calendar',
        time: '02:30',
        timeZone: 'America/New_York',
        weekdays: [7],
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        exceptDates: ['2026-03-15'],
        gap: 'next-valid',
        fold: 'second',
    };
    expect(
        methodValidators[Method.WorkflowsSchedulesPreview].params({ timing, afterMs: '0' }),
    ).toBe(true);
    expect(WorkflowScheduleCodec.timing(timing)).toEqual(timing);
    expect(
        WorkflowScheduleTimes.preview(timing, BigInt(Date.parse('2026-03-07T00:00:00Z'))),
    ).toEqual(
        ['2026-03-08T07:00:00Z', '2026-03-22T06:30:00Z', '2026-03-29T06:30:00Z'].map(
            (instant: string): string => BigInt(Date.parse(instant)).toString(),
        ),
    );
    expect((): WorkflowScheduleTiming =>
        WorkflowScheduleCodec.timing({ ...timing, timeZone: '+05:00' }),
    ).toThrow();
    expect((): WorkflowScheduleTiming =>
        WorkflowScheduleCodec.timing({ ...timing, weekdays: [] }),
    ).toThrow();
});
it('ships a real Timed Event contract and rejects activation rules that differ from its published node', (): void => {
    const node: WorkflowNode = ComponentRegistry.builtin().create('trigger.timed', '1', 'start');
    const rules: WorkflowScheduleRules | null = WorkflowTimedTrigger.read(node);
    if (rules === null) {
        throw new Error('Timed Event rules are missing');
    }
    const snapshot: WorkflowRunSnapshot = {
        format: 1,
        graph: { workflowId: 'workflow', revision: '1', nodes: [node], edges: [] },
        triggerNodeId: 'start',
        mode: 'live-test',
        input: {},
        maxConcurrency: 1,
        timeoutMs: '60000',
    };
    const configuration: WorkflowScheduleConfiguration = {
        ...rules,
        publicationId: 'release',
        input: {},
    };
    expect(WorkflowGraphValidation.inspect(snapshot.graph).valid).toBe(true);
    expect((): void => WorkflowTimedTrigger.assert(snapshot, configuration)).not.toThrow();
    expect((): void =>
        WorkflowTimedTrigger.assert(snapshot, { ...configuration, missed: 'latest' }),
    ).toThrow('does not match');
});

it('carries completion-relative timing and refuses policy combinations that would imply overlapping runs', (): void => {
    const configuration: WorkflowScheduleConfiguration = {
        publicationId: 'release',
        input: {},
        timing: { kind: 'after-completion', startAtMs: '0', intervalMs: '60001', endAtMs: null },
        missed: 'latest',
        catchUpLimit: 1,
        maxConcurrentRuns: 1,
        lateGraceMs: '1001',
    };
    const request: WorkflowScheduleEnable = {
        workflowId: 'workflow',
        commandId: 'enable',
        expectedRevision: '0',
        configuration,
    };
    expect(methodValidators[Method.WorkflowsSchedulesEnable].params(request)).toBe(true);
    expect(WorkflowScheduleCodec.enable(request)).toEqual(request);
    expect(WorkflowScheduleTimes.preview(configuration.timing, 100n)).toEqual(['60101']);
    expect((): WorkflowScheduleEnable =>
        WorkflowScheduleCodec.enable({
            ...request,
            configuration: { ...configuration, maxConcurrentRuns: 2 },
        }),
    ).toThrow('one run at a time');
});
