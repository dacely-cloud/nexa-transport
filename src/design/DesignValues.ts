// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Small strict boundary helpers shared by every design codec. */
export class DesignValues {
    /** Rejects getters, class instances and unsafe keys before reading external data. */
    public static record(raw: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
        return this.fields(raw, keys, keys);
    }
    /** Parses a plain boundary record with explicit required and optional fields. */
    public static fields(
        raw: unknown,
        allowed: readonly string[],
        required: readonly string[],
    ): Readonly<Record<string, unknown>> {
        if (
            raw === null ||
            typeof raw !== 'object' ||
            Array.isArray(raw) ||
            (Object.getPrototypeOf(raw) !== Object.prototype && Object.getPrototypeOf(raw) !== null)
        ) {
            throw new Error('Expected plain design data');
        }
        const values: Readonly<Record<string, unknown>> = raw as Readonly<Record<string, unknown>>;
        const names: readonly (string | symbol)[] = Reflect.ownKeys(values);
        if (
            required.some((key: string): boolean => !Object.hasOwn(values, key)) ||
            names.some(
                (key: string | symbol): boolean =>
                    typeof key !== 'string' || !allowed.includes(key),
            ) ||
            Object.values(Object.getOwnPropertyDescriptors(values)).some(
                (descriptor: PropertyDescriptor): boolean =>
                    descriptor.get !== undefined || descriptor.set !== undefined,
            )
        ) {
            throw new Error('Unexpected or missing design fields');
        }
        return values;
    }
    /** Bounded and well-formed text. */
    public static text(raw: unknown, maximum: number = 160, empty: boolean = false): string {
        if (
            typeof raw !== 'string' ||
            raw.length > maximum ||
            !raw.isWellFormed() ||
            raw.includes('\0') ||
            (!empty && raw.trim() === '')
        ) {
            throw new Error('Invalid design text');
        }
        return raw;
    }
    /** Stable opaque layer and document identity. */
    public static id(raw: unknown): string {
        const value: string = this.text(raw, 128);
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u.test(value)) {
            throw new Error('Invalid design identity');
        }
        return value;
    }
    /** Explicit absence is null. */
    public static optionalId(raw: unknown): string | null {
        return raw === null ? null : this.id(raw);
    }
    /** Only finite, bounded coordinates enter the scene. */
    public static number(
        raw: unknown,
        minimum: number = -100000,
        maximum: number = 100000,
        whole: boolean = false,
    ): number {
        if (
            typeof raw !== 'number' ||
            !Number.isFinite(raw) ||
            raw < minimum ||
            raw > maximum ||
            (whole && !Number.isInteger(raw))
        ) {
            throw new Error('Design number is outside supported bounds');
        }
        return raw;
    }
    /** Booleans never coerce strings or numbers. */
    public static boolean(raw: unknown): boolean {
        if (typeof raw !== 'boolean') {
            throw new Error('Expected a design boolean');
        }
        return raw;
    }
    /** Literal choices narrow through their runtime source of truth. */
    public static choice<T extends string>(raw: unknown, choices: readonly T[]): T {
        for (const choice of choices) {
            if (raw === choice) {
                return choice;
            }
        }
        throw new Error('Unsupported design choice');
    }
    /** Dense bounded arrays are copied before use. */
    public static list<T>(
        raw: unknown,
        maximum: number,
        parse: (entry: unknown) => T,
    ): readonly T[] {
        if (
            !Array.isArray(raw) ||
            raw.length > maximum ||
            (Object.getPrototypeOf(raw) !== Array.prototype && Object.getPrototypeOf(raw) !== null)
        ) {
            throw new Error('Design list exceeds supported bounds');
        }
        const keys: readonly (string | symbol)[] = Reflect.ownKeys(raw);
        if (
            keys.length !== raw.length + 1 ||
            keys.some(
                (key: string | symbol): boolean =>
                    typeof key !== 'string' ||
                    (key !== 'length' && !/^(0|[1-9][0-9]*)$/u.test(key)),
            ) ||
            Object.values(Object.getOwnPropertyDescriptors(raw)).some(
                (descriptor: PropertyDescriptor): boolean =>
                    descriptor.get !== undefined || descriptor.set !== undefined,
            )
        ) {
            throw new Error('Design lists require dense data without accessors');
        }
        return Object.freeze(Array.from(raw, parse));
    }
    /** Colors cannot inject CSS, URLs or markup. */
    public static color(raw: unknown): string {
        const value: string = this.text(raw, 9);
        if (!/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/iu.test(value)) {
            throw new Error('Use a six or eight digit hex color');
        }
        return value.toUpperCase();
    }
    /** Revisions retain integer precision across storage and transport. */
    public static revision(raw: unknown): string {
        const value: string = this.text(raw, 20);
        if (!/^[1-9][0-9]*$/u.test(value) || BigInt(value) > 9223372036854775807n) {
            throw new Error('Invalid design revision');
        }
        return value;
    }
}
