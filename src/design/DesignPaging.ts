// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Host-selected page sizes keep agent output below model truncation thresholds. */
export interface DesignPageLimits {
    readonly recordBudget: number;
    readonly fragmentCharacters: number;
}
/** Browser and model reads share cursor semantics while retaining different output budgets. */
export const DesignPaging: Readonly<Record<'Web' | 'Agent', DesignPageLimits>> = {
    Web: { recordBudget: 192 * 1024, fragmentCharacters: 8192 },
    Agent: { recordBudget: 12000, fragmentCharacters: 2048 },
};
