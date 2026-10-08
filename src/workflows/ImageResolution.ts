// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from './WorkflowInput.js';
import { WorkflowModelsCodec } from './WorkflowModels.js';
import {
    WorkflowImagePolicies,
    type WorkflowImagePolicy,
    type WorkflowImagePolicyEvidence,
} from './ImageModelPolicy.js';
import { WorkflowImageQuoteCodec, type WorkflowImageQuote } from './WorkflowImageQuote.js';
import { WorkflowRunImageCodec } from './runtime/RunImageCodec.js';
import type { WorkflowImageRequirement } from './runtime/RunImageTypes.js';

/** A read-only policy preview uses unsaved settings and authenticated account pricing. */
export interface WorkflowImageResolutionRequest {
    readonly workflowId: string;
    readonly provider: string;
    readonly policy: WorkflowImagePolicy;
    readonly requirements: readonly WorkflowImageRequirement[];
}
/** All connected render quotes share the selected snapshot and its evidence. */
export interface WorkflowImageCandidate {
    readonly provider: string;
    readonly model: string;
    readonly evidence: WorkflowImagePolicyEvidence;
    readonly quotes: readonly WorkflowImageQuote[];
}
/** An unresolved policy has a reason, never an invented candidate or zero-price placeholder. */
export interface WorkflowImageResolution {
    readonly candidate: WorkflowImageCandidate | null;
    readonly reason: string | null;
}
/** Portable strict decoding shared by the gateway and browser SDK. */
export class WorkflowImageResolutionCodec {
    /** Rejects hidden identity/price assertions and repeated operation IDs. */
    public static request(raw: unknown): WorkflowImageResolutionRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'provider',
            'policy',
            'requirements',
        ]);
        const requirements: readonly WorkflowImageRequirement[] = WorkflowInput.list(
            value['requirements'],
            10000,
            (entry: unknown): WorkflowImageRequirement => {
                const item: Readonly<Record<string, unknown>> = WorkflowInput.record(entry, [
                    'nodeId',
                    'settings',
                ]);
                return Object.freeze({
                    nodeId: WorkflowInput.id(item['nodeId']),
                    settings: WorkflowRunImageCodec.settings(item['settings']),
                });
            },
        );
        if (requirements.length === 0) {
            throw new Error('An image policy needs at least one render');
        }
        WorkflowInput.unique(
            requirements.map((item: WorkflowImageRequirement): string => item.nodeId),
        );
        return Object.freeze({
            workflowId: WorkflowInput.id(value['workflowId']),
            provider: WorkflowInput.id(value['provider']),
            policy: WorkflowImagePolicies.parse(value['policy']),
            requirements: Object.freeze(requirements),
        });
    }
    /** Validates complete evidence and consistent quoted identities before displaying a candidate. */
    public static result(raw: unknown): WorkflowImageResolution {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'candidate',
            'reason',
        ]);
        if (value['candidate'] === null) {
            return Object.freeze({
                candidate: null,
                reason: WorkflowInput.text(value['reason'], 1024),
            });
        }
        if (value['reason'] !== null) {
            throw new Error('A resolved image policy cannot also report a failure');
        }
        const candidate: Readonly<Record<string, unknown>> = WorkflowInput.record(
            value['candidate'],
            ['provider', 'model', 'evidence', 'quotes'],
        );
        const provider: string = WorkflowInput.id(candidate['provider']);
        const model: string = WorkflowModelsCodec.identity(candidate['model']);
        const evidence: WorkflowImagePolicyEvidence = WorkflowImagePolicies.evidence(
            candidate['evidence'],
        );
        const quotes: readonly WorkflowImageQuote[] = WorkflowInput.list(
            candidate['quotes'],
            10000,
            (entry: unknown): WorkflowImageQuote => WorkflowImageQuoteCodec.result(entry),
        );
        if (
            quotes.length === 0 ||
            quotes.some(
                (quote: WorkflowImageQuote): boolean =>
                    quote.provider !== provider ||
                    quote.model !== model ||
                    quote.workflowId !== quotes[0]?.workflowId ||
                    (evidence.policy.maxGenerationMicrocents !== null &&
                        BigInt(quote.estimatedMicrocents) >
                            BigInt(evidence.policy.maxGenerationMicrocents)),
            )
        ) {
            throw new Error('Image policy quotes do not match the selected model and price limit');
        }
        WorkflowInput.unique(quotes.map((quote: WorkflowImageQuote): string => quote.nodeId));
        return Object.freeze({
            candidate: Object.freeze({ provider, model, evidence, quotes: Object.freeze(quotes) }),
            reason: null,
        });
    }
}
