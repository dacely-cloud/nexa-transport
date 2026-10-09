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
