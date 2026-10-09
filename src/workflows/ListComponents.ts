// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentCategory,
    ComponentEffect,
    ComponentRole,
    PortDirection,
    type ComponentDefinition,
} from './ComponentTypes.js';
import { ComponentFactory } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { Schemas } from './Schemas.js';
import { ListPlans } from './lists/ListPlan.js';

/** One list family covers deterministic collection processing without unnecessary graph cards. */
export class ListComponents {
    /** Item cardinality carries one complete bounded array; this is not a per-item event stream. */
    public static definition(): ComponentDefinition {
        return {
            id: 'data.list',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Transform,
            display: CoreComponents.display(
                'Process list',
                'Filter, sort, group, map, deduplicate, limit or total a bounded collection.',
                'Prepare a collection for an agent or report.',
                ['list', 'filter', 'sort', 'group', 'unique', 'map', 'limit', 'sum', 'count'],
                'text',
                [],
            ),
            configuration: ListPlans.schema,
            defaults: ListPlans.initial(),
            ports: [
                ComponentFactory.flow('in', PortDirection.Input),
                ComponentFactory.input('items', 'Collection', Schemas.json, true, 'items'),
                ComponentFactory.input('context', 'Context', Schemas.json, false, 'context'),
                ComponentFactory.flow('out', PortDirection.Output),
                ComponentFactory.output('value', 'Processed value', Schemas.json),
                ComponentFactory.output(
                    'indices',
                    'Original item indexes',
                    Schemas.list(
                        Schemas.list(
                            { ...Schemas.number, whole: true, minimum: 0, maximum: 999 },
                            1000,
                        ),
                        1000,
                    ),
                ),
                ComponentFactory.output('inputCount', 'Input count', Schemas.count),
                ComponentFactory.output('outputCount', 'Output count', Schemas.count),
            ],
            resources: [],
            resourceRole: null,
            execution: ComponentFactory.execution(ComponentEffect.Pure),
            migratesFrom: [],
        };
    }
}
