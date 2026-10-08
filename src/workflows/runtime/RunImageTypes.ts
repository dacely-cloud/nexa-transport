// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowImagePolicyEvidence } from '../ImageModelPolicy.js';
import type { WorkflowModelSelection } from './RunModelTypes.js';

/** The image operation is part of immutable settings and pricing identity. */
export const WorkflowImageOperation = { Generate: 'generate', Edit: 'edit' } as const;
/** Supported image operations, independent of server-only provider code. */
export type WorkflowImageOperation =
    (typeof WorkflowImageOperation)[keyof typeof WorkflowImageOperation];

/** An exact request, bounded before admission and independent of a text model binding. */
export interface WorkflowImageSettings {
    /** Older generation-only snapshots omit this field. */
    readonly operation?: WorkflowImageOperation;
    readonly size: string;
    readonly quality: string;
    readonly count: number;
    readonly outputFormat: string;
    readonly options: Readonly<Record<string, string | number | boolean>>;
}
/** Per-operation settings sharing one reusable image-model binding. */
export interface WorkflowImageRequirement {
    readonly nodeId: string;
    readonly settings: WorkflowImageSettings;
}
/** Image request identity and its configured account tariff. */
export interface WorkflowImagePrice {
    readonly provider: string;
    readonly model: string;
    readonly settings: WorkflowImageSettings;
    readonly capabilityReference: string;
    readonly pricingReference: string;
    readonly priceServiceId: string;
    readonly estimatedMicrocents: string;
}

/** Immutable run bindings retain the exact request and price selected at acceptance. */
export interface WorkflowResolvedImage extends WorkflowImagePrice {
    readonly nodeId: string;
    readonly bindingId: string;
    readonly capability: 'image';
    readonly selection: (typeof WorkflowModelSelection)[keyof typeof WorkflowModelSelection];
    readonly policy?: WorkflowImagePolicyEvidence;
}
