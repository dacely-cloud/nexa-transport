// SPDX-License-Identifier: Apache-2.0
import { ChargeKind } from '../../credit/ChargeKind.js';
import { PricingTariffCodec } from '../../credit/PricingTariffCodec.js';
import { WorkflowInput } from '../WorkflowInput.js';
import { WorkflowSpendingCodec as Spending } from './RunSpendingCodec.js';
import { WorkflowSpendingBasis, type WorkflowSpendingBucket } from './RunSpendingTypes.js';
import type { WorkflowModelUsage, WorkflowUsageDimensions } from './RunUsageTypes.js';

/** Validate reported dimensions independently from monetary totals. */
export class WorkflowUsageModelCodec {
    public static read(raw: unknown): WorkflowModelUsage {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'provider',
            'model',
            'kind',
            'unitLabel',
            'basis',
            'tariff',
            'microcents',
            'entries',
            'lastReportedAtMs',
            'expiresAtMs',
            'units',
            'unitEntries',
            'usage',
            'usageEntries',
        ]);
        const bucket: WorkflowSpendingBucket | undefined = Spending.pricing([
            {
                basis: value['basis'],
                microcents: value['microcents'],
                entries: value['entries'],
            },
        ])[0];
        const kind: ChargeKind | undefined = Object.values(ChargeKind).find(
            (kind: ChargeKind): boolean => kind === value['kind'],
        );
        const id: unknown = value['id'];
        if (
            bucket === undefined ||
            kind === undefined ||
            typeof id !== 'string' ||
            !/^[a-f0-9]{64}$/u.test(id)
        ) {
            throw new Error('Invalid model usage identity');
        }
        if (
            bucket.basis !== WorkflowSpendingBasis.Legacy &&
            (bucket.basis === WorkflowSpendingBasis.Adjustment) !== (kind === ChargeKind.Adjustment)
        ) {
            throw new Error('Invalid usage adjustment');
        }
        const units: unknown = value['units'];
        const unitEntries: string = Spending.amount(value['unitEntries']);
        if (
            (units !== null &&
                (typeof units !== 'string' ||
                    units.length > 1024 ||
                    !/^(0|[1-9][0-9]*)(\.[0-9]+)?$/u.test(units))) ||
            (units === null) !== (unitEntries === '0') ||
            BigInt(unitEntries) > BigInt(bucket.entries)
        ) {
            throw new Error('Invalid reported unit coverage');
        }
        const usage: WorkflowUsageDimensions = this.#dimensions(value['usage']);
        const usageEntries: WorkflowUsageDimensions = this.#dimensions(value['usageEntries']);
        for (const key of [
            'inputTokens',
            'outputTokens',
            'cachedInputTokens',
            'reasoningTokens',
        ] as const) {
            const count: string | undefined = usageEntries[key];
            if (
                (count === undefined) !== (usage[key] === undefined) ||
                (count !== undefined && (count === '0' || BigInt(count) > BigInt(bucket.entries)))
            ) {
                throw new Error('Invalid reported token coverage');
            }
        }
        return Object.freeze({
            ...bucket,
            id,
            kind,
            provider: this.#label(value['provider']),
            model: this.#label(value['model']),
            unitLabel: this.#label(value['unitLabel']),
            tariff: PricingTariffCodec.read(value['tariff'], bucket.basis),
            lastReportedAtMs: Spending.timestamp(value['lastReportedAtMs']),
            expiresAtMs: Spending.timestamp(value['expiresAtMs']),
            units,
            unitEntries,
            usage,
            usageEntries,
        });
    }
    static #label(raw: unknown): string | null {
        return raw === null ? null : WorkflowInput.text(raw, 256);
    }
    static #dimensions(raw: unknown): WorkflowUsageDimensions {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const fields: readonly string[] = [
            'inputTokens',
            'outputTokens',
            'cachedInputTokens',
            'reasoningTokens',
        ];
        WorkflowInput.record(
            value,
            fields.filter((field: string): boolean => Object.hasOwn(value, field)),
        );
        const result: Record<string, string> = {};
        for (const field of Object.keys(value)) {
            result[field] = Spending.amount(value[field]);
        }
        return Object.freeze(result);
    }
}
