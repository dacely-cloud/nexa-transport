// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ScalarConversion, ConversionKind } from '../ScalarConversion.js';
import type { WorkflowValue } from '../WorkflowTypes.js';
import { ListAggregateKind, ListValueType } from './ListTypes.js';
import { ListValues } from './ListValues.js';

interface DecimalTerm {
    readonly coefficient: bigint;
    readonly scale: number;
}
/** Totals use exact decimal arithmetic and validate their final representation. */
export class ListAggregate {
    /** Count and sum return zero for an empty list; min/max fail without inventing a value. */
    public static evaluate(
        values: readonly WorkflowValue[],
        kind: ListAggregateKind,
        type: ListValueType,
    ): WorkflowValue {
        if (kind === ListAggregateKind.Count) {
            return values.length.toString();
        }
        for (const value of values) {
            ListValues.comparable(value, type);
        }
        if (kind === ListAggregateKind.Min || kind === ListAggregateKind.Max) {
            let selected: WorkflowValue | undefined = values[0];
            if (selected === undefined) {
                throw new Error('Minimum and maximum require at least one item.');
            }
            for (const value of values.slice(1)) {
                if (
                    ListValues.compare(value, selected, type) *
                        (kind === ListAggregateKind.Min ? 1 : -1) <
                    0
                ) {
                    selected = value;
                }
            }
            return selected;
        }
        if (type === ListValueType.Integer) {
            let sum: bigint = 0n;
            for (const value of values) {
                sum += BigInt(String(value));
            }
            return ScalarConversion.convert(ConversionKind.Integer, sum.toString());
        }
        const terms: readonly DecimalTerm[] = values.map((value: WorkflowValue): DecimalTerm =>
            this.#term(String(value)),
        );
        const scale: number = Math.max(0, ...terms.map((term: DecimalTerm): number => term.scale));
        let coefficient: bigint = 0n;
        for (const term of terms) {
            coefficient += term.coefficient * 10n ** BigInt(scale - term.scale);
        }
        if (coefficient === 0n) {
            return 0;
        }
        const digits: string = coefficient.toString();
        const significant: string = digits.replace(/0+$/u, '');
        return ScalarConversion.convert(
            ConversionKind.Number,
            significant + 'e' + String(digits.length - significant.length - scale),
        );
    }
    /** Native finite doubles use at most 324 decimal places; exponent allocation is bounded. */
    static #term(text: string): DecimalTerm {
        const [mantissa = '', exponent = '0']: string[] = text.split('e');
        const [whole = '', fraction = '']: string[] = mantissa.split('.');
        const shift: number = fraction.length - Number(exponent);
        const coefficient: bigint = BigInt(whole + fraction);
        return shift < 0
            ? { coefficient: coefficient * 10n ** BigInt(-shift), scale: 0 }
            : { coefficient, scale: shift };
    }
}
