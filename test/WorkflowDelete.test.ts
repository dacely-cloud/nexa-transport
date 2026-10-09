import { expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol';
import { methodValidators } from '../src/protocol/MethodValidators';
import { WorkflowRequestCodec } from '../src/workflows/WorkflowRequestCodec';

it('validates revision-fenced deletion requests and explicit receipts', (): void => {
    expect(Method.WorkflowsDelete).toBe('workflows.delete');
    expect(
        WorkflowRequestCodec.delete({ workflowId: 'draft', expectedRevision: '9007199254740993' }),
    ).toEqual({ workflowId: 'draft', expectedRevision: '9007199254740993' });
    expect((): void => {
        WorkflowRequestCodec.delete({
            workflowId: 'draft',
            expectedRevision: '1',
            principal: 'other',
        });
    }).toThrow();
    expect((): void => {
        WorkflowRequestCodec.delete({ workflowId: 'draft', expectedRevision: null });
    }).toThrow();
    expect(
        methodValidators[Method.WorkflowsDelete].params({
            workflowId: 'draft',
            expectedRevision: '1',
        }),
    ).toBe(true);
    expect(methodValidators[Method.WorkflowsDelete].params({ workflowId: 'draft' })).toBe(false);
    expect(
        methodValidators[Method.WorkflowsDelete].result({
            workflowId: 'draft',
            revision: '1',
            deleted: true,
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.WorkflowsDelete].result({
            workflowId: 'draft',
            revision: '1',
            deleted: false,
        }),
    ).toBe(false);
});
