// SPDX-License-Identifier: Apache-2.0

import { WorkflowModelPolicies, type WorkflowModelPolicyEvidence } from '../ModelPolicy.js';
import { WorkflowModelsCodec } from '../WorkflowModels.js';
import { WorkflowInput } from '../WorkflowInput.js';
import {
    WorkflowModelSelection,
    WorkflowTextCapability,
    type WorkflowResolvedModel,
} from './RunModelTypes.js';

/** Validates stored resolution records independently of provider adapters. */
export class WorkflowRunModelCodec {
    /** Snapshots contain at most one resolution per executable node. */
    public static list(raw: unknown): readonly WorkflowResolvedModel[] {
        const values: readonly WorkflowResolvedModel[] = WorkflowInput.list(
            raw,
            10000,
            this.model.bind(this),
        );
        WorkflowInput.unique(values.map((value: WorkflowResolvedModel): string => value.nodeId));
        return values;
    }
    /** Rejects malformed identities, hidden options, and unsupported selection policies. */
    public static model(raw: unknown): WorkflowResolvedModel {
        const fields: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const latest: boolean = fields['selection'] === WorkflowModelSelection.Latest;
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'nodeId',
            'bindingId',
            'provider',
            'model',
            'selection',
            'capability',
            'maxOutputTokens',
            'pricingReference',
            ...(latest ? ['policy'] : []),
        ]);
        const capability: unknown = value['capability'];
        const maxOutputTokens: unknown = value['maxOutputTokens'];
        if (
            (!latest && value['selection'] !== WorkflowModelSelection.Exact) ||
            (capability !== WorkflowTextCapability.Text &&
                capability !== WorkflowTextCapability.Reasoning) ||
            typeof maxOutputTokens !== 'number' ||
            !Number.isInteger(maxOutputTokens) ||
            maxOutputTokens < 1 ||
            maxOutputTokens > 32768
        ) {
            throw new Error('Invalid workflow model resolution');
        }
        const price: unknown = value['pricingReference'];
        if (price !== null && (typeof price !== 'string' || !/^[a-f0-9]{64}$/u.test(price))) {
            throw new Error('Invalid workflow model pricing reference');
        }
        const policy: WorkflowModelPolicyEvidence | undefined = latest
            ? WorkflowModelPolicies.evidence(value['policy'])
            : undefined;
        return Object.freeze({
            nodeId: WorkflowInput.id(value['nodeId']),
            bindingId: WorkflowInput.id(value['bindingId']),
            provider: WorkflowInput.id(value['provider']),
            model: WorkflowModelsCodec.identity(value['model']),
            selection: latest ? WorkflowModelSelection.Latest : WorkflowModelSelection.Exact,
            ...(policy === undefined ? {} : { policy }),
            capability,
            maxOutputTokens,
            pricingReference: price,
        });
    }
}
