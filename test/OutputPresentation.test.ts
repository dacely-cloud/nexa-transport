import { expect, it } from 'vitest';
import { WorkflowRunCodec } from '../src/workflows/runtime/RunCodec.js';
import { WorkflowOutputView, type WorkflowStepResult } from '../src/workflows/runtime/RunTypes.js';
it.each(Object.values(WorkflowOutputView))(
    'decodes the recorded %s output view without changing its value',
    (view): void => {
        const result: WorkflowStepResult = {
            outputs: {},
            routes: [],
            result: { name: 'Report', value: [{ count: '9007199254740993123' }], view },
        };
        expect(WorkflowRunCodec.result(result)).toEqual(result);
    },
);
it('preserves legacy absence and rejects unknown output renderers', (): void => {
    const result: WorkflowStepResult = {
        outputs: {},
        routes: [],
        result: { name: 'Legacy', value: null },
    };
    expect(WorkflowRunCodec.result(result)).toEqual(result);
    expect(() =>
        WorkflowRunCodec.result({
            ...result,
            result: { name: 'Invalid', value: null, view: 'html' },
        }),
    ).toThrow('Unsupported workflow output view');
});
