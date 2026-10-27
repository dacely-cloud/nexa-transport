// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Strict JSON boundary primitives shared by request and response decoders. */
export class RedTeamInput {
    /** Reject unknown keys, accessors and non-plain objects before reading external data. */
    public static record(
        raw: unknown,
        required: readonly string[],
        optional: readonly string[] = [],
    ): Readonly<Record<string, unknown>> {
        if (!this.#plain(raw)) {
            throw new TypeError('Expected plain red team data');
        }
        const keys: readonly PropertyKey[] = Reflect.ownKeys(raw);
        if (
            keys.length > required.length + optional.length ||
            required.some((key: string): boolean => !Object.hasOwn(raw, key)) ||
            keys.some(
                (key: PropertyKey): boolean =>
                    typeof key !== 'string' || (!required.includes(key) && !optional.includes(key)),
            )
        ) {
            throw new TypeError('Unexpected or missing red team fields');
        }
        for (const key of keys) {
            const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                raw,
                key,
            );
            if (
                descriptor === undefined ||
                descriptor.get !== undefined ||
                descriptor.set !== undefined
            ) {
                throw new TypeError('Red team data cannot contain accessors');
            }
        }
        return raw;
    }
    /** Read well-formed bounded text, allowing an empty string only when explicitly requested. */
    public static text(raw: unknown, maximum: number, empty: boolean = false): string {
        if (
            typeof raw !== 'string' ||
            raw.length > maximum ||
            (!empty && raw.trim().length === 0) ||
            raw.includes('\0') ||
            !raw.isWellFormed()
        ) {
            throw new TypeError(`Expected red team text with at most ${maximum} characters`);
        }
        return raw;
    }
    /** Validate bounded identities used in requests, ledger references and session links. */
    public static id(raw: unknown): string {
        const value: string = this.text(raw, 256);
        if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(value)) {
            throw new TypeError('Invalid red team identity');
        }
        return value;
    }
    /** Preserve exact nonnegative signed int64 values as canonical decimal strings. */
    public static decimal(raw: unknown): string {
        if (
            typeof raw !== 'string' ||
            !/^(0|[1-9][0-9]{0,18})$/u.test(raw) ||
            BigInt(raw) > 9_223_372_036_854_775_807n
        ) {
            throw new RangeError('Invalid red team decimal integer');
        }
        return raw;
    }
    /** Read a deliberately small integer within inclusive host-controlled bounds. */
    public static integer(raw: unknown, minimum: number, maximum: number): number {
        if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < minimum || raw > maximum) {
            throw new RangeError(`Expected red team integer between ${minimum} and ${maximum}`);
        }
        return raw;
    }
    /** Bound collection length before decoding every external element. */
    public static list<T>(
        raw: unknown,
        maximum: number,
        decode: (value: unknown) => T,
    ): readonly T[] {
        if (!Array.isArray(raw) || raw.length > maximum) {
            throw new RangeError(`Red team list exceeds ${maximum} entries`);
        }
        return Array.from(raw, decode);
    }
    /** Accept only a value from the shared runtime discriminator definition. */
    public static choice<T extends string>(raw: unknown, choices: Readonly<Record<string, T>>): T {
        for (const value of Object.values(choices)) {
            if (raw === value) {
                return value;
            }
        }
        throw new TypeError('Invalid red team state');
    }
    /** Reject duplicate identities before they can introduce ambiguous ledger references. */
    public static unique(values: readonly string[]): void {
        if (new Set(values).size !== values.length) {
            throw new TypeError('Duplicate red team identity');
        }
    }
    static #plain(raw: unknown): raw is Readonly<Record<string, unknown>> {
        return (
            raw !== null &&
            typeof raw === 'object' &&
            !Array.isArray(raw) &&
            (Object.getPrototypeOf(raw) === Object.prototype || Object.getPrototypeOf(raw) === null)
        );
    }
}
