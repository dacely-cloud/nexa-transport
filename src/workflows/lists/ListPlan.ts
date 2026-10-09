// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { SchemaProblem } from '../SchemaTypes.js';
import { ListValues } from './ListValues.js';
import { SchemaValues } from '../SchemaValues.js';
import { Schemas } from '../Schemas.js';
import type { ObjectSchema } from '../SchemaTypes.js';
import { WorkflowJson } from '../WorkflowJson.js';
import type { WorkflowObject, WorkflowValue } from '../WorkflowTypes.js';
import { MappingCodec } from '../mapping/MappingCodec.js';
import { MappingPaths } from '../mapping/MappingPaths.js';
import { MappingValidation } from '../mapping/MappingValidation.js';
import { MappingType, type MappingPlan } from '../mapping/MappingTypes.js';
import {
    ListOperation,
    ListPredicate,
    ListValueType,
    ListAggregateKind,
    type ListPlan,
} from './ListTypes.js';

/** One contract validates editor settings, planning and worker configuration. */
export class ListPlans {
    /** Collection literals are optional alternatives to connected data. */
    public static readonly schema: ObjectSchema = Schemas.object([
        Schemas.field('operation', Schemas.choice(Object.values(ListOperation))),
        Schemas.field('path', { ...Schemas.text, maxLength: 300 }),
        Schemas.field('predicate', Schemas.choice(Object.values(ListPredicate))),
        Schemas.field('compare', Schemas.json),
        Schemas.field('valueType', Schemas.choice(Object.values(ListValueType))),
        Schemas.field('descending', Schemas.boolean),
        Schemas.field('offset', { ...Schemas.number, whole: true, minimum: 0, maximum: 1000 }),
        Schemas.field('limit', { ...Schemas.number, whole: true, minimum: 0, maximum: 1000 }),
        Schemas.field('aggregate', Schemas.choice(Object.values(ListAggregateKind))),
        Schemas.field('mapping_plan', MappingCodec.schema),
        Schemas.field('items', Schemas.list(Schemas.json, 1000), false),
        Schemas.field('context', Schemas.json, false),
    ]);
    /** A map initially wraps each original item without inventing fields. */
    public static initial(): WorkflowObject {
        const mapping: MappingPlan = {
            ...MappingCodec.initial(),
            fields: [
                {
                    ...MappingCodec.field('item', '/value'),
                    type: MappingType.Json,
                    nullable: true,
                    reference: { slot: 'source', path: '/item' },
                },
            ],
        };
        return {
            operation: ListOperation.Limit,
            path: '',
            predicate: ListPredicate.Equal,
            compare: null,
            valueType: ListValueType.Text,
            descending: false,
            offset: 0,
            limit: 10,
            aggregate: ListAggregateKind.Count,
            mapping_plan: MappingCodec.encode(mapping),
        };
    }
    /** Static validation occurs even for empty collections, never only after processing a row. */
    public static parse(raw: unknown, context: boolean = false): ListPlan {
        const problem: SchemaProblem | undefined = SchemaValues.inspect(this.schema, raw)[0];
        if (problem !== undefined) {
            throw new Error('List settings: ' + problem.path + ' ' + problem.message);
        }
        const value: WorkflowObject = WorkflowJson.object(raw);
        const operation: ListOperation | undefined = Object.values(ListOperation).find(
            (entry: ListOperation): boolean => entry === value['operation'],
        );
        const predicate: ListPredicate | undefined = Object.values(ListPredicate).find(
            (entry: ListPredicate): boolean => entry === value['predicate'],
        );
        const valueType: ListValueType | undefined = Object.values(ListValueType).find(
            (entry: ListValueType): boolean => entry === value['valueType'],
        );
        const aggregate: ListAggregateKind | undefined = Object.values(ListAggregateKind).find(
            (entry: ListAggregateKind): boolean => entry === value['aggregate'],
        );
        const path: WorkflowValue | undefined = value['path'];
        const offset: WorkflowValue | undefined = value['offset'];
        const limit: WorkflowValue | undefined = value['limit'];
        if (
            operation === undefined ||
            predicate === undefined ||
            valueType === undefined ||
            aggregate === undefined ||
            typeof path !== 'string' ||
            typeof offset !== 'number' ||
            typeof limit !== 'number'
        ) {
            throw new Error('Invalid list settings.');
        }
        if (
            path !== '' &&
            MappingPaths.segments(path).some((key: string): boolean => MappingPaths.secret(key))
        ) {
            throw new Error('Secret fields cannot be used as list keys.');
        }
        if (
            operation === ListOperation.Aggregate &&
            aggregate !== ListAggregateKind.Count &&
            ![ListValueType.Integer, ListValueType.Number].some(
                (entry: ListValueType): boolean => entry === valueType,
            )
        ) {
            throw new Error('Totals require Number or Integer values.');
        }
        if (operation === ListOperation.Filter) {
            if (predicate === ListPredicate.Contains && typeof value['compare'] !== 'string') {
                throw new Error('Contains requires a text comparison value.');
            }
            if (predicate === ListPredicate.Greater || predicate === ListPredicate.Less) {
                ListValues.comparable(value['compare'] ?? null, valueType);
            }
        }
        return {
            operation,
            path,
            predicate,
            compare: value['compare'] ?? null,
            valueType,
            descending: value['descending'] === true,
            offset,
            limit,
            aggregate,
            mapping:
                operation === ListOperation.Map
                    ? MappingValidation.parse(
                          value['mapping_plan'],
                          new Set(context ? ['source', 'context'] : ['source']),
                      )
                    : null,
        };
    }
}
