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

/** Stateful sequential repetition with an explicit checked stopping boundary. */
export class RepeatComponents {
    /** The first pass always runs; subsequent passes receive the prior boundary value. */
    public static definitions(): readonly ComponentDefinition[] {
        return [
            {
                id: 'flow.repeat',
                version: '1',
                role: ComponentRole.Step,
                category: ComponentCategory.Flow,
                display: CoreComponents.display(
                    'Repeat until',
                    'Repeat connected steps until their result says to stop.',
                    'Revise a draft until its review passes.',
                    ['loop', 'repeat', 'until', 'state'],
                    'flow',
                    ['maxIterations', 'collection'],
                ),
                configuration: Schemas.object([
                    Schemas.field('initial', Schemas.json, false),
                    Schemas.field('context', Schemas.json, false),
                    Schemas.field('maxIterations', {
                        ...Schemas.number,
                        whole: true,
                        minimum: 1,
                        maximum: 1000,
                    }),
                    Schemas.field('creditLimitMicrocents', Schemas.count, false),
                    Schemas.field('timeoutMs', { ...Schemas.count, minimum: 1, maximum: 86400000 }),
                    Schemas.field('collection', Schemas.choice(['all', 'last'])),
                ]),
                defaults: { maxIterations: 10, timeoutMs: '300000', collection: 'all' },
                ports: [
                    Ports.flow('in', PortDirection.Input),
                    Ports.input('initial', 'Starting state', Schemas.json, true, 'initial'),
                    Ports.input('context', 'Context', Schemas.json, false, 'context'),
                    Ports.flow('body', PortDirection.Output, 'Each pass'),
                    Ports.output('state', 'Current state', Schemas.json),
                    Ports.output('index', 'Pass index', Schemas.count),
                    Ports.output('shared', 'Shared context', Schemas.json),
                    Ports.flow('out', PortDirection.Output, 'Finished'),
                    Ports.output('value', 'Final state', Schemas.json),
                    Ports.output('results', 'Pass results', Schemas.json),
                    Ports.output('count', 'Pass count', Schemas.count),
                ],
                resources: [],
                execution: Ports.execution(ComponentEffect.Wait),
                resourceRole: null,
                migratesFrom: [],
            },
            {
                id: 'flow.repeat-result',
                version: '1',
                role: ComponentRole.Step,
                category: ComponentCategory.Flow,
                display: CoreComponents.display(
                    'Check repeat result',
                    'Supply the next state and decide whether this loop is finished.',
                    'Pass the revised draft and its approval result.',
                    ['repeat', 'until', 'stop', 'state'],
                    'flow',
                    ['loop'],
                ),
                configuration: Schemas.object([
                    Schemas.field('loop', Schemas.text),
                    Schemas.field('value', Schemas.json, false),
                    Schemas.field('done', Schemas.boolean, false),
                ]),
                defaults: { loop: '' },
                ports: [
                    Ports.flow('in', PortDirection.Input),
                    Ports.input('value', 'Next state', Schemas.json, true, 'value'),
                    Ports.input('done', 'Finished?', Schemas.boolean, true, 'done'),
                    Ports.output('result', 'Checked state', Schemas.json),
                    Ports.output('finished', 'Finished', Schemas.boolean),
                ],
                resources: [],
                execution: Ports.execution(ComponentEffect.Pure),
                resourceRole: null,
                migratesFrom: [],
            },
        ];
    }
}
