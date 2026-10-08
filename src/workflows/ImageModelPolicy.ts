// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from './WorkflowInput.js';
import { WorkflowModelPolicies } from './ModelPolicy.js';

/** Image policies bound each complete render; token rate ceilings do not apply to image tariffs. */
export interface WorkflowImagePolicy {
    readonly allowPreview: boolean;
    readonly region: string | null;
    readonly maxCatalogAgeMs: string;
    /** Null retains the existing run budget. A value additionally caps each image operation. */
    readonly maxGenerationMicrocents: string | null;
}

/** Immutable evidence for a concrete image model selected at run creation. */
export interface WorkflowImagePolicyEvidence {
    readonly format: 1;
    readonly policy: WorkflowImagePolicy;
    readonly catalogCheckedAtMs: string;
    readonly releaseAtMs: string;
    readonly releaseReference: string;
    readonly eligibilityVerifiedAtMs: string;
    readonly eligibilityReference: string;
    readonly factsDigest: string;
}

/** Strict portable policy and evidence validation for graph, transport and stored run boundaries. */
export class WorkflowImagePolicies {
    /** Stable releases and a recent complete endpoint check; normal run budgets remain mandatory. */
    public static readonly defaults: WorkflowImagePolicy = Object.freeze({
        allowPreview: false,
        region: null,
        maxCatalogAgeMs: '300000',
        maxGenerationMicrocents: null,
    });
    /** Accepts only image constraints; unrelated text-model fields cannot silently lose meaning. */
    public static parse(raw: unknown): WorkflowImagePolicy {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'allowPreview',
            'region',
            'maxCatalogAgeMs',
            'maxGenerationMicrocents',
        ]);
        const age: string = WorkflowModelPolicies.timestamp(value['maxCatalogAgeMs']);
        if (
            typeof value['allowPreview'] !== 'boolean' ||
            BigInt(age) < 1000n ||
            BigInt(age) > 86400000n
        ) {
            throw new Error('Invalid image model policy');
        }
        const ceiling: string | null =
            value['maxGenerationMicrocents'] === null
                ? null
                : WorkflowInput.text(value['maxGenerationMicrocents'], 16);
        if (
            ceiling !== null &&
            (!/^(0|[1-9]\d*)$/u.test(ceiling) || BigInt(ceiling) > BigInt(Number.MAX_SAFE_INTEGER))
        ) {
            throw new Error('Image price limit must be a bounded nonnegative integer');
        }
        return Object.freeze({
            allowPreview: value['allowPreview'],
            region: value['region'] === null ? null : WorkflowInput.id(value['region']),
            maxCatalogAgeMs: age,
            maxGenerationMicrocents: ceiling,
        });
    }
    /** Evidence is stored with the chosen model and may not contain provider secrets. */
    public static evidence(raw: unknown): WorkflowImagePolicyEvidence {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'format',
            'policy',
            'catalogCheckedAtMs',
            'releaseAtMs',
            'releaseReference',
            'eligibilityVerifiedAtMs',
            'eligibilityReference',
            'factsDigest',
        ]);
        const digest: string = WorkflowInput.text(value['factsDigest'], 64);
        if (value['format'] !== 1 || !/^[a-f0-9]{64}$/u.test(digest)) {
            throw new Error('Invalid image policy evidence');
        }
        const checked: string = WorkflowModelPolicies.timestamp(value['catalogCheckedAtMs']);
        const released: string = WorkflowModelPolicies.timestamp(value['releaseAtMs']);
        const verified: string = WorkflowModelPolicies.timestamp(value['eligibilityVerifiedAtMs']);
        if (BigInt(released) > BigInt(verified) || BigInt(verified) > BigInt(checked)) {
            throw new Error('Image policy evidence timestamps are inconsistent');
        }
        return Object.freeze({
            format: 1,
            policy: this.parse(value['policy']),
            catalogCheckedAtMs: checked,
            releaseAtMs: released,
            releaseReference: WorkflowInput.text(value['releaseReference'], 1024),
            eligibilityVerifiedAtMs: verified,
            eligibilityReference: WorkflowInput.text(value['eligibilityReference'], 1024),
            factsDigest: digest,
        });
    }
}
