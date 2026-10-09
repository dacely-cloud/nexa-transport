// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentCategory,
    ComponentEffect,
    ComponentRole,
    PortDirection,
    type ComponentDefinition,
    type ComponentPort,
} from './ComponentTypes.js';
import { ComponentFactory } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { Schemas } from './Schemas.js';
import type { ObjectSchema } from './SchemaTypes.js';
import type { WorkflowObject } from './WorkflowTypes.js';

interface DataComponentSeed {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly configuration: ObjectSchema;
    readonly defaults: WorkflowObject;
    readonly inputs: readonly ComponentPort[];
    readonly output: ComponentPort;
}

/** Bounded data transformations have the same executable contract in the catalog and worker. */
export class DataComponents {
    public static definitions(): readonly ComponentDefinition[] {
        const seeds: readonly DataComponentSeed[] = [
            {
                id: 'data.parse-json',
                title: 'Parse JSON',
                description:
                    'Turn JSON text into structured data. Invalid JSON fails with an error.',
                configuration: Schemas.object([Schemas.field('text', Schemas.text, false)]),
                defaults: {},
                inputs: [ComponentFactory.input('text', 'JSON text', Schemas.text, true, 'text')],
                output: ComponentFactory.output('value', 'Data', Schemas.json),
            },
            {
                id: 'data.stringify-json',
                title: 'JSON to text',
                description: 'Format structured data as JSON text for a prompt or result.',
                configuration: Schemas.object([Schemas.field('value', Schemas.json, false)]),
                defaults: {},
                inputs: [ComponentFactory.input('value', 'Data', Schemas.json, true, 'value')],
                output: ComponentFactory.output('text', 'JSON text', Schemas.text),
            },
            {
                id: 'data.pick',
                title: 'Pick field',
                description:
                    'Read an object field or array item using a JSON Pointer such as /invoice/total.',
                configuration: Schemas.object([
                    Schemas.field('value', Schemas.json, false),
                    Schemas.field('path', { ...Schemas.text, maxLength: 2048 }),
                ]),
                defaults: { path: '' },
                inputs: [ComponentFactory.input('data', 'Data', Schemas.json, true, 'value')],
                output: ComponentFactory.output('value', 'Value', Schemas.json),
            },
            {
                id: 'data.merge',
                title: 'Merge objects',
                description: 'Combine two objects with an explicit rule for duplicate fields.',
                configuration: Schemas.object([
                    Schemas.field('left', Schemas.object([], true), false),
                    Schemas.field('right', Schemas.object([], true), false),
                    Schemas.field('conflicts', Schemas.choice(['reject', 'left', 'right'])),
                ]),
                defaults: { conflicts: 'reject' },
                inputs: [
                    ComponentFactory.input('left', 'First object', Schemas.json, true, 'left'),
                    ComponentFactory.input('right', 'Second object', Schemas.json, true, 'right'),
                ],
                output: ComponentFactory.output('value', 'Merged object', Schemas.object([], true)),
            },
        ];
        return seeds.map((seed: DataComponentSeed): ComponentDefinition => ({
            id: seed.id,
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Transform,
            display: CoreComponents.display(
                seed.title,
                seed.description,
                seed.description,
                ['data', 'json', 'transform'],
                'text',
                [],
            ),
            configuration: seed.configuration,
            defaults: seed.defaults,
            ports: [
                ComponentFactory.flow('in', PortDirection.Input),
                ...seed.inputs,
                ComponentFactory.flow('out', PortDirection.Output),
                seed.output,
            ],
            resources: [],
            resourceRole: null,
            migratesFrom: [],
            execution: ComponentFactory.execution(ComponentEffect.Pure),
        }));
    }
}
