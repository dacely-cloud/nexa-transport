import { expect, it } from 'vitest';
import { WorkflowAttentionCodec } from '../src/workflows/runtime/RunAttentionCodec.js';
import type {
    WorkflowAttentionQuery,
    WorkflowAttentionPage,
} from '../src/workflows/runtime/RunAttentionTypes.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

it('carries bounded queries and rejects incompatible cursor categories', (): void => {
    const query: WorkflowAttentionQuery = {
        category: 'requests',
        after: { runId: 'run', nodeId: 'ask' },
        limit: 8,
    };
    expect(WorkflowAttentionCodec.query(query)).toEqual(query);
    expect(methodValidators[Method.WorkflowsAttentionList].params(query)).toBe(true);
    expect((): WorkflowAttentionQuery =>
        WorkflowAttentionCodec.query({ ...query, category: 'failures' }),
    ).toThrow();
    expect((): WorkflowAttentionQuery =>
        WorkflowAttentionCodec.query({ ...query, limit: 1000 }),
    ).toThrow();
    expect((): WorkflowAttentionQuery =>
        WorkflowAttentionCodec.query({ ...query, principal: 'other' }),
    ).toThrow();
});
it('decodes sparse continuations and typed metadata without introducing request bodies', (): void => {
    const page: WorkflowAttentionPage = {
        category: 'requests',
        observedAtMs: '1',
        items: [],
        next: { runId: 'stale', nodeId: 'ask' },
    };
    expect(methodValidators[Method.WorkflowsAttentionList].result(page)).toBe(true);
    expect(
        methodValidators[Method.WorkflowsAttentionList].result({
            ...page,
            category: 'unrecognized',
        }),
    ).toBe(false);
});
