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
        const value: string = WorkflowInput.text(raw, 256);
        if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(value)) {
            throw new Error('Invalid workflow identity');
        }
        return value;
    }
    /** Bounded strings, with empty text allowed only for descriptive fields. */
    public static text(raw: unknown, maximum: number, empty: boolean = false): string {
        if (
            typeof raw !== 'string' ||
            raw.length > maximum ||
            (!empty && raw.trim().length === 0) ||
            raw.includes('\0') ||
            !raw.isWellFormed()
        ) {
            throw new Error(`Workflow text must fit ${maximum} characters`);
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
