// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentCategory,
    ComponentEffect,
    ComponentRole,
    PortDirection,
    type ComponentDefinition,
} from './ComponentTypes.js';
import { ComponentFactory as Ports } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { Schemas } from './Schemas.js';

/** Explicit collection iteration and its matching result boundary. */
export class EachComponents {
    /** Body ports activate per item; the completed port activates once after collection. */
    public static definitions(): readonly ComponentDefinition[] {
        return [
            {
                id: 'flow.each',
                version: '1',
                role: ComponentRole.Step,
                category: ComponentCategory.Flow,
                display: CoreComponents.display(
                    'For each item',
                    'Run connected steps for each item in a collection.',
                    'Research each site, then collect the reports.',
                    ['loop', 'repeat', 'foreach', 'collection'],
                    'flow',
                    ['concurrency', 'maxItems', 'onError'],
                ),
                configuration: Schemas.object([
                    Schemas.field('items', Schemas.json, false),
                    Schemas.field('context', Schemas.json, false),
                    Schemas.field('maxItems', {
                        ...Schemas.number,
                        whole: true,
                        minimum: 1,
                        maximum: 1000,
                    }),
                    Schemas.field('concurrency', {
                        ...Schemas.number,
                        whole: true,
                        minimum: 1,
                        maximum: 32,
                    }),
                    Schemas.field('creditLimitMicrocents', Schemas.count, false),
                    Schemas.field('timeoutMs', { ...Schemas.count, minimum: 1, maximum: 86400000 }),
                    Schemas.field('onError', Schemas.choice(['stop', 'continue'])),
                    Schemas.field('order', Schemas.choice(['input', 'completion'])),
                ]),
                defaults: {
                    maxItems: 100,
                    concurrency: 1,
                    timeoutMs: '300000',
                    onError: 'stop',
                    order: 'input',
                },
                ports: [
                    Ports.flow('in', PortDirection.Input),
                    Ports.input('items', 'Collection', Schemas.json, true, 'items'),
                    Ports.input('context', 'Context', Schemas.json, false, 'context'),
                    Ports.flow('body', PortDirection.Output, 'For each item'),
                    Ports.output('item', 'Current item', Schemas.json),
                    Ports.output('index', 'Item index', Schemas.count),
                    Ports.output('shared', 'Shared context', Schemas.json),
                    Ports.flow('out', PortDirection.Output, 'All items finished'),
                    Ports.output('results', 'Item results', Schemas.json),
                    Ports.output('count', 'Item count', Schemas.count),
                ],
                resources: [],
                execution: Ports.execution(ComponentEffect.Wait),
                resourceRole: null,
                migratesFrom: [],
            },
            {
                id: 'flow.each-result',
                version: '1',
                role: ComponentRole.Step,
                category: ComponentCategory.Flow,
                display: CoreComponents.display(
                    'Collect item result',
                    'Finish one item and pass its result back to For each item.',
                    'Collect one report for this site.',
                    ['loop', 'collect', 'return', 'item'],
                    'flow',
                    ['loop'],
                ),
                configuration: Schemas.object([
                    Schemas.field('loop', Schemas.text),
                    Schemas.field('value', Schemas.json, false),
                ]),
                defaults: { loop: '' },
                ports: [
                    Ports.flow('in', PortDirection.Input),
                    Ports.input('value', 'Item result', Schemas.json, true, 'value'),
                    Ports.output('result', 'Collected result', Schemas.json),
                ],
                resources: [],
                execution: Ports.execution(ComponentEffect.Pure),
                resourceRole: null,
                migratesFrom: [],
            },
        ];
    }
}
