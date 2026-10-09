// SPDX-License-Identifier: Apache-2.0
import { WorkflowInput } from '../workflows/WorkflowInput.js';
import { WorkflowSpendingBasis } from '../workflows/runtime/RunSpendingTypes.js';
import { PricingCalculation, type PricingTariff } from './PricingTypes.js';

/** Matches the authority's bounded execution-time tariff grammar. */
export class PricingTariffCodec {
    public static read(raw: unknown, basis: WorkflowSpendingBasis): PricingTariff | null {
        const rated: boolean =
            basis === WorkflowSpendingBasis.Wallet ||
            basis === WorkflowSpendingBasis.Estimate ||
            basis === WorkflowSpendingBasis.IncludedEstimate;
        if (!rated) {
            if (raw !== null) {
                throw new Error('Unexpected tariff for unpriced usage');
            }
            return null;
        }
        const value: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const calculation: PricingCalculation | undefined = Object.values(PricingCalculation).find(
            (item: PricingCalculation): boolean => item === value['calculation'],
        );
        if (
            calculation === undefined ||
            (basis === WorkflowSpendingBasis.Wallet &&
                calculation === PricingCalculation.ReportTokens) ||
            (basis === WorkflowSpendingBasis.IncludedEstimate &&
                calculation !== PricingCalculation.WalletTokens)
        ) {
            throw new Error('Invalid usage tariff calculation');
        }
        const fields: readonly string[] =
            calculation === PricingCalculation.ReportUnits
                ? ['perThousandUnits', 'perCall']
                : [
                      'inputPerMillion',
                      'outputPerMillion',
                      'cachedInputPerMillion',
                      'cacheWritePerMillion',
                  ];
        WorkflowInput.record(value, [
            'calculation',
            ...fields.filter((field: string): boolean => Object.hasOwn(value, field)),
        ]);
        if (
            calculation === PricingCalculation.WalletTokens &&
            (!Object.hasOwn(value, 'inputPerMillion') || !Object.hasOwn(value, 'outputPerMillion'))
        ) {
            throw new Error('Missing original token rates');
        }
        if (
            basis === WorkflowSpendingBasis.Wallet &&
            calculation === PricingCalculation.ReportUnits &&
            Object.keys(value).length === 1
        ) {
            throw new Error('Missing original unit rates');
        }
        const rates: Record<string, string> = {};
        for (const field of fields) {
            if (!Object.hasOwn(value, field)) {
                continue;
            }
            const rate: unknown = value[field];
            if (
                typeof rate !== 'string' ||
                rate.length > 32 ||
                !/^(0|[1-9][0-9]*)(\.[0-9]+)?(e[+-]?[0-9]+)?$/u.test(rate) ||
                !Number.isFinite(Number(rate))
            ) {
                throw new Error('Invalid original usage rate');
            }
            rates[field] = rate;
        }
        return Object.freeze({ calculation, ...rates });
    }
}
