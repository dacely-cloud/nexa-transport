// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from './WorkflowInput.js';
import { WorkflowModelsCodec } from './WorkflowModels.js';
import { WorkflowRunImageCodec } from './runtime/RunImageCodec.js';
import type { WorkflowImageSettings } from './runtime/RunImageTypes.js';

/** Unsaved render settings may be priced only in an owned workflow. */
export interface WorkflowImageQuoteRequest {
    readonly workflowId: string;
    readonly nodeId: string;
    readonly provider: string;
    readonly model: string;
    readonly settings: WorkflowImageSettings;
}
/** An estimate creates no reservation and is recalculated when accepting a run. */
export interface WorkflowImageQuote extends WorkflowImageQuoteRequest {
    readonly estimatedMicrocents: string;
    readonly capabilityReference: string;
    readonly pricingReference: string;
    readonly quotedAtMs: string;
}
/** Strict portable boundaries reject injected principals, prices and unbounded options. */
export class WorkflowImageQuoteCodec {
    public static request(raw: unknown): WorkflowImageQuoteRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'nodeId',
            'provider',
            'model',
            'settings',
        ]);
        return Object.freeze({
            workflowId: WorkflowInput.id(value['workflowId']),
            nodeId: WorkflowInput.id(value['nodeId']),
            provider: WorkflowInput.id(value['provider']),
            model: WorkflowModelsCodec.identity(value['model']),
            settings: WorkflowRunImageCodec.settings(value['settings']),
        });
    }
    public static result(raw: unknown): WorkflowImageQuote {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'nodeId',
            'provider',
            'model',
            'settings',
            'estimatedMicrocents',
            'capabilityReference',
            'pricingReference',
            'quotedAtMs',
        ]);
        return Object.freeze({
            ...this.request({
                workflowId: value['workflowId'],
                nodeId: value['nodeId'],
                provider: value['provider'],
                model: value['model'],
                settings: value['settings'],
            }),
            estimatedMicrocents: this.#integer(value['estimatedMicrocents']),
            capabilityReference: this.#digest(value['capabilityReference']),
            pricingReference: this.#digest(value['pricingReference']),
            quotedAtMs: this.#integer(value['quotedAtMs']),
        });
    }
    static #integer(raw: unknown): string {
        const value: string = WorkflowInput.text(raw, 16);
        if (!/^(0|[1-9][0-9]*)$/u.test(value) || BigInt(value) > BigInt(Number.MAX_SAFE_INTEGER)) {
            throw new Error('Invalid image quote amount or timestamp');
        }
        return value;
    }
    static #digest(raw: unknown): string {
        const value: string = WorkflowInput.text(raw, 64);
        if (!/^[a-f0-9]{64}$/u.test(value)) {
            throw new Error('Invalid image quote reference');
        }
        return value;
    }
}
