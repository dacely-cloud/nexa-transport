// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from './WorkflowInput.js';

/** Features that integrations can explicitly verify for model selection. */
export const WorkflowModelFeature = {
    Reasoning: 'reasoning',
    Vision: 'vision',
    Documents: 'documents',
    Tools: 'tools',
    StructuredOutput: 'structuredOutput',
} as const;
export type WorkflowModelFeature = (typeof WorkflowModelFeature)[keyof typeof WorkflowModelFeature];

/** Saved, explicit constraints for the latest supported model on one provider. */
export interface WorkflowModelPolicy {
    readonly allowPreview: boolean;
    readonly region: string | null;
    readonly requiredFeatures: readonly WorkflowModelFeature[];
    /** Decimal USD per million tokens. Null is no additional rate ceiling. */
    readonly maxInputUsdPerMillion: string | null;
    readonly maxOutputUsdPerMillion: string | null;
    readonly allowUnpriced: boolean;
    /** Endpoint observation age, between one second and one day. */
    readonly maxCatalogAgeMs: string;
}

/** The facts and constraints used for one immutable latest-policy decision. */
export interface WorkflowModelPolicyEvidence {
    readonly format: 1;
    readonly policy: WorkflowModelPolicy;
    readonly catalogCheckedAtMs: string;
    readonly releaseAtMs: string;
    readonly releaseReference: string;
    readonly eligibilityVerifiedAtMs: string;
    readonly eligibilityReference: string;
    readonly capabilityDigest: string;
}

/** Portable policy parsing. Monetary comparison uses fixed-point bigint, not floating point. */
export class WorkflowModelPolicies {
    public static readonly defaults: WorkflowModelPolicy = Object.freeze({
        allowPreview: false,
        region: null,
        requiredFeatures: Object.freeze([]),
        maxInputUsdPerMillion: null,
        maxOutputUsdPerMillion: null,
        allowUnpriced: false,
        maxCatalogAgeMs: '300000',
    });

    public static parse(raw: unknown): WorkflowModelPolicy {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'allowPreview',
            'region',
            'requiredFeatures',
            'maxInputUsdPerMillion',
            'maxOutputUsdPerMillion',
            'allowUnpriced',
            'maxCatalogAgeMs',
        ]);
        if (
            typeof value['allowPreview'] !== 'boolean' ||
            typeof value['allowUnpriced'] !== 'boolean'
        ) {
            throw new Error('Invalid model policy choices');
        }
        const age: string = this.timestamp(value['maxCatalogAgeMs']);
        if (BigInt(age) < 1000n || BigInt(age) > 86400000n) {
            throw new Error('Catalog age must be between one second and one day');
        }
        const features: readonly WorkflowModelFeature[] = WorkflowInput.list(
            value['requiredFeatures'],
            5,
            (entry: unknown): WorkflowModelFeature => {
                const feature: WorkflowModelFeature | undefined = Object.values(
                    WorkflowModelFeature,
                ).find((candidate: WorkflowModelFeature): boolean => candidate === entry);
                if (feature === undefined) {
                    throw new Error('Unsupported model feature');
                }
                return feature;
            },
        );
        WorkflowInput.unique(features);
        return Object.freeze({
            allowPreview: value['allowPreview'],
            allowUnpriced: value['allowUnpriced'],
            region: value['region'] === null ? null : WorkflowInput.id(value['region']),
            requiredFeatures: Object.freeze([...features].sort()),
            maxInputUsdPerMillion: this.#ceiling(value['maxInputUsdPerMillion']),
            maxOutputUsdPerMillion: this.#ceiling(value['maxOutputUsdPerMillion']),
            maxCatalogAgeMs: age,
        });
    }

    public static evidence(raw: unknown): WorkflowModelPolicyEvidence {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'format',
            'policy',
            'catalogCheckedAtMs',
            'releaseAtMs',
            'releaseReference',
            'eligibilityVerifiedAtMs',
            'eligibilityReference',
            'capabilityDigest',
        ]);
        if (
            value['format'] !== 1 ||
            typeof value['capabilityDigest'] !== 'string' ||
            !/^[a-f0-9]{64}$/u.test(value['capabilityDigest'])
        ) {
            throw new Error('Invalid model policy evidence');
        }
        return Object.freeze({
            format: 1,
            policy: this.parse(value['policy']),
            catalogCheckedAtMs: this.timestamp(value['catalogCheckedAtMs']),
            releaseAtMs: this.timestamp(value['releaseAtMs']),
            releaseReference: WorkflowInput.text(value['releaseReference'], 1024),
            eligibilityVerifiedAtMs: this.timestamp(value['eligibilityVerifiedAtMs']),
            eligibilityReference: WorkflowInput.text(value['eligibilityReference'], 1024),
            capabilityDigest: value['capabilityDigest'],
        });
    }

    public static timestamp(raw: unknown): string {
        const value: string = WorkflowInput.text(raw, 16);
        if (!/^[1-9]\d*$/u.test(value) || BigInt(value) > 8640000000000000n) {
            throw new Error('Invalid model policy timestamp');
        }
        return value;
    }

    /** Eight decimal places represent microcents per million tokens exactly. */
    public static rate(value: string): bigint {
        if (!/^(0|[1-9]\d{0,8})(?:\.\d{1,8})?$/u.test(value)) {
            throw new Error(
                'Model rate must be a nonnegative decimal with at most eight decimal places',
            );
        }
        const parts: readonly string[] = value.split('.');
        return BigInt(parts[0] ?? '0') * 100000000n + BigInt((parts[1] ?? '').padEnd(8, '0'));
    }

    static #ceiling(raw: unknown): string | null {
        if (raw === null) {
            return null;
        }
        const value: string = WorkflowInput.text(raw, 18);
        this.rate(value);
        return value;
    }
}
