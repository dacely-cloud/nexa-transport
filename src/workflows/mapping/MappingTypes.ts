// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowEndpoint, WorkflowValue, WorkflowObject } from '../WorkflowTypes.js';

export const MappingMode = { Fields: 'Map fields', Template: 'Fill template' } as const;
export type MappingMode = (typeof MappingMode)[keyof typeof MappingMode];
export const MappingKind = {
    Field: 'Mapped field',
    Literal: 'Literal value',
    Expression: 'Advanced expression',
    Template: 'Text template',
} as const;
export type MappingKind = (typeof MappingKind)[keyof typeof MappingKind];
export const MappingType = {
    Text: 'Text',
    Integer: 'Integer',
    Number: 'Number',
    Boolean: 'Boolean',
    Json: 'JSON',
} as const;
export type MappingType = (typeof MappingType)[keyof typeof MappingType];
export const MappingMissing = {
    Reject: 'Require a value',
    Default: 'Use default',
    Omit: 'Omit optional field',
} as const;
export type MappingMissing = (typeof MappingMissing)[keyof typeof MappingMissing];
export const MappingConflict = {
    Reject: 'Reject conflicts',
    First: 'Prefer first field',
    Last: 'Prefer last field',
} as const;
export type MappingConflict = (typeof MappingConflict)[keyof typeof MappingConflict];
export const MappingIssueKind = {
    Missing: 'Missing',
    Null: 'Null',
    Type: 'Type mismatch',
    Conflict: 'Conflicting keys',
    Expression: 'Expression',
    Secret: 'Redacted',
    Path: 'Invalid path',
} as const;
export type MappingIssueKind = (typeof MappingIssueKind)[keyof typeof MappingIssueKind];
export const MappingSeverity = { Error: 'error', Warning: 'warning' } as const;
export type MappingSeverity = (typeof MappingSeverity)[keyof typeof MappingSeverity];
export interface MappingReference {
    readonly slot: string;
    readonly path: string;
}
export interface MappingField {
    readonly id: string;
    readonly target: string;
    readonly type: MappingType;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly kind: MappingKind;
    readonly reference: MappingReference;
    readonly expression: string;
    readonly literal: WorkflowValue;
    readonly missing: MappingMissing;
    readonly fallback: WorkflowValue;
}
/** Mapping intent stores references and literal configuration, never copied input samples. */
export interface MappingPlan {
    readonly version: '1';
    readonly conflict: MappingConflict;
    readonly fields: readonly MappingField[];
}
export interface MappingInput {
    readonly slot: string;
    readonly label: string;
    readonly endpoint: WorkflowEndpoint | null;
    readonly sample: WorkflowValue;
}
export interface MappingIssue {
    readonly fieldId: string;
    readonly kind: MappingIssueKind;
    readonly severity: MappingSeverity;
    readonly message: string;
}
export interface MappingResolved {
    readonly fieldId: string;
    readonly value: WorkflowValue;
    readonly omitted: boolean;
    readonly issue: MappingIssue | null;
}
export interface MappingResult {
    readonly output: WorkflowValue;
    readonly fields: readonly MappingResolved[];
    readonly issues: readonly MappingIssue[];
}
export interface MappingRead {
    readonly value: WorkflowValue;
    readonly missing: boolean;
    readonly redacted: boolean;
}
export interface MappingSourceField {
    readonly path: string;
    readonly type: string;
    readonly value: string;
}
export interface MappingExpressionResult extends MappingRead {
    readonly issue: MappingIssueKind | null;
    readonly message: string;
}
export interface MappingVariable {
    readonly start: number;
    readonly end: number;
    readonly expression: string;
    readonly reference: MappingReference;
}
/** Narrows a validated JSON value without losing readonly-array information. */
export function isMappingObject(value: WorkflowValue): value is WorkflowObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
