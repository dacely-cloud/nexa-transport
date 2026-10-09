// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowObject } from '../WorkflowTypes.js';
import {
    MappingKind,
    MappingMissing,
    MappingConflict,
    MappingIssueKind,
    MappingSeverity,
    type MappingField,
    type MappingPlan,
    type MappingInput,
    type MappingIssue,
    type MappingResolved,
    type MappingResult,
    type MappingExpressionResult,
} from './MappingTypes.js';
import { MappingPaths } from './MappingPaths.js';
import { MappingExpressions } from './MappingExpressions.js';
import { MappingValues } from './MappingValues.js';

/** Deterministic bounded sample evaluation reports business conflicts separately from invalid values. */
export class MappingEvaluator {
    public static inspect(plan: MappingPlan, inputs: readonly MappingInput[]): MappingResult {
        if (plan.fields.length === 0 || plan.fields.length > 24) {
            return {
                output: {},
                fields: [],
                issues: [
                    {
                        fieldId: 'plan',
                        kind: MappingIssueKind.Missing,
                        severity: MappingSeverity.Error,
                        message: 'Configure between one and 24 destination fields.',
                    },
                ],
            };
        }
        const fields: MappingResolved[] = plan.fields.map((field: MappingField): MappingResolved =>
            this.#field(field, inputs),
        );
        const issues: MappingIssue[] = fields.flatMap((field: MappingResolved): MappingIssue[] =>
            field.issue === null ? [] : [field.issue],
        );
        const selected: MappingField[] = [];
        for (const field of plan.fields) {
            const resolved: MappingResolved | undefined = fields.find(
                (item: MappingResolved): boolean => item.fieldId === field.id,
            );
            if (resolved === undefined || resolved.omitted || resolved.issue !== null) {
                continue;
            }
            const overlaps: readonly MappingField[] = selected.filter(
                (previous: MappingField): boolean =>
                    MappingPaths.overlaps(previous.target, field.target),
            );
            if (overlaps.length > 0) {
                const issue: MappingIssue = {
                    fieldId: field.id,
                    kind: MappingIssueKind.Conflict,
                    severity:
                        plan.conflict === MappingConflict.Reject
                            ? MappingSeverity.Error
                            : MappingSeverity.Warning,
                    message:
                        'Destination ' +
                        field.target +
                        ' overlaps ' +
                        overlaps.map((item: MappingField): string => item.target).join(', ') +
                        '. ' +
                        plan.conflict +
                        '.',
                };
                issues.push(issue);
                if (plan.conflict !== MappingConflict.Last) {
                    continue;
                }
                for (const previous of overlaps) {
                    selected.splice(selected.indexOf(previous), 1);
                }
            }
            selected.push(field);
        }
        const output: WorkflowObject = {};
        for (const field of selected) {
            const resolved: MappingResolved | undefined = fields.find(
                (item: MappingResolved): boolean => item.fieldId === field.id,
            );
            if (resolved !== undefined) {
                MappingPaths.write(output, field.target, resolved.value);
            }
        }
        return {
            output,
            fields: fields.map((resolved: MappingResolved): MappingResolved => {
                const conflict: MappingIssue | undefined = issues.find(
                    (issue: MappingIssue): boolean =>
                        issue.fieldId === resolved.fieldId &&
                        issue.severity === MappingSeverity.Error,
                );
                return {
                    ...resolved,
                    issue: conflict ?? resolved.issue,
                    omitted:
                        resolved.issue === null &&
                        conflict === undefined &&
                        !selected.some(
                            (field: MappingField): boolean => field.id === resolved.fieldId,
                        ),
                };
            }),
            issues,
        };
    }
    public static valid(result: MappingResult): boolean {
        return !result.issues.some(
            (issue: MappingIssue): boolean => issue.severity === MappingSeverity.Error,
        );
    }
    static #field(field: MappingField, inputs: readonly MappingInput[]): MappingResolved {
        try {
            MappingPaths.segments(field.target);
        } catch (caught: unknown) {
            return this.#problem(
                field.id,
                MappingIssueKind.Path,
                caught instanceof Error ? caught.message : 'Invalid destination path.',
            );
        }
        if (
            MappingPaths.segments(field.target).some((key: string): boolean =>
                MappingPaths.secret(key),
            )
        ) {
            return this.#problem(
                field.id,
                MappingIssueKind.Secret,
                'Destination secret fields are excluded from normal mapping previews.',
            );
        }
        let resolved: MappingExpressionResult;
        try {
            resolved =
                field.kind === MappingKind.Field
                    ? MappingExpressions.read(field.reference, inputs)
                    : field.kind === MappingKind.Expression
                      ? MappingExpressions.evaluate(field.expression, inputs)
                      : field.kind === MappingKind.Template
                        ? MappingExpressions.template(field.expression, inputs)
                        : {
                              value: field.literal,
                              missing: false,
                              redacted: false,
                              issue: null,
                              message: '',
                          };
        } catch (caught: unknown) {
            return this.#problem(
                field.id,
                MappingIssueKind.Expression,
                caught instanceof Error ? caught.message : 'Expression is invalid.',
            );
        }
        if (resolved.missing) {
            if (field.missing === MappingMissing.Default) {
                resolved = { ...resolved, value: field.fallback, missing: false, issue: null };
            } else if (field.missing === MappingMissing.Omit && !field.required) {
                return { fieldId: field.id, value: null, omitted: true, issue: null };
            }
        }
        if (resolved.issue !== null) {
            return this.#problem(field.id, resolved.issue, resolved.message);
        }
        if (MappingValues.hasSecret(resolved.value)) {
            return this.#problem(
                field.id,
                MappingIssueKind.Secret,
                'The selected object contains secret fields. Map individual permitted fields instead.',
            );
        }
        if (resolved.value === null && !field.nullable) {
            return this.#problem(
                field.id,
                MappingIssueKind.Null,
                'The value is explicitly null. Allow null or choose another source; defaults apply only to missing fields.',
            );
        }
        if (resolved.value !== null && !MappingValues.matches(resolved.value, field.type)) {
            return this.#problem(
                field.id,
                MappingIssueKind.Type,
                'Expected ' +
                    field.type +
                    ', received ' +
                    MappingValues.type(resolved.value) +
                    '. No implicit conversion.',
            );
        }
        return { fieldId: field.id, value: resolved.value, omitted: false, issue: null };
    }
    static #problem(fieldId: string, kind: MappingIssueKind, message: string): MappingResolved {
        return {
            fieldId,
            value: null,
            omitted: false,
            issue: { fieldId, kind, severity: MappingSeverity.Error, message },
        };
    }
}
