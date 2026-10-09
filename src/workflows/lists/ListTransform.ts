// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowObject, WorkflowValue } from '../WorkflowTypes.js';
import { WorkflowJson } from '../WorkflowJson.js';
import { MappingEvaluator } from '../mapping/MappingEvaluator.js';
import type { MappingInput, MappingResult, MappingRead } from '../mapping/MappingTypes.js';
import { ListPlans } from './ListPlan.js';
import { ListValues } from './ListValues.js';
import { ListAggregate } from './ListAggregate.js';
import {
    ListOperation,
    ListPredicate,
    type ListPlan,
    type ListResult,
    type ListRow,
} from './ListTypes.js';

interface ListGroup {
    readonly key: WorkflowValue;
    readonly items: WorkflowValue[];
    readonly indices: number[];
}
/** Bounded synchronous list transforms are identical in local previews and durable worker invocations. */
export class ListTransform {
    /** Reject oversized inputs before inspecting rows; successful results include exact source positions. */
    public static execute(
        configuration: WorkflowObject,
        input: WorkflowValue | undefined,
        context?: WorkflowValue,
        signal?: AbortSignal,
    ): ListResult {
        signal?.throwIfAborted();
        const plan: ListPlan = ListPlans.parse(configuration, context !== undefined);
        if (input === undefined) {
            throw new Error('List input is missing.');
        }
        if (input === null) {
            throw new Error('List input is null.');
        }
        if (!this.#array(input)) {
            throw new Error('List input must be an array. Select a collection field first.');
        }
        if (input.length > 1000) {
            throw new Error('List input exceeds 1,000 items. Split or limit it upstream.');
        }
        this.#budget({ input, context: context ?? null });
        const validated: WorkflowValue | undefined = WorkflowJson.object({ items: input })['items'];
        if (validated === undefined || !this.#array(validated)) {
            throw new Error('Invalid list input.');
        }
        const original: readonly ListRow[] = validated.map(
            (item: WorkflowValue, index: number): ListRow => ({ item, index }),
        );
        let rows: readonly ListRow[] = original;
        if (plan.operation === ListOperation.Filter) {
            rows = original.filter((row: ListRow): boolean => {
                signal?.throwIfAborted();
                try {
                    return this.#matches(row.item, plan);
                } catch (error: unknown) {
                    throw this.#error(row.index, error);
                }
            });
        }
        if (plan.operation === ListOperation.Sort) {
            for (const row of original) {
                try {
                    ListValues.comparable(ListValues.key(row.item, plan.path), plan.valueType);
                } catch (error: unknown) {
                    throw this.#error(row.index, error);
                }
            }
            rows = original.toSorted(
                (a: ListRow, b: ListRow): number =>
                    ListValues.compare(
                        ListValues.key(a.item, plan.path),
                        ListValues.key(b.item, plan.path),
                        plan.valueType,
                    ) * (plan.descending ? -1 : 1) || a.index - b.index,
            );
        }
        if (plan.operation === ListOperation.Unique) {
            const keys: Set<string> = new Set();
            rows = original.filter((row: ListRow): boolean => {
                let key: string;
                try {
                    key = ListValues.identity(ListValues.key(row.item, plan.path));
                } catch (error: unknown) {
                    throw this.#error(row.index, error);
                }
                if (keys.has(key)) {
                    return false;
                }
                keys.add(key);
                return true;
            });
        }
        if (plan.operation === ListOperation.Limit) {
            rows = original.slice(plan.offset, plan.offset + plan.limit);
        }
        let value: WorkflowValue = rows.map((row: ListRow): WorkflowValue => row.item);
        let indices: readonly (readonly number[])[] = rows.map(
            (row: ListRow): readonly number[] => [row.index],
        );
        if (plan.operation === ListOperation.Map) {
            const mapped: WorkflowValue[] = [];
            let bytes: number = 0;
            if (plan.mapping === null) {
                throw new Error('Configure item mappings.');
            }
            for (const row of original) {
                signal?.throwIfAborted();
                const inputs: readonly MappingInput[] = [
                    {
                        slot: 'source',
                        label: 'Current item',
                        endpoint: null,
                        sample: { item: row.item, index: row.index },
                    },
                    ...(context === undefined
                        ? []
                        : [{ slot: 'context', label: 'Context', endpoint: null, sample: context }]),
                ];
                const result: MappingResult = MappingEvaluator.inspect(plan.mapping, inputs);
                if (!MappingEvaluator.valid(result)) {
                    throw new Error(
                        'Item ' +
                            String(row.index) +
                            ': ' +
                            (result.issues.find((issue): boolean => issue.severity === 'error')
                                ?.message ?? 'Invalid mapping.'),
                    );
                }
                bytes += new TextEncoder().encode(JSON.stringify(result.output)).byteLength;
                if (bytes > 1_048_576) {
                    throw new Error('Mapped list exceeds 1 MiB. Select fewer fields.');
                }
                mapped.push(result.output);
            }
            value = mapped;
        }
        if (plan.operation === ListOperation.Group) {
            const groups: Map<string, ListGroup> = new Map();
            for (const row of original) {
                let key: WorkflowValue;
                try {
                    key = ListValues.key(row.item, plan.path);
                } catch (error: unknown) {
                    throw this.#error(row.index, error);
                }
                const identity: string = ListValues.identity(key);
                const group: ListGroup = groups.get(identity) ?? { key, items: [], indices: [] };
                group.items.push(row.item);
                group.indices.push(row.index);
                groups.set(identity, group);
            }
            value = [...groups.values()].map((group: ListGroup): WorkflowObject => ({
                key: group.key,
                items: group.items,
            }));
            indices = [...groups.values()].map(
                (group: ListGroup): readonly number[] => group.indices,
            );
        }
        if (plan.operation === ListOperation.Aggregate) {
            const values: readonly WorkflowValue[] = original.map((row: ListRow): WorkflowValue => {
                try {
                    return plan.aggregate === 'count'
                        ? row.item
                        : ListValues.key(row.item, plan.path);
                } catch (error: unknown) {
                    throw this.#error(row.index, error);
                }
            });
            value = ListAggregate.evaluate(values, plan.aggregate, plan.valueType);
            indices = [original.map((row: ListRow): number => row.index)];
        }
        const result: ListResult = {
            value,
            indices,
            inputCount: original.length.toString(),
            outputCount: indices.length.toString(),
        };
        this.#budget({ value: result.value, indices: result.indices });
        signal?.throwIfAborted();
        return result;
    }
    static #matches(item: WorkflowValue, plan: ListPlan): boolean {
        const read: MappingRead = ListValues.read(item, plan.path);
        if (read.redacted) {
            throw new Error('Secret fields cannot be filtered.');
        }
        if (plan.predicate === ListPredicate.Missing) {
            return read.missing;
        }
        if (plan.predicate === ListPredicate.Exists) {
            return !read.missing;
        }
        if (read.missing) {
            throw new Error('Selected field is missing. Use an Exists filter first.');
        }
        if (plan.predicate === ListPredicate.Null) {
            return read.value === null;
        }
        if (plan.predicate === ListPredicate.Equal) {
            return ListValues.identity(read.value) === ListValues.identity(plan.compare);
        }
        if (plan.predicate === ListPredicate.NotEqual) {
            return ListValues.identity(read.value) !== ListValues.identity(plan.compare);
        }
        if (plan.predicate === ListPredicate.Contains) {
            if (typeof read.value !== 'string' || typeof plan.compare !== 'string') {
                throw new Error('Contains requires text on both sides.');
            }
            return read.value.includes(plan.compare);
        }
        const order: number = ListValues.compare(read.value, plan.compare, plan.valueType);
        return plan.predicate === ListPredicate.Greater ? order > 0 : order < 0;
    }
    static #array(value: WorkflowValue): value is readonly WorkflowValue[] {
        return Array.isArray(value);
    }
    static #budget(value: WorkflowValue): void {
        if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 1_048_576) {
            throw new Error(
                'List data exceeds 1 MiB. Use a smaller collection or managed references.',
            );
        }
    }
    static #error(index: number, error: unknown): Error {
        return new Error(
            'Item ' +
                String(index) +
                ': ' +
                (error instanceof Error ? error.message : 'Invalid value.'),
            { cause: error },
        );
    }
}
