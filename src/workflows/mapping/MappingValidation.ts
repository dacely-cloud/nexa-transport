// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowValue } from '../WorkflowTypes.js';
import type { MappingType } from './MappingTypes.js';
import { MappingCodec } from './MappingCodec.js';
import { MappingPaths } from './MappingPaths.js';
import { MappingExpressions } from './MappingExpressions.js';
import { MappingValues } from './MappingValues.js';
import {
    MappingKind,
    MappingMissing,
    type MappingPlan,
    type MappingReference,
} from './MappingTypes.js';

/** Static authoring checks never substitute fixture values for actual bindings. */
export class MappingValidation {
    public static parse(raw: unknown, available: ReadonlySet<string>): MappingPlan {
        const plan: MappingPlan = MappingCodec.parse(raw);
        for (const field of plan.fields) {
            try {
                if (
                    MappingPaths.segments(field.target).some((key: string): boolean =>
                        MappingPaths.secret(key),
                    )
                ) {
                    throw new Error('Choose a non-secret destination field.');
                }
                if (field.required && field.missing === MappingMissing.Omit) {
                    throw new Error('A required field cannot be omitted.');
                }
                const references: readonly MappingReference[] =
                    field.kind === MappingKind.Field
                        ? [field.reference]
                        : field.kind === MappingKind.Expression
                          ? [MappingExpressions.validate(field.expression)]
                          : field.kind === MappingKind.Template
                            ? MappingExpressions.variables(field.expression).map(
                                  (variable): MappingReference => variable.reference,
                              )
                            : [];
                for (const reference of references) {
                    MappingPaths.segments(reference.path);
                    if (!['source', 'context'].includes(reference.slot)) {
                        throw new Error('Choose the source or context input.');
                    }
                    if (
                        MappingPaths.segments(reference.path).some((key: string): boolean =>
                            MappingPaths.secret(key),
                        )
                    ) {
                        throw new Error('Secret references cannot be used in field mappings.');
                    }
                    if (!available.has(reference.slot) && field.missing === MappingMissing.Reject) {
                        throw new Error(
                            'Connect the ' +
                                reference.slot +
                                ' input or choose an explicit missing-value rule.',
                        );
                    }
                }
                if (
                    field.kind === MappingKind.Literal &&
                    !this.#matches(field.literal, field.type, field.nullable)
                ) {
                    throw new Error('Literal does not match the declared type and null policy.');
                }
                if (
                    field.missing === MappingMissing.Default &&
                    !this.#matches(field.fallback, field.type, field.nullable)
                ) {
                    throw new Error('Default does not match the declared type and null policy.');
                }
            } catch (caught: unknown) {
                throw new Error(
                    'Mapping field ' +
                        field.id +
                        ': ' +
                        (caught instanceof Error ? caught.message : 'Invalid field.'),
                    { cause: caught },
                );
            }
        }
        return plan;
    }
    static #matches(value: WorkflowValue, type: MappingType, nullable: boolean): boolean {
        return value === null ? nullable : MappingValues.matches(value, type);
    }
}
