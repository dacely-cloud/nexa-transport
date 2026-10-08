import { expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import {
    WorkflowModelsCodec,
    type WorkflowModelsRequest,
    type WorkflowModelsPage,
    type WorkflowModelChoice,
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
    expect(methodValidators[Method.WorkflowsModelsRefresh].params(request)).toBe(true);
    expect(methodValidators[Method.WorkflowsModelsRefresh].result(result)).toBe(true);
    const observed: WorkflowModelsPage = {
        ...result,
        observation: { checkedAt: '1791457200000', refreshAvailable: true, refreshFailed: false },
        items: result.items.map((model): typeof model => ({ ...model, availableAtCheck: true })),
    };
    expect(methodValidators[Method.WorkflowsModelsRefresh].result(observed)).toBe(true);
    expect(
        methodValidators[Method.WorkflowsModelsRefresh].result({
            ...observed,
            observation: { ...observed.observation, checkedAt: 1791457200000 },
        }),
    ).toBe(false);
    expect(methodValidators[Method.WorkflowsModels].result({ ...result, freshness: 'fresh' })).toBe(
        false,
    );
    expect(
        methodValidators[Method.WorkflowsModels].params({ ...request, capability: 'video' }),
    ).toBe(false);
    expect(
        methodValidators[Method.WorkflowsModels].params({ ...request, capability: 'image' }),
    ).toBe(true);
    expect(
        methodValidators[Method.WorkflowsModels].result({
            ...result,
            items: result.items.map((model: WorkflowModelChoice): WorkflowModelChoice => ({
                ...model,
                image: {
                    maxCount: 10,
                    sizes: ['1024x1024'],
                    qualities: ['auto'],
                    outputFormats: ['png'],
                    dimensions: null,
                    providerOptions: { background: 'string' },
                },
            })),
        }),
    ).toBe(true);
    expect((): WorkflowModelsRequest =>
        WorkflowModelsCodec.request({ ...request, favorites: ['same', 'same'] }),
    ).toThrow();
});
