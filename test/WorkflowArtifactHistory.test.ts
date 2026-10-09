import { expect, it } from 'vitest';
import { Method, type WorkflowArtifactListPage } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { WorkflowRunArtifactCodec } from '../src/workflows/runtime/RunArtifactCodec.js';

it('validates paged artifact metadata with exact producing identities and legacy timestamps', (): void => {
    const page: WorkflowArtifactListPage = {
        runId: 'run',
        observedAtMs: '1791437000000',
        next: { nodeId: 'render', invocationId: 'attempt' },
        items: [
            {
                nodeId: 'render',
                invocationId: 'attempt',
                label: 'Render',
                attempt: null,
                status: null,
                createdAtMs: null,
                artifacts: [
                    {
                        artifactId: 'image',
                        name: 'image.png',
                        contentType: 'image/png',
                        bytes: '46',
                        sha256: 'a'.repeat(64),
                        expiresAtMs: '1791437010000',
                    },
                ],
            },
        ],
    };
    expect(methodValidators[Method.WorkflowsRunsArtifacts].result(page)).toBe(true);
    expect(
        methodValidators[Method.WorkflowsRunsArtifacts].result({
            ...page,
            items: [{ ...page.items[0], status: 'invented' }],
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.WorkflowsRunsArtifacts].params({
            runId: 'run',
            after: page.next,
            limit: 6,
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.WorkflowsRunsArtifacts].params({
            runId: 'run',
            after: { nodeId: 2, invocationId: 'attempt' },
            limit: 6,
        }),
    ).toBe(false);
});
it('portable artifact list parsing enforces bounds and excludes owner injection', (): void => {
    expect(WorkflowRunArtifactCodec.list({ runId: 'run', after: null, limit: 6 }).limit).toBe(6);
    expect(() => WorkflowRunArtifactCodec.list({ runId: 'run', after: null, limit: 7 })).toThrow();
    expect(() =>
        WorkflowRunArtifactCodec.list({ runId: 'run', after: null, limit: 1, principal: 'other' }),
    ).toThrow();
});
