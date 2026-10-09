// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { Method, type WorkflowStepView, type WorkflowRunEvent } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

it('validates iteration provenance while retaining ordinary run history compatibility', (): void => {
    const step: WorkflowStepView = {
        nodeId: 'each-instance',
        invocationId: 'invocation',
        attempt: 1,
        component: 'agent.run',
        label: 'Research / item 1',
        status: 'succeeded',
        startedAtMs: '100',
        finishedAtMs: '200',
        message: null,
        hasResult: true,
    };
    const event: WorkflowRunEvent = {
        runId: 'run',
        nodeId: step.nodeId,
        invocationId: step.invocationId,
        sequence: '2',
        atMs: '200',
        kind: 'step-finished',
        status: 'succeeded',
        message: null,
    };
    expect(methodValidators[Method.WorkflowsRunsSteps].result({ items: [step], next: null })).toBe(
        true,
    );
    expect(methodValidators[Method.WorkflowsRunsEvents].result([event])).toBe(true);
    const repeated: WorkflowStepView = {
        ...step,
        origin: { nodeId: 'research', loopId: 'collection', itemIndex: 0 },
    };
    expect(
        methodValidators[Method.WorkflowsRunsSteps].result({ items: [repeated], next: null }),
    ).toBe(true);
    expect(
        methodValidators[Method.WorkflowsRunsEvents].result([
            { ...event, origin: repeated.origin },
        ]),
    ).toBe(true);
    expect(
        methodValidators[Method.WorkflowsRunsSteps].result({
            items: [{ ...repeated, origin: { nodeId: 'research', itemIndex: 0 } }],
            next: null,
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.WorkflowsRunsEvents].result([
            { ...event, origin: { ...repeated.origin, itemIndex: '0' } },
        ]),
    ).toBe(false);
});
