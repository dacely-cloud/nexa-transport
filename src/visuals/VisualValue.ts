// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Shared boundary primitives keep the portable visual decoder strict and bounded. */
export class VisualValue {
    public static record(
        raw: unknown,
        fields: readonly string[],
        complete: boolean = false,
    ): Readonly<Record<string, unknown>> {
        if (
            typeof raw !== 'object' ||
            raw === null ||
            Array.isArray(raw) ||
            Object.keys(raw).some((key: string): boolean => !fields.includes(key))
        ) {
            throw new Error('Unexpected visual fields. Use only the documented UI instructions.');
        }
        if (
            complete &&
            fields.some(
                (field: string): boolean =>
                    !Object.hasOwn(raw, field) || Reflect.get(raw, field) === undefined,
            )
        ) {
            throw new Error(
                'Incomplete visual delivery. Native tools must normalize optional UI fields before transmission.',
            );
        }
        return raw as Readonly<Record<string, unknown>>;
    }
    public static text(raw: unknown, limit: number, fallback?: string): string {
        if (raw === undefined && fallback !== undefined) {
            return fallback;
        }
        if (
            typeof raw !== 'string' ||
            raw.length > limit ||
            (fallback === undefined && raw.trim() === '')
        ) {
            throw new Error(`Invalid visual text. Maximum ${limit} characters.`);
        }
        return raw;
    }
    public static id(raw: unknown): string {
        const id: string = this.text(raw, 64);
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/u.test(id)) {
            throw new Error('Visual identifiers use letters, digits, underscores and hyphens.');
        }
        return id;
    }
    public static number(raw: unknown, min: number, max: number): number {
        if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < min || raw > max) {
            throw new Error('Visual geometry is outside the supported bounds.');
        }
        return raw;
    }
    public static choice<T extends string>(
        raw: unknown,
        values: Readonly<Record<string, T>>,
        fallback: T,
    ): T {
        if (raw === undefined) {
            return fallback;
        }
        const value: T | undefined = Object.values(values).find(
            (value: T): boolean => value === raw,
        );
        if (value === undefined) {
            throw new Error('Unsupported visual style.');
        }
        return value;
    }
    public static array(raw: unknown, max: number): readonly unknown[] {
        if (raw === undefined) {
            return [];
        }
        if (!Array.isArray(raw) || raw.length > max) {
            throw new Error('Too many visual instructions.');
        }
        return raw;
    }
}
