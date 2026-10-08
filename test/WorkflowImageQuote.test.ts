import { expect, it } from 'vitest';
import {
    WorkflowImageQuoteCodec,
    type WorkflowImageQuoteRequest,
    type WorkflowImageQuote,
} from '../src/workflows/WorkflowImageQuote.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

it('carries exact image quotes through the typed method and portable codec', (): void => {
    const request: WorkflowImageQuoteRequest = {
        workflowId: 'draft',
        nodeId: 'image',
        provider: 'images',
        model: 'model',
        settings: {
            size: '1024x1024',
            quality: 'high',
            count: 2,
            outputFormat: 'png',
            options: {},
        },
    };
    const quote: WorkflowImageQuote = {
        ...request,
        estimatedMicrocents: '123456789',
        capabilityReference: 'a'.repeat(64),
        pricingReference: 'b'.repeat(64),
        quotedAtMs: '1791417600000',
    };
    expect(
        methodValidators[Method.WorkflowsModelsImageQuote].params(
            WorkflowImageQuoteCodec.request(request),
        ),
    ).toBe(true);
    expect(
        methodValidators[Method.WorkflowsModelsImageQuote].result(
            WorkflowImageQuoteCodec.result(quote),
        ),
    ).toBe(true);
    expect(
        methodValidators[Method.WorkflowsModelsImageQuote].result({
            ...quote,
            estimatedMicrocents: 123456789,
        }),
    ).toBe(false);
    expect((): WorkflowImageQuote =>
        WorkflowImageQuoteCodec.result({ ...quote, estimatedMicrocents: '-1' }),
    ).toThrow();
    expect((): WorkflowImageQuoteRequest =>
        WorkflowImageQuoteCodec.request({ ...request, principal: 'another-user' }),
    ).toThrow();
});
