// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    SchemaKind,
    type ValueSchema,
    type ObjectSchema,
    type SchemaField,
    type ScalarSchema,
    type ResourceSchema,
    type ListSchema,
} from './SchemaTypes.js';

/** Shared schema constructors and standard envelopes used by registry, editor and runtime. */
export class Schemas {
    /** Detaches and freezes schemas before exposing them to consumers. Recursive schemas use named envelopes. */
    public static freeze(schema: ValueSchema, depth: number = 0): ValueSchema {
        if (depth > 32) {
            throw new Error('Component schema exceeds the supported depth');
        }
        if (schema.kind === SchemaKind.Object) {
            return Object.freeze({
                ...schema,
                fields: Object.freeze(
                    schema.fields.map((field: SchemaField): SchemaField =>
                        Object.freeze({ ...field, schema: this.freeze(field.schema, depth + 1) }),
                    ),
                ),
            });
        }
        if (schema.kind === SchemaKind.List) {
            return Object.freeze({ ...schema, item: this.freeze(schema.item, depth + 1) });
        }
        if ('choices' in schema && schema.choices !== undefined) {
            return Object.freeze({ ...schema, choices: Object.freeze([...schema.choices]) });
        }
        return Object.freeze({ ...schema });
    }
    public static readonly text: ScalarSchema = Object.freeze({
        kind: SchemaKind.Text,
        nullable: false,
    });
    public static readonly number: ScalarSchema = Object.freeze({
        kind: SchemaKind.Number,
        nullable: false,
    });
    public static readonly integer: ScalarSchema = Object.freeze({
        kind: SchemaKind.Integer,
        nullable: false,
    });
    public static readonly count: ScalarSchema = Object.freeze({ ...Schemas.integer, minimum: 0 });
    public static readonly boolean: ScalarSchema = Object.freeze({
        kind: SchemaKind.Boolean,
        nullable: false,
    });
    public static readonly timestamp: ScalarSchema = Object.freeze({
        kind: SchemaKind.Timestamp,
        nullable: false,
    });
    public static readonly json: ScalarSchema = Object.freeze({
        kind: SchemaKind.Json,
        nullable: true,
    });
    public static readonly flow: ScalarSchema = Object.freeze({
        kind: SchemaKind.Flow,
        nullable: false,
    });
    public static readonly file: ScalarSchema = Object.freeze({
        kind: SchemaKind.File,
        nullable: false,
    });
    public static readonly message: ScalarSchema = Object.freeze({
        kind: SchemaKind.Message,
        nullable: false,
    });
    public static readonly table: ScalarSchema = Object.freeze({
        kind: SchemaKind.Table,
        nullable: false,
    });

    public static field(name: string, schema: ValueSchema, required: boolean = true): SchemaField {
        return Object.freeze({ name, schema, required });
    }
    public static object(
        fields: readonly SchemaField[],
        additional: boolean = false,
    ): ObjectSchema {
        return Object.freeze({
            kind: SchemaKind.Object,
            nullable: false,
            fields: Object.freeze([...fields]),
            additional,
        });
    }
    public static list(
        item: ValueSchema,
        maximum: number = 10_000,
        minimum: number = 0,
    ): ListSchema {
        return Object.freeze({
            kind: SchemaKind.List,
            nullable: false,
            item,
            minItems: minimum,
            maxItems: maximum,
        });
    }
    public static resource(role: string): ResourceSchema {
        return Object.freeze({ kind: SchemaKind.Resource, nullable: false, role });
    }
    public static choice(values: readonly string[]): ScalarSchema {
        return Object.freeze({
            kind: SchemaKind.Text,
            nullable: false,
            choices: Object.freeze([...values]),
        });
    }
    public static readonly artifact: ObjectSchema = Schemas.object([
        Schemas.field('artifactId', Schemas.text),
        Schemas.field('name', Schemas.text),
        Schemas.field('contentType', Schemas.text),
        Schemas.field('bytes', Schemas.count),
    ]);
    public static readonly messageEnvelope: ObjectSchema = Schemas.object([
        Schemas.field('id', Schemas.text),
        Schemas.field('service', Schemas.text),
        Schemas.field('conversationId', Schemas.text),
        Schemas.field('senderId', Schemas.text),
        Schemas.field('receivedAtMs', Schemas.timestamp),
        Schemas.field('text', Schemas.text),
        Schemas.field('attachments', Schemas.list(Schemas.file, 128)),
    ]);
    public static readonly tableEnvelope: ObjectSchema = Schemas.object([
        Schemas.field('artifactId', Schemas.text),
        Schemas.field('rowCount', Schemas.count),
        Schemas.field('columns', Schemas.list(Schemas.text, 1_024)),
    ]);
    public static readonly resourceEnvelope: ObjectSchema = Schemas.object([
        Schemas.field('resourceId', Schemas.text),
        Schemas.field('version', Schemas.text),
        Schemas.field('role', Schemas.text),
    ]);
}
