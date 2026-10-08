// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from '../WorkflowInput.js';
import { WorkflowModelsCodec } from '../WorkflowModels.js';
import { WorkflowImagePolicies } from '../ImageModelPolicy.js';
import type { WorkflowImageSettings, WorkflowResolvedImage } from './RunImageTypes.js';

/** Stored image bindings validate independently from server-only provider and ledger code. */
export class WorkflowRunImageCodec {
    /** One resolution per executable image node. */
    public static list(raw: unknown): readonly WorkflowResolvedImage[] {
        const values: readonly WorkflowResolvedImage[] = WorkflowInput.list(
            raw,
            10000,
            this.model.bind(this),
        );
        WorkflowInput.unique(values.map((entry: WorkflowResolvedImage): string => entry.nodeId));
        return Object.freeze(values);
    }
    /** Request settings cannot hide nested credentials, endpoints or arbitrary payloads. */
    public static settings(raw: unknown): WorkflowImageSettings {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'size',
            'quality',
            'count',
            'outputFormat',
            'options',
        ]);
        const count: unknown = value['count'];
        const quality: string = WorkflowInput.text(value['quality'], 16);
        const outputFormat: string = WorkflowInput.text(value['outputFormat'], 8);
        if (
            typeof count !== 'number' ||
            !Number.isInteger(count) ||
            count < 1 ||
            count > 10 ||
            !['low', 'medium', 'high', 'xhigh', 'max', 'auto'].includes(quality) ||
            !['png', 'jpeg', 'webp'].includes(outputFormat)
        ) {
            throw new Error('Invalid workflow image settings');
        }
        const rawOptions: Readonly<Record<string, unknown>> = WorkflowInput.object(
            value['options'],
        );
        if (Object.keys(rawOptions).length > 16) {
            throw new Error('Too many image options');
        }
        const options: Record<string, string | number | boolean> = {};
        for (const [key, option] of Object.entries(rawOptions)) {
            WorkflowInput.id(key);
            if (
                (typeof option !== 'string' &&
                    typeof option !== 'number' &&
                    typeof option !== 'boolean') ||
                (typeof option === 'string' && option.length > 1024) ||
                (typeof option === 'number' && !Number.isFinite(option))
            ) {
                throw new Error('Image options must be bounded primitive values');
            }
            options[key] = option;
        }
        return Object.freeze({
            size: WorkflowInput.text(value['size'], 32),
            quality,
            count,
            outputFormat,
            options: Object.freeze(options),
        });
    }
    /** Monetary values remain decimal integers; the existing ledger performs pricing. */
    public static model(raw: unknown): WorkflowResolvedImage {
        const fields: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const latest: boolean = fields['selection'] === 'latest-compatible';
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'nodeId',
            'bindingId',
            'provider',
            'model',
            'capability',
            'selection',
            'settings',
            'capabilityReference',
            'pricingReference',
            'priceServiceId',
            'estimatedMicrocents',
            ...(latest ? ['policy'] : []),
        ]);
        const amount: string = WorkflowInput.text(value['estimatedMicrocents'], 16);
        if (
            value['capability'] !== 'image' ||
            (value['selection'] !== 'exact' && value['selection'] !== 'latest-compatible') ||
            (value['selection'] === 'exact' && value['policy'] !== undefined) ||
            !/^(0|[1-9][0-9]*)$/u.test(amount) ||
            BigInt(amount) > BigInt(Number.MAX_SAFE_INTEGER)
        ) {
            throw new Error('Invalid workflow image resolution');
        }
        return Object.freeze({
            nodeId: WorkflowInput.id(value['nodeId']),
            bindingId: WorkflowInput.id(value['bindingId']),
            provider: WorkflowInput.id(value['provider']),
            model: WorkflowModelsCodec.identity(value['model']),
            capability: 'image',
            selection: value['selection'],
            ...(value['selection'] === 'latest-compatible'
                ? { policy: WorkflowImagePolicies.evidence(value['policy']) }
                : {}),
            settings: this.settings(value['settings']),
            capabilityReference: this.#digest(value['capabilityReference']),
            pricingReference: this.#digest(value['pricingReference']),
            priceServiceId: WorkflowInput.text(value['priceServiceId'], 2048),
            estimatedMicrocents: amount,
        });
    }
    static #digest(raw: unknown): string {
        const value: string = WorkflowInput.text(raw, 64);
        if (!/^[a-f0-9]{64}$/u.test(value)) {
            throw new Error('Invalid image resolution signature');
        }
        return value;
    }
}
