// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { expect, it } from 'vitest';
import { Method } from 'nexa-protocol/gateway/Method.js';
import type { WorkflowStepView } from 'nexa-protocol/workflows/runtime/RunRequests.js';
import type { WorkflowRunEvent } from 'nexa-protocol/workflows/runtime/RunTypes.js';
import { methodValidators } from 'nexa-protocol/schema/MethodValidators.js';

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
