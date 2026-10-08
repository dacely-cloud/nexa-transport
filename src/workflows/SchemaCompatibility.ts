// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { SchemaKind, type ValueSchema, type SchemaField } from './SchemaTypes.js';

/** Conservative assignability. Ambiguous types require an explicit conversion or runtime check. */
export class SchemaCompatibility {
    public static accepts(target: ValueSchema, source: ValueSchema, depth: number = 0): boolean {
        if (depth > 32 || (source.nullable && !target.nullable)) {
            return false;
        }
        if (target.kind === SchemaKind.Json) {
            return source.kind !== SchemaKind.Flow && source.kind !== SchemaKind.Resource;
        }
        if (
            target.kind === SchemaKind.File &&
            [SchemaKind.Image, SchemaKind.Audio, SchemaKind.Video].some(
                (kind: SchemaKind): boolean => kind === source.kind,
            )
        ) {
            return true;
        }
        if (target.kind !== source.kind) {
            return false;
        }
        if (target.kind === SchemaKind.Resource && source.kind === SchemaKind.Resource) {
            return target.role === source.role;
        }
        if (target.kind === SchemaKind.List && source.kind === SchemaKind.List) {
            return (
                target.minItems <= source.minItems &&
                target.maxItems >= source.maxItems &&
                this.accepts(target.item, source.item, depth + 1)
            );
        }
        if (target.kind === SchemaKind.Object && source.kind === SchemaKind.Object) {
            const fields: ReadonlyMap<string, SchemaField> = new Map(
                source.fields.map((field: SchemaField): [string, SchemaField] => [
                    field.name,
                    field,
                ]),
            );
            if (
                !target.additional &&
                (source.additional ||
                    source.fields.some(
                        (field: SchemaField): boolean =>
                            !target.fields.some(
                                (expected: SchemaField): boolean => field.name === expected.name,
                            ),
                    ))
            ) {
                return false;
            }
            return target.fields.every((field: SchemaField): boolean => {
                const supplied: SchemaField | undefined = fields.get(field.name);
                if (supplied === undefined) {
                    return !field.required;
                }
                return (
                    (!field.required || supplied.required) &&
                    this.accepts(field.schema, supplied.schema, depth + 1)
                );
            });
        }
        if (target.kind === SchemaKind.Text && source.kind === SchemaKind.Text) {
            return (
                (target.minLength ?? 0) <= (source.minLength ?? 0) &&
                (target.maxLength ?? 33_554_432) >= (source.maxLength ?? 33_554_432) &&
                (target.choices === undefined ||
                    (source.choices !== undefined &&
                        source.choices.every(
                            (choice: string): boolean => target.choices?.includes(choice) === true,
                        )))
            );
        }
        if (
            (target.kind === SchemaKind.Number && source.kind === SchemaKind.Number) ||
            (target.kind === SchemaKind.Integer && source.kind === SchemaKind.Integer)
        ) {
            return (
                (target.whole !== true || source.whole === true) &&
                (target.minimum ?? -Infinity) <= (source.minimum ?? -Infinity) &&
                (target.maximum ?? Infinity) >= (source.maximum ?? Infinity)
            );
        }
        return true;
    }
}
