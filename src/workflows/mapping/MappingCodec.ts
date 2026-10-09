// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: Apache-2.0

import { Schemas } from '../Schemas.js';
import { SchemaValues } from '../SchemaValues.js';
import type { ObjectSchema, SchemaProblem } from '../SchemaTypes.js';
import type { WorkflowObject, WorkflowValue } from '../WorkflowTypes.js';
import {
    MappingConflict,
    MappingKind,
    MappingMissing,
    MappingType,
    isMappingObject,
    type MappingField,
    type MappingPlan,
} from './MappingTypes.js';
import { MappingValues } from './MappingValues.js';

/** Versioned mapping plan codec validates untrusted checkpoints without evaluating code. */
export class MappingCodec {
    public static readonly schema: ObjectSchema = Schemas.object([
        Schemas.field('version', Schemas.choice(['1']), true),
        Schemas.field('conflict', Schemas.choice(Object.values(MappingConflict)), true),
        Schemas.field(
            'fields',
            Schemas.list(
                Schemas.object([
                    Schemas.field('id', Schemas.text, true),
                    Schemas.field('target', Schemas.text, true),
                    Schemas.field('type', Schemas.choice(Object.values(MappingType)), true),
                    Schemas.field('required', Schemas.boolean, true),
                    Schemas.field('nullable', Schemas.boolean, true),
                    Schemas.field('kind', Schemas.choice(Object.values(MappingKind)), true),
                    Schemas.field(
                        'reference',
                        Schemas.object([
                            Schemas.field('slot', Schemas.text, true),
                            Schemas.field('path', Schemas.text, true),
                        ]),
                        true,
                    ),
                    Schemas.field('expression', Schemas.text, true),
                    Schemas.field('literal', Schemas.json, true),
                    Schemas.field('missing', Schemas.choice(Object.values(MappingMissing)), true),
                    Schemas.field('fallback', Schemas.json, true),
                ]),
                24,
                1,
            ),
            true,
        ),
    ]);
    public static initial(): MappingPlan {
        return {
            version: '1',
            conflict: MappingConflict.Reject,
            fields: [this.field('site', '/project/name')],
        };
    }
    public static field(id: string, target: string = ''): MappingField {
        return {
            id,
            target,
            type: MappingType.Text,
            required: true,
            nullable: false,
            kind: MappingKind.Field,
            reference: { slot: 'source', path: '/record/site' },
            expression: '',
            literal: '',
            missing: MappingMissing.Reject,
            fallback: '',
        };
    }
    public static encode(plan: MappingPlan): WorkflowObject {
        return {
            version: plan.version,
            conflict: plan.conflict,
            fields: plan.fields.map((field: MappingField): WorkflowObject => ({
                id: field.id,
                target: field.target,
                type: field.type,
                required: field.required,
                nullable: field.nullable,
                kind: field.kind,
                reference: { slot: field.reference.slot, path: field.reference.path },
                expression: field.expression,
                literal: field.literal,
                missing: field.missing,
                fallback: field.fallback,
            })),
        };
    }
    public static parse(raw: unknown): MappingPlan {
        const issues: readonly SchemaProblem[] = SchemaValues.inspect(this.schema, raw);
        if (issues.length > 0) {
            throw new Error('Invalid mapping plan: ' + (issues[0]?.message ?? 'schema mismatch'));
        }
        const plan: WorkflowObject = this.#record(raw);
        const rows: WorkflowValue | undefined = plan['fields'];
        if (!Array.isArray(rows)) {
            throw new Error('Mapping rows are unavailable.');
        }
        const conflict: MappingConflict | undefined = Object.values(MappingConflict).find(
            (value: MappingConflict): boolean => value === plan['conflict'],
        );
        if (conflict === undefined) {
            throw new Error('Invalid merge rule.');
        }
        const fields: readonly MappingField[] = rows.map((value: WorkflowValue): MappingField => {
            const row: WorkflowObject = this.#record(value);
            const reference: WorkflowObject = this.#record(row['reference']);
            const type: MappingType | undefined = Object.values(MappingType).find(
                (item: MappingType): boolean => item === row['type'],
            );
            const kind: MappingKind | undefined = Object.values(MappingKind).find(
                (item: MappingKind): boolean => item === row['kind'],
            );
            const missing: MappingMissing | undefined = Object.values(MappingMissing).find(
                (item: MappingMissing): boolean => item === row['missing'],
            );
            if (
                type === undefined ||
                kind === undefined ||
                missing === undefined ||
                typeof row['required'] !== 'boolean' ||
                typeof row['nullable'] !== 'boolean'
            ) {
                throw new Error('Invalid mapping field options.');
            }
            return {
                id: this.#text(row['id'], 100),
                target: this.#text(row['target'], 300),
                type,
                kind,
                required: row['required'],
                nullable: row['nullable'],
                reference: {
                    slot: this.#text(reference['slot'], 100),
                    path: this.#text(reference['path'], 300),
                },
                expression: this.#text(row['expression'], 2000),
                literal: MappingValues.validate(row['literal']),
                missing,
                fallback: MappingValues.validate(row['fallback']),
            };
        });
        if (fields.some((field: MappingField): boolean => field.id.trim() === '')) {
            throw new Error('Mapping field identity cannot be empty.');
        }
        if (
            fields.some(
                (field: MappingField): boolean =>
                    MappingValues.hasSecret(field.literal) ||
                    MappingValues.hasSecret(field.fallback),
            )
        ) {
            throw new Error('Secret fields cannot be stored in mapping literals or defaults.');
        }
        if (new Set(fields.map((field: MappingField): string => field.id)).size !== fields.length) {
            throw new Error('Mapping field identities must be unique.');
        }
        return { version: '1', conflict, fields };
    }
    public static fromConfiguration(configuration: WorkflowObject): MappingPlan {
        if (configuration['mapping_plan'] !== undefined) {
            return this.parse(configuration['mapping_plan']);
        }
        const initial: MappingPlan = this.initial();
        const first: MappingField | undefined = initial.fields[0];
        if (first === undefined) {
            throw new Error('Initial mapping missing.');
        }
        const source: WorkflowValue | undefined = configuration['source_path'];
        const target: WorkflowValue | undefined = configuration['target_field'];
        const fallback: WorkflowValue | undefined = configuration['default_value'];
        return {
            ...initial,
            fields: [
                {
                    ...first,
                    missing:
                        typeof fallback === 'string' && fallback !== ''
                            ? MappingMissing.Default
                            : first.missing,
                    fallback: typeof fallback === 'string' ? fallback : first.fallback,
                    target:
                        typeof target === 'string'
                            ? '/' + target.replaceAll('.', '/')
                            : first.target,
                    reference: {
                        slot: 'source',
                        path:
                            typeof source === 'string'
                                ? '/' + source.replaceAll('.', '/')
                                : first.reference.path,
                    },
                },
            ],
        };
    }
    static #record(raw: unknown): WorkflowObject {
        const value: WorkflowValue = MappingValues.validate(raw);
        if (!isMappingObject(value)) {
            throw new Error('Expected named mapping fields.');
        }
        return value;
    }
    static #text(raw: WorkflowValue | undefined, max: number): string {
        if (typeof raw !== 'string' || raw.length > max) {
            throw new Error('Mapping text exceeds its limit.');
        }
        return raw;
    }
}
