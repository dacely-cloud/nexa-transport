// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    SchemaKind,
    type ValueSchema,
    type ObjectSchema,
    type SchemaProblem,
    type SchemaField,
} from './SchemaTypes.js';
import { Schemas } from './Schemas.js';
import { WorkflowJson } from './WorkflowJson.js';
import { WorkflowInput } from './WorkflowInput.js';
import { ResourceBindingCodec } from './ResourceBindingCodec.js';

/** Bounded runtime value validation. Never fills, coerces or silently removes input. */
export class SchemaValues {
    readonly #problems: SchemaProblem[] = [];
    #values: number = 0;
    public static inspect(schema: ValueSchema, raw: unknown): readonly SchemaProblem[] {
        const validation: SchemaValues = new SchemaValues();
        validation.#check(schema, raw, '$', 0);
        return Object.freeze(validation.#problems);
    }
    #problem(path: string, message: string): void {
        if (this.#problems.length < 100) {
            this.#problems.push(
                Object.freeze({
                    path: path.length > 512 ? `${path.slice(0, 509)}...` : path,
                    message,
                }),
            );
        }
    }
    #check(schema: ValueSchema, raw: unknown, path: string, depth: number): void {
        if (this.#problems.length >= 100) {
            return;
        }
        this.#values += 1;
        if (depth > 32 || this.#values > 100_000) {
            this.#problem(path, 'Value exceeds validation depth or count limits');
            return;
        }
        if (raw === undefined) {
            this.#problem(path, 'Required value is missing');
            return;
        }
        if (raw === null) {
            if (!schema.nullable) {
                this.#problem(path, 'Null is not allowed');
            }
            return;
        }
        switch (schema.kind) {
            case SchemaKind.Object:
                this.#object(schema, raw, path, depth);
                return;
            case SchemaKind.List:
                if (
                    !Array.isArray(raw) ||
                    raw.length < schema.minItems ||
                    raw.length > schema.maxItems
                ) {
                    this.#problem(path, 'List length or type does not match');
                    return;
                }
                for (let index: number = 0; index < raw.length; index += 1) {
                    this.#check(schema.item, raw[index], `${path}[${index}]`, depth + 1);
                }
                return;
            case SchemaKind.Resource:
                this.#object(Schemas.resourceEnvelope, raw, path, depth);
                if (
                    this.#problems.length === 0 &&
                    WorkflowInput.object(raw)['role'] !== schema.role
                ) {
                    this.#problem(path, 'Resource role does not match');
                }
                return;
            case SchemaKind.Json:
                try {
                    WorkflowJson.object({ value: raw });
                } catch {
                    this.#problem(path, 'Expected bounded JSON data');
                }
                return;
            case SchemaKind.Flow:
                this.#problem(path, 'Execution flow is not a data value');
                return;
            case SchemaKind.File:
            case SchemaKind.Image:
            case SchemaKind.Audio:
            case SchemaKind.Video:
                this.#object(Schemas.artifact, raw, path, depth);
                if (schema.kind !== SchemaKind.File && this.#problems.length === 0) {
                    const contentType: unknown = WorkflowInput.object(raw)['contentType'];
                    if (
                        typeof contentType !== 'string' ||
                        !contentType.startsWith(`${schema.kind}/`)
                    ) {
                        this.#problem(path, 'Artifact content type does not match');
                    }
                }
                return;
            case SchemaKind.Message:
                this.#object(Schemas.messageEnvelope, raw, path, depth);
                return;
            case SchemaKind.Table:
                this.#object(Schemas.tableEnvelope, raw, path, depth);
                return;
            case SchemaKind.Datetime:
                if (
                    typeof raw !== 'string' ||
                    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(raw) ||
                    !Number.isFinite(Date.parse(raw)) ||
                    new Date(raw).toISOString() !== raw
                ) {
                    this.#problem(path, 'Expected a canonical UTC date/time with milliseconds');
                }
                return;
            case SchemaKind.Integer:
                if (
                    typeof raw !== 'string' ||
                    !/^(?:0|[1-9][0-9]*|-[1-9][0-9]*)$/u.test(raw) ||
                    raw.length > 20
                ) {
                    this.#problem(path, 'Expected a canonical signed-64-bit decimal string');
                    return;
                }
                {
                    const value: bigint = BigInt(raw);
                    if (
                        value < -9_223_372_036_854_775_808n ||
                        value > 9_223_372_036_854_775_807n ||
                        (schema.minimum !== undefined && value < BigInt(schema.minimum)) ||
                        (schema.maximum !== undefined && value > BigInt(schema.maximum))
                    ) {
                        this.#problem(path, 'Integer is outside its bounds');
                    }
                }
                return;
            case SchemaKind.Timestamp:
                try {
                    ResourceBindingCodec.decimal(raw);
                } catch {
                    this.#problem(
                        path,
                        'Expected a canonical nonnegative signed-64-bit decimal string',
                    );
                }
                return;
            case SchemaKind.Boolean:
                if (typeof raw !== 'boolean') {
                    this.#problem(path, 'Expected a boolean');
                }
                return;
            case SchemaKind.Number:
                if (
                    typeof raw !== 'number' ||
                    !Number.isFinite(raw) ||
                    (schema.whole === true && !Number.isInteger(raw)) ||
                    (Number.isInteger(raw) && !Number.isSafeInteger(raw)) ||
                    (schema.minimum !== undefined && raw < schema.minimum) ||
                    (schema.maximum !== undefined && raw > schema.maximum)
                ) {
                    this.#problem(path, 'Number is invalid or outside its bounds');
                }
                return;
            case SchemaKind.Text:
                if (
                    typeof raw !== 'string' ||
                    (schema.minLength !== undefined && raw.length < schema.minLength) ||
                    raw.length > (schema.maxLength ?? 33_554_432) ||
                    (schema.choices !== undefined && !schema.choices.includes(raw))
                ) {
                    this.#problem(path, 'Text is invalid or outside its allowed values');
                }
                return;
        }
    }
    #object(schema: ObjectSchema, raw: unknown, path: string, depth: number): void {
        let value: Readonly<Record<string, unknown>>;
        try {
            value = WorkflowInput.object(raw);
        } catch {
            this.#problem(path, 'Expected a plain object');
            return;
        }
        const fields: ReadonlySet<string> = new Set(
            schema.fields.map((field: SchemaField): string => field.name),
        );
        const keys: readonly string[] = Object.keys(value);
        if (keys.length > 10_000) {
            this.#problem(path, 'Object has too many fields');
            return;
        }
        if (!schema.additional) {
            for (const key of keys) {
                if (!fields.has(key)) {
                    this.#problem(`${path}.${key}`, 'Unexpected field');
                }
            }
        } else {
            try {
                WorkflowJson.object(raw);
            } catch {
                this.#problem(path, 'Object contains invalid JSON data');
                return;
            }
        }
        for (const field of schema.fields) {
            if (!Object.hasOwn(value, field.name) && !field.required) {
                continue;
            }
            this.#check(field.schema, value[field.name], `${path}.${field.name}`, depth + 1);
        }
    }
}
