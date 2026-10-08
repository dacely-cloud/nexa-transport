// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** An exact request, bounded before admission and independent of a text model binding. */
export interface WorkflowImageSettings {
    readonly size: string;
    readonly quality: string;
    readonly count: number;
    readonly outputFormat: string;
    readonly options: Readonly<Record<string, string | number | boolean>>;
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
    readonly selection: 'exact';
}
