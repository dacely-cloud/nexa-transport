import { expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import {
    WorkflowModelsCodec,
    type WorkflowModelsRequest,
    type WorkflowModelsPage,
} from '../src/workflows/WorkflowModels.js';

it('validates catalog metadata without treating missing price or freshness as a free current model', (): void => {
    const request: WorkflowModelsRequest = {
        workflowId: 'draft',
        provider: 'provider',
        query: '',
        capability: 'text',
        compatibleOnly: true,
        favorites: ['model@stable'],
        after: null,
    };
    expect(
        methodValidators[Method.WorkflowsModels].params(WorkflowModelsCodec.request(request)),
    ).toBe(true);
    const result: WorkflowModelsPage = {
        providers: ['provider'],
        items: [
            {
                id: 'model@stable',
                provider: 'provider',
                name: 'Model',
                input: ['text'],
                reasoning: null,
                source: 'runtime',
                status: 'available',
                compatible: true,
                reason: null,
                maxOutputTokens: null,
                contextWindow: null,
                price: null,
            },
        ],
        next: null,
        freshness: 'not-reported',
    };
    expect(methodValidators[Method.WorkflowsModels].result(result)).toBe(true);
    expect(methodValidators[Method.WorkflowsModels].result({ ...result, freshness: 'fresh' })).toBe(
        false,
    );
    expect(
        methodValidators[Method.WorkflowsModels].params({ ...request, capability: 'image' }),
    ).toBe(false);
    expect((): WorkflowModelsRequest =>
        WorkflowModelsCodec.request({ ...request, favorites: ['same', 'same'] }),
    ).toThrow();
});
