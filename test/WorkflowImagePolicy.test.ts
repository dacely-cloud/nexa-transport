import { expect, it } from 'vitest';
import type { WorkflowImageQuote } from '../src/workflows/WorkflowImageQuote.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { WorkflowImagePolicies } from '../src/workflows/ImageModelPolicy.js';
import {
    WorkflowImageResolutionCodec,
    type WorkflowImageResolutionRequest,
    type WorkflowImageResolution,
} from '../src/workflows/ImageResolution.js';
import { WorkflowRunImageCodec } from '../src/workflows/runtime/RunImageCodec.js';
import type { WorkflowResolvedImage } from '../src/workflows/runtime/RunImageTypes.js';

const request: WorkflowImageResolutionRequest = {
    workflowId: 'draft',
    provider: 'images',
    policy: WorkflowImagePolicies.defaults,
    requirements: [
        {
            nodeId: 'image',
            settings: {
                size: '1024x1024',
                quality: 'high',
                count: 1,
                outputFormat: 'png',
                options: {},
            },
        },
    ],
};
const result: WorkflowImageResolution = {
    candidate: {
        provider: 'images',
        model: 'snapshot',
        evidence: {
            format: 1,
            policy: WorkflowImagePolicies.defaults,
            catalogCheckedAtMs: '1791417600000',
            releaseAtMs: '1788825600000',
            releaseReference: 'https://example.test/release',
            eligibilityVerifiedAtMs: '1791417600000',
            eligibilityReference: 'https://example.test/review',
            factsDigest: 'a'.repeat(64),
        },
        quotes: [
            {
                workflowId: 'draft',
                provider: 'images',
                model: 'snapshot',
                nodeId: 'image',
                settings: {
                    size: '1024x1024',
                    quality: 'high',
                    count: 1,
                    outputFormat: 'png',
                    options: {},
                },
                estimatedMicrocents: '100000',
                capabilityReference: 'b'.repeat(64),
                pricingReference: 'c'.repeat(64),
                quotedAtMs: '1791417600000',
            },
        ],
    },
    reason: null,
};

it('validates image policy requests, evidence, quotes and the advertised RPC contract', (): void => {
    expect(WorkflowImageResolutionCodec.request(request)).toEqual(request);
    expect(WorkflowImageResolutionCodec.result(result)).toEqual(result);
    expect(methodValidators[Method.WorkflowsModelsImageResolve].params(request)).toBe(true);
    expect(methodValidators[Method.WorkflowsModelsImageResolve].result(result)).toBe(true);
    expect(
        WorkflowImageResolutionCodec.result({ candidate: null, reason: 'Missing access' }),
    ).toEqual({ candidate: null, reason: 'Missing access' });
    expect((): WorkflowImageResolutionRequest =>
        WorkflowImageResolutionCodec.request({ ...request, principal: 'other' }),
    ).toThrow();
    expect((): WorkflowImageResolutionRequest =>
        WorkflowImageResolutionCodec.request({
            ...request,
            requirements: [...request.requirements, ...request.requirements],
        }),
    ).toThrow();
    expect((): WorkflowImageResolutionRequest =>
        WorkflowImageResolutionCodec.request({ ...request, requirements: [] }),
    ).toThrow();
});

it('rejects model mismatches, over-limit prices, hidden fields and incoherent evidence', (): void => {
    const candidate: NonNullable<WorkflowImageResolution['candidate']> =
        result.candidate ??
        ((): never => {
            throw new Error('Missing candidate');
        })();
    expect((): WorkflowImageResolution =>
        WorkflowImageResolutionCodec.result({
            candidate: { ...candidate, model: 'other' },
            reason: null,
        }),
    ).toThrow();
    expect((): WorkflowImageResolution =>
        WorkflowImageResolutionCodec.result({
            candidate: { ...candidate, quotes: [] },
            reason: null,
        }),
    ).toThrow();
    expect((): WorkflowImageResolution =>
        WorkflowImageResolutionCodec.result({ candidate, reason: 'inconsistent' }),
    ).toThrow();
    expect((): WorkflowImageResolution =>
        WorkflowImageResolutionCodec.result({
            candidate: {
                ...candidate,
                evidence: {
                    ...candidate.evidence,
                    policy: { ...candidate.evidence.policy, maxGenerationMicrocents: '1' },
                },
            },
            reason: null,
        }),
    ).toThrow();
    expect((): WorkflowImageResolution =>
        WorkflowImageResolutionCodec.result({
            candidate: {
                ...candidate,
                evidence: { ...candidate.evidence, releaseAtMs: '1791417600001' },
            },
            reason: null,
        }),
    ).toThrow();
    expect((): WorkflowImageResolution =>
        WorkflowImageResolutionCodec.result({
            candidate: { ...candidate, credential: 'hidden' },
            reason: null,
        }),
    ).toThrow();
});

it('round-trips pinned latest image evidence while keeping existing exact snapshots valid', (): void => {
    const candidate: NonNullable<WorkflowImageResolution['candidate']> =
        result.candidate ??
        ((): never => {
            throw new Error('Missing candidate');
        })();
    const quote: WorkflowImageQuote | undefined = candidate.quotes[0];
    if (quote === undefined) {
        throw new Error('Missing quote');
    }
    const exact: WorkflowResolvedImage = {
        nodeId: quote.nodeId,
        bindingId: 'binding',
        capability: 'image',
        selection: 'exact',
        provider: quote.provider,
        model: quote.model,
        settings: quote.settings,
        capabilityReference: quote.capabilityReference,
        pricingReference: quote.pricingReference,
        estimatedMicrocents: quote.estimatedMicrocents,
        priceServiceId: 'tariff',
    };
    expect(WorkflowRunImageCodec.model(exact)).toEqual(exact);
    const pinned: WorkflowResolvedImage = {
        ...exact,
        selection: 'latest-compatible',
        policy: candidate.evidence,
    };
    expect(WorkflowRunImageCodec.model(pinned)).toEqual(pinned);
    expect((): WorkflowResolvedImage =>
        WorkflowRunImageCodec.model({ ...pinned, selection: 'exact' }),
    ).toThrow();
    expect((): WorkflowResolvedImage =>
        WorkflowRunImageCodec.model({ ...exact, selection: 'latest-compatible' }),
    ).toThrow();
});
