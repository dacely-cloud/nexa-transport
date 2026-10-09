// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Small shared parsers for workflow JSON trust boundaries. */
export class WorkflowInput {
    /** Rejects class instances and accessors before reading values. */
    public static object(raw: unknown): Readonly<Record<string, unknown>> {
        if (
            !this.#plain(raw) ||
            Object.values(Object.getOwnPropertyDescriptors(raw)).some(
                (field: PropertyDescriptor): boolean =>
                    field.get !== undefined || field.set !== undefined,
            )
        ) {
            throw new Error('Expected plain workflow data');
        }
        return raw;
    }
    /** Strict shapes prevent newer fields being silently discarded by an older writer. */
    public static record(raw: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
        const value: Readonly<Record<string, unknown>> = this.object(raw);
        if (
            Reflect.ownKeys(value).length !== keys.length ||
            keys.some((key: string): boolean => !Object.hasOwn(value, key))
        ) {
            throw new Error('Unexpected or missing workflow fields');
        }
        return value;
    }
    /** Only stable opaque references are accepted as record and command identities. */
    public static id(raw: unknown): string {
        if (typeof raw !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(raw)) {
            throw new Error('Invalid workflow identity');
        }
        return raw;
    }
    /** Valid text with an optional field-specific bound; malformed values report their actual cause. */
    public static text(
        raw: unknown,
        maximum: number | null = null,
        empty: boolean = false,
    ): string {
        if (typeof raw !== 'string') {
            throw new Error('Expected workflow text');
        }
        if (!empty && raw.trim().length === 0) {
            throw new Error('Workflow text cannot be blank');
        }
        if (raw.includes('\0')) {
            throw new Error('Workflow text contains a null character');
        }
        if (!raw.isWellFormed()) {
            throw new Error('Workflow text contains malformed Unicode');
        }
        if (maximum !== null && raw.length > maximum) {
            throw new Error(`Text exceeds ${maximum} characters`);
        }
        return raw;
    }
    /** Copies arrays and visits holes rather than accepting sparse configurations. */
    public static list<T>(
        raw: unknown,
        maximum: number,
        decode: (value: unknown) => T,
    ): readonly T[] {
        if (!Array.isArray(raw) || raw.length > maximum) {
            throw new Error(`Workflow list exceeds ${maximum} entries`);
        }
        return Object.freeze(Array.from(raw, decode));
    }
    /** Duplicate identities make patch ordering ambiguous. */
    public static unique(values: readonly string[]): void {
        if (new Set(values).size !== values.length) {
            throw new Error('Duplicate workflow identity');
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
