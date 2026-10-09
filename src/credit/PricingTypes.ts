// SPDX-License-Identifier: Apache-2.0
import type { PricingBasis } from './PricingBasis.js';

/** Versions describe existing calculations, including their rounding behavior. */
export const PricingCalculation = {
    WalletTokens: 'wallet-tokens-v1',
    ReportTokens: 'report-tokens-v1',
    ReportUnits: 'report-units-v1',
} as const;
/** Stable calculation identity, independent of a mutable model name or configuration. */
export type PricingCalculation = (typeof PricingCalculation)[keyof typeof PricingCalculation];

/** Original decimal USD rates; absence retains the calculation's existing fallback semantics. */
export interface PricingTariff {
    readonly calculation: PricingCalculation;
    readonly inputPerMillion?: string;
    readonly outputPerMillion?: string;
    readonly cachedInputPerMillion?: string;
    readonly cacheWritePerMillion?: string;
    readonly perThousandUnits?: string;
    readonly perCall?: string;
}

/** Immutable evidence attached to usage. Missing evidence on a legacy row remains unknown. */
export interface PricingEvidence {
    readonly basis: PricingBasis;
    readonly tariff?: PricingTariff;
}
