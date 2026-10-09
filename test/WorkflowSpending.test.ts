// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol';
import { WorkflowSpendingCodec } from '../src/workflows/runtime/RunSpendingCodec';
import type { WorkflowLoopSpendingView } from '../src/workflows/runtime/RunSpendingTypes';

it('exposes scoped spending reads and preserves exact amounts including refunds', (): void => {
    expect(Method.WorkflowsRunsLoopSpending).toBe('workflows.runs.loopSpending');
    expect(Method.WorkflowsRunsLoopPricing).toBe('workflows.runs.loopPricing');
    const report: WorkflowLoopSpendingView = {
        runId: 'run',
        loopId: 'loop',
        workflowId: 'workflow',
        revision: '1',
        observedAtMs: '200',
        reportedMicrocents: '-9007199254740993',
        reservedMicrocents: '2',
        reservationCount: 1,
        entries: '1',
        lastReportedAtMs: '100',
        limitMicrocents: null,
        deadlineAtMs: null,
        simulated: false,
    };
    expect(WorkflowSpendingCodec.view(report)).toEqual(report);
    expect((): void => {
        WorkflowSpendingCodec.view({ ...report, reservedMicrocents: 2 });
    }).toThrow();
    expect((): void => {
        WorkflowSpendingCodec.view({ ...report, simulated: true });
    }).toThrow();
    expect((): void => {
        WorkflowSpendingCodec.request({ runId: 'run', loopId: 'loop', userId: 'other' });
    }).toThrow();
});

it('validates the negotiated pricing partition instead of trusting inconsistent subtotals', (): void => {
    const report: WorkflowLoopSpendingView = {
        runId: 'run',
        loopId: 'loop',
        workflowId: 'workflow',
        revision: '1',
        observedAtMs: '200',
        reportedMicrocents: '30',
        reservedMicrocents: '0',
        reservationCount: 0,
        entries: '3',
        lastReportedAtMs: '100',
        limitMicrocents: null,
        deadlineAtMs: null,
        simulated: false,
        pricing: [
            { basis: 'wallet', microcents: '40', entries: '1' },
            { basis: 'adjustment', microcents: '-10', entries: '1' },
            { basis: 'unpriced', microcents: '0', entries: '1' },
        ],
    };
    expect(WorkflowSpendingCodec.view(report)).toEqual(report);
    expect((): void => {
        WorkflowSpendingCodec.view({ ...report, reportedMicrocents: '40' });
    }).toThrow();
});
