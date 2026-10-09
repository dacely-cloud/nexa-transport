import type { WorkflowHumanQuestion } from '../src/workflows/runtime/RunHumanTypes.js';
import type { WorkflowRunSummary } from '../src/workflows/runtime/RunTypes.js';
import { expect, it } from 'vitest';
import { WorkflowHumanCodec } from '../src/workflows/runtime/RunHumanCodec.js';
import { ComponentRegistry } from '../src/workflows/ComponentRegistry.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

it('keeps owner questions in the real registry and validates exact answer shapes', (): void => {
    const question: WorkflowHumanQuestion = WorkflowHumanCodec.question({
        question: 'Choose a site',
        answerType: 'choice',
        choices: ['North', 'South'],
        timeoutMs: '300000',
    });
    expect(() => WorkflowHumanCodec.answer(question, 'Other')).toThrow('recorded choices');
    expect(() => WorkflowHumanCodec.answer(question, 'North')).not.toThrow();
    expect(() =>
        WorkflowHumanCodec.command({
            runId: 'run',
            nodeId: 'ask',
            invocationId: 'invocation',
            commandId: 'reply',
            answer: 'North',
            actor: 'owner',
        }),
    ).toThrow('fields');
    expect(ComponentRegistry.builtin().get('human.ask', '1')?.display.compactFields).toEqual([
        'question',
        'answerType',
    ]);
});
it('decodes waiting states and question commands without accepting unknown wire values', (): void => {
    const summary: WorkflowRunSummary = {
        runId: 'run',
        workflowId: 'workflow',
        workflowRevision: '1',
        mode: 'live-test',
        status: 'waiting',
        createdAtMs: '1',
        updatedAtMs: '2',
        sequence: '3',
        message: 'Waiting for the run owner',
    };
    expect(methodValidators[Method.WorkflowsRunsRead].result(summary)).toBe(true);
    expect(
        methodValidators[Method.WorkflowsRunsRead].result({ ...summary, status: 'invented' }),
    ).toBe(false);
    expect(
        methodValidators[Method.WorkflowsRunsQuestionAnswer].params({
            runId: 'run',
            nodeId: 'ask',
            invocationId: 'invocation',
            commandId: 'reply',
            answer: false,
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.WorkflowsRunsQuestionAnswer].params({
            runId: 'run',
            nodeId: 'ask',
            invocationId: 'invocation',
            commandId: 'reply',
            answer: 1,
        }),
    ).toBe(false);
});
