// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { Schemas } from './Schemas.js';
import type { ScalarSchema } from './SchemaTypes.js';
import type { WorkflowValue } from './WorkflowTypes.js';

/** Fixed output contracts keep converted values compatible with downstream typed ports. */
export const ConversionKind = {
    Text: 'text',
    Number: 'number',
    Integer: 'integer',
    Boolean: 'boolean',
} as const;
/** A conversion target is chosen explicitly, never inferred from a string's contents. */
export type ConversionKind = (typeof ConversionKind)[keyof typeof ConversionKind];
/** Shared deterministic scalar conversion for worker execution and local previews. */
export class ScalarConversion {
    /** The component ID fixes the output schema for its entire version. */
    public static kind(component: string): ConversionKind | null {
        return (
            Object.values(ConversionKind).find(
                (kind: ConversionKind): boolean => component === 'data.to-' + kind,
            ) ?? null
        );
    }
    /** Integer ports use canonical signed-64-bit decimal strings, not JavaScript numbers. */
    public static schema(kind: ConversionKind): ScalarSchema {
        switch (kind) {
            case ConversionKind.Text:
                return { ...Schemas.text, maxLength: 128000 };
            case ConversionKind.Number:
                return Schemas.number;
            case ConversionKind.Integer:
                return Schemas.integer;
            case ConversionKind.Boolean:
                return Schemas.boolean;
        }
    }
    /** Missing and null fail separately; neither receives an implicit default or empty value. */
    public static convert(
        kind: ConversionKind,
        raw: WorkflowValue | undefined,
        trim: boolean = false,
        numericBooleans: boolean = false,
    ): string | number | boolean {
        if (raw === undefined) {
            throw new Error('Conversion input is missing.');
        }
        if (raw === null) {
            throw new Error('Conversion input is null. Choose a value before converting.');
        }
        if (typeof raw === 'object') {
            throw new Error(
                'Choose a scalar field first. Use JSON to text to serialize an object or list.',
            );
        }
        if (typeof raw === 'string' && raw.length > 128000) {
            throw new Error('Conversion text exceeds 128,000 characters.');
        }
        if (
            typeof raw === 'number' &&
            (!Number.isFinite(raw) || (Number.isInteger(raw) && !Number.isSafeInteger(raw)))
        ) {
            throw new Error(
                'Number is not safely represented. Keep large integers as decimal text.',
            );
        }
        const value: string | number | boolean = typeof raw === 'string' && trim ? raw.trim() : raw;
        switch (kind) {
            case ConversionKind.Text:
                return String(value);
            case ConversionKind.Boolean:
                if (typeof value === 'boolean') {
                    return value;
                }
                if (value === 'true') {
                    return true;
                }
                if (value === 'false') {
                    return false;
                }
                if (numericBooleans && (value === 0 || value === '0')) {
                    return false;
                }
                if (numericBooleans && (value === 1 || value === '1')) {
                    return true;
                }
                throw new Error(
                    'Use true or false. Enable 0/1 conversion explicitly to accept numeric booleans.',
                );
            case ConversionKind.Integer: {
                if (typeof value === 'boolean') {
                    throw new Error('A boolean is not an integer.');
                }
                if (typeof value === 'number' && !Number.isSafeInteger(value)) {
                    throw new Error('Integer conversion cannot round a fractional value.');
                }
                const text: string = String(value);
                if (text.length > 20 || !/^(?:0|[1-9][0-9]*|-[1-9][0-9]*)$/u.test(text)) {
                    throw new Error(
                        'Use a whole decimal integer without fractions, exponents or leading zeros.',
                    );
                }
                const integer: bigint = BigInt(text);
                if (integer < -9223372036854775808n || integer > 9223372036854775807n) {
                    throw new Error('Integer exceeds signed 64-bit bounds.');
                }
                return integer.toString();
            }
            case ConversionKind.Number: {
                if (typeof value === 'number') {
                    return value;
                }
                if (
                    typeof value !== 'string' ||
                    value.length > 128 ||
                    !/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/u.test(value)
                ) {
                    throw new Error(
                        'Use decimal number text. Empty text, booleans and hexadecimal values are not numbers.',
                    );
                }
                const number: number = Number(value);
                if (
                    !Number.isFinite(number) ||
                    (Number.isInteger(number) && !Number.isSafeInteger(number)) ||
                    this.#decimal(value) !== this.#decimal(String(number))
                ) {
                    throw new Error(
                        'Conversion would lose precision or exceed number bounds. Use an integer or keep decimal text.',
                    );
                }
                return number;
            }
        }
    }
    /** Canonical decimal comparison rejects rounding and underflow without building large powers. */
    static #decimal(text: string): string {
        const [mantissa = '', exponent = '0']: string[] = text.toLowerCase().split('e');
        const [whole = '', fraction = '']: string[] = mantissa.split('.');
        const digits: string = (whole + fraction).replace('-', '').replace(/^0+/u, '');
        if (digits === '') {
            return '0';
        }
        const significant: string = digits.replace(/0+$/u, '');
        const shift: bigint =
            BigInt(exponent) - BigInt(fraction.length) + BigInt(digits.length - significant.length);
        return (text.startsWith('-') ? '-' : '') + significant + 'e' + shift.toString();
    }
}
