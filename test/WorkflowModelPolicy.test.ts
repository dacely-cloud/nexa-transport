import { expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import {
    WorkflowModelResolutionCodec,
    type WorkflowModelResolutionRequest,
    type WorkflowModelResolution,
} from '../src/workflows/ModelResolution.js';
import {
    WorkflowModelPolicies,
    type WorkflowModelPolicyEvidence,
} from '../src/workflows/ModelPolicy.js';
import { WorkflowRunModelCodec } from '../src/workflows/runtime/RunModelCodec.js';
import type { WorkflowResolvedModel } from '../src/workflows/runtime/RunModelTypes.js';

const request: WorkflowModelResolutionRequest = {
    workflowId: 'draft',
    provider: 'provider',
    capability: 'text',
    maxOutputTokens: 32,
    policy: WorkflowModelPolicies.defaults,
};
const evidence: WorkflowModelPolicyEvidence = {
    format: 1,
    policy: request.policy,
    catalogCheckedAtMs: '3000000',
    releaseAtMs: '1000000',
    releaseReference: 'https://catalog.example/releases',
    eligibilityVerifiedAtMs: '2000000',
    eligibilityReference: 'https://catalog.example/eligibility',
    capabilityDigest: 'a'.repeat(64),
};

it('carries owner-scoped policy checks and unresolved results without client-selected resolution evidence', (): void => {
    expect(
        methodValidators[Method.WorkflowsModelsResolve].params(
            WorkflowModelResolutionCodec.request(request),
        ),
    ).toBe(true);
    const unresolved: WorkflowModelResolution = {
        candidate: null,
        evidence: null,
        reason: 'No verified model is available',
    };
    expect(methodValidators[Method.WorkflowsModelsResolve].result(unresolved)).toBe(true);
    const result: WorkflowModelResolution = {
        candidate: {
            id: 'model',
            name: 'Model',
            provider: 'provider',
            input: ['text'],
            reasoning: true,
            source: 'runtime',
            status: 'available',
            compatible: true,
            reason: null,
            maxOutputTokens: 4096,
            contextWindow: null,
            price: null,
            availableAtCheck: true,
        },
        evidence,
        reason: null,
    };
    expect(methodValidators[Method.WorkflowsModelsResolve].result(result)).toBe(true);
    expect(
        methodValidators[Method.WorkflowsModelsResolve].result({
            ...result,
            evidence: { ...evidence, catalogCheckedAtMs: 3000000 },
        }),
    ).toBe(false);
    expect((): WorkflowModelResolutionRequest =>
        WorkflowModelResolutionCodec.request({ ...request, principal: 'other' }),
    ).toThrow();
    expect((): WorkflowModelResolutionRequest =>
        WorkflowModelResolutionCodec.request({ ...request, maxOutputTokens: 0 }),
    ).toThrow();
    expect((): WorkflowModelResolutionRequest =>
        WorkflowModelResolutionCodec.request({
            ...request,
            policy: { ...request.policy, maxInputUsdPerMillion: '1e-5' },
        }),
    ).toThrow();
    expect((): WorkflowModelResolutionRequest =>
        WorkflowModelResolutionCodec.request({ ...request, evidence }),
    ).toThrow();
});

it('preserves legacy exact snapshots and requires policy evidence only for dynamic resolutions', (): void => {
    const exact: WorkflowResolvedModel = {
        nodeId: 'write',
        bindingId: 'model',
        provider: 'provider',
        model: 'model',
        selection: 'exact',
        capability: 'text',
        maxOutputTokens: 32,
        pricingReference: null,
    };
    expect(WorkflowRunModelCodec.model(exact)).toEqual(exact);
    const latest: WorkflowResolvedModel = {
        ...exact,
        selection: 'latest-compatible',
        policy: evidence,
    };
    expect(WorkflowRunModelCodec.model(latest)).toEqual(latest);
    expect((): WorkflowResolvedModel =>
        WorkflowRunModelCodec.model({ ...exact, selection: 'latest-compatible' }),
    ).toThrow();
    expect((): WorkflowResolvedModel =>
        WorkflowRunModelCodec.model({ ...exact, policy: evidence }),
    ).toThrow();
    expect((): WorkflowResolvedModel =>
        WorkflowRunModelCodec.model({
            ...latest,
            policy: { ...evidence, capabilityDigest: 'bad' },
        }),
    ).toThrow();
});
