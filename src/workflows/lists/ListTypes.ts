// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { MappingPlan } from '../mapping/MappingTypes.js';
import type { WorkflowValue } from '../WorkflowTypes.js';
/** Deterministic collection operations share one component family. */
export const ListOperation = {
    Filter: 'filter',
    Sort: 'sort',
    Unique: 'unique',
    Limit: 'limit',
    Group: 'group',
    Map: 'map',
    Aggregate: 'aggregate',
} as const;
/** Saved operation identity. */
export type ListOperation = (typeof ListOperation)[keyof typeof ListOperation];
/** Comparisons never use JavaScript truthiness or type coercion. */
export const ListPredicate = {
    Equal: 'equal',
    NotEqual: 'not-equal',
    Greater: 'greater',
    Less: 'less',
    Contains: 'contains',
    Exists: 'exists',
    Missing: 'missing',
    Null: 'null',
} as const;
/** Saved filter comparison. */
export type ListPredicate = (typeof ListPredicate)[keyof typeof ListPredicate];
/** Integer mode retains exact decimal strings. */
export const ListValueType = {
    Text: 'text',
    Number: 'number',
    Integer: 'integer',
    Boolean: 'boolean',
} as const;
/** Explicit comparison and arithmetic type. */
export type ListValueType = (typeof ListValueType)[keyof typeof ListValueType];
/** Aggregate names have fixed empty-input semantics. */
export const ListAggregateKind = { Count: 'count', Sum: 'sum', Min: 'min', Max: 'max' } as const;
/** Saved aggregate kind. */
export type ListAggregateKind = (typeof ListAggregateKind)[keyof typeof ListAggregateKind];
/** Validated operation options exclude browser samples. */
export interface ListPlan {
    readonly operation: ListOperation;
    readonly path: string;
    readonly predicate: ListPredicate;
    readonly compare: WorkflowValue;
    readonly valueType: ListValueType;
    readonly descending: boolean;
    readonly offset: number;
    readonly limit: number;
    readonly aggregate: ListAggregateKind;
    readonly mapping: MappingPlan | null;
}
/** Every produced value retains its original input indexes, including groups and totals. */
export interface ListResult {
    readonly value: WorkflowValue;
    readonly indices: readonly (readonly number[])[];
    readonly inputCount: string;
    readonly outputCount: string;
}
/** A captured item and its stable original position. */
export interface ListRow {
    readonly item: WorkflowValue;
    readonly index: number;
}
