// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from './WorkflowInput.js';
import {
    WorkflowModelPolicies,
    type WorkflowModelPolicy,
    type WorkflowModelPolicyEvidence,
} from './ModelPolicy.js';
import { WorkflowModelCapability, type WorkflowModelChoice } from './WorkflowModels.js';

/** Owner-authorized policy preview; never saves a draft or performs inference. */
export interface WorkflowModelResolutionRequest {
    readonly workflowId: string;
    readonly provider: string;
    readonly capability: WorkflowModelCapability;
    readonly maxOutputTokens: number;
    readonly policy: WorkflowModelPolicy;
}
export interface WorkflowModelResolution {
    readonly candidate: WorkflowModelChoice | null;
    readonly evidence: WorkflowModelPolicyEvidence | null;
    readonly reason: string | null;
}
export class WorkflowModelResolutionCodec {
    public static request(raw: unknown): WorkflowModelResolutionRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'provider',
            'capability',
            'maxOutputTokens',
            'policy',
        ]);
        const capability: unknown = value['capability'];
        const limit: unknown = value['maxOutputTokens'];
        if (
            (capability !== WorkflowModelCapability.Text &&
                capability !== WorkflowModelCapability.Reasoning) ||
            typeof limit !== 'number' ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 32768
        ) {
            throw new Error('Unsupported model resolution capability or output limit');
        }
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            provider: WorkflowInput.id(value['provider']),
            capability,
            maxOutputTokens: limit,
            policy: WorkflowModelPolicies.parse(value['policy']),
        };
    }
}

export {
    WorkflowModelPolicies,
    WorkflowModelFeature,
    type WorkflowModelPolicy,
    type WorkflowModelPolicyEvidence,
} from './ModelPolicy.js';
