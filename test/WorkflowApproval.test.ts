import { expect, it } from 'vitest';
import { WorkflowApprovalCodec } from '../src/workflows/runtime/RunApprovalCodec.js';
import { ComponentRegistry } from '../src/workflows/ComponentRegistry.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import type { WorkflowApprovalDecision } from '../src/workflows/runtime/RunApprovalTypes.js';

it('registers explicit review routes and validates immutable decision commands', (): void => {
    const command: WorkflowApprovalDecision = {
        runId: 'run',
        nodeId: 'review',
        invocationId: 'invoke',
        commandId: 'decision',
        proposalRevision: 'a'.repeat(64),
        decision: 'approved',
        comment: '',
    };
    expect(WorkflowApprovalCodec.command(command)).toEqual(command);
    expect(methodValidators[Method.WorkflowsRunsApprovalDecide].params(command)).toBe(true);
    expect(
        methodValidators[Method.WorkflowsRunsApprovalDecide].params({
            ...command,
            decision: 'yes',
        }),
    ).toBe(false);
    expect((): WorkflowApprovalDecision =>
        WorkflowApprovalCodec.command({ ...command, actor: 'owner' }),
    ).toThrow();
    expect(
        ComponentRegistry.builtin()
            .get('human.approval', '1')
            ?.ports.map((port): string => port.id),
    ).toEqual([
        'in',
        'action',
        'destination',
        'content',
        'approved',
        'rejected',
        'changes_requested',
        'expired',
        'cancelled',
        'proposal',
        'response',
    ]);
});
it('decodes proposal-bound decisions without dropping content or accepting an unmodeled outcome', (): void => {
    const request = {
        runId: 'run',
        nodeId: 'review',
        invocationId: 'invoke',
        label: 'Review',
        recipient: 'alice',
        question: 'Send report',
        answerType: 'choice',
        choices: ['approved', 'rejected', 'changes_requested'],
        timeoutMs: '30000',
        createdAtMs: '1',
        expiresAtMs: '30001',
        status: 'approved',
        canAnswer: false,
        approval: {
            revision: 'a'.repeat(64),
            action: 'Send report',
            destination: 'owner',
            content: { body: 'Exact content' },
        },
        response: {
            commandId: 'decision',
            answer: 'approved',
            actor: 'alice',
            atMs: '2',
            outcome: 'approved',
            comment: '',
            proposalRevision: 'a'.repeat(64),
        },
    };
    expect(methodValidators[Method.WorkflowsRunsApprovalDecide].result(request)).toBe(true);
    expect(
        methodValidators[Method.WorkflowsRunsApprovalDecide].result({
            ...request,
            status: 'approved-by-silence',
        }),
    ).toBe(false);
});
