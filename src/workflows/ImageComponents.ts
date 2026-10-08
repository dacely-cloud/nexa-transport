// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentRole,
    ComponentCategory,
    ComponentEffect,
    PortDirection,
    type ComponentDefinition,
} from './ComponentTypes.js';
import { ComponentFactory as Ports } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { Schemas } from './Schemas.js';

/** Direct image generation has its own model binding and returns managed file references. */
export class ImageComponents {
    /** A bounded generation operation, independent from the text model that wrote its prompt. */
    public static definitions(): readonly ComponentDefinition[] {
        const original: ComponentDefinition = {
            id: 'inference.image',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Models,
            display: {
                ...CoreComponents.display(
                    'Generate images',
                    'Create images with the connected image model.',
                    'Turn a written brief into illustrations.',
                    ['image', 'generation', 'illustration', 'model'],
                    'model',
                    ['size', 'count'],
                ),
                inspectorFields: [
                    'prompt',
                    'size',
                    'quality',
                    'count',
                    'outputFormat',
                    'mockImages',
                ],
            },
            configuration: Schemas.object([
                Schemas.field('prompt', { ...Schemas.text, maxLength: 128000 }, false),
                Schemas.field('size', { ...Schemas.text, minLength: 1, maxLength: 32 }),
                Schemas.field(
                    'quality',
                    Schemas.choice(['low', 'medium', 'high', 'xhigh', 'max', 'auto']),
                ),
                Schemas.field('count', {
                    ...Schemas.number,
                    whole: true,
                    minimum: 1,
                    maximum: 10,
                }),
                Schemas.field('outputFormat', Schemas.choice(['png', 'jpeg', 'webp'])),
                Schemas.field('mockImages', Schemas.list(Schemas.file, 10)),
            ]),
            defaults: {
                size: '1024x1024',
                quality: 'auto',
                count: 1,
                outputFormat: 'png',
                mockImages: [],
            },
            ports: [
                Ports.flow('in', PortDirection.Input),
                Ports.input('prompt', 'Image prompt', Schemas.text, true, 'prompt'),
                {
                    ...Ports.resource('model', 'Image model', 'model', PortDirection.Input, true),
                    maxConnections: 1,
                    modelCapabilities: ['image'],
                },
                Ports.flow('out', PortDirection.Output),
                Ports.output('images', 'Images', Schemas.list(Schemas.file, 10)),
                Ports.output('usage', 'Model and usage', Schemas.object([], true)),
            ],
            resources: [],
            execution: {
                ...Ports.execution(ComponentEffect.Inference, ['inference.image']),
                handler: 'inference.image@1',
            },
            resourceRole: null,
            migratesFrom: [],
        };
        const current: ComponentDefinition = {
            ...original,
            version: '2',
            display: {
                ...original.display,
                title: 'Create or edit images',
                description:
                    'Generate images or edit connected reference images with an image model.',
                inspectorFields: [
                    'operation',
                    ...original.display.inspectorFields,
                    'referenceImages',
                ],
            },
            configuration: Schemas.object([
                ...original.configuration.fields,
                Schemas.field('operation', Schemas.choice(['generate', 'edit'])),
                Schemas.field('referenceImages', Schemas.list(Schemas.file, 16), false),
            ]),
            defaults: { ...original.defaults, operation: 'generate' },
            ports: [
                ...original.ports,
                Ports.input(
                    'referenceImages',
                    'Reference images',
                    Schemas.list(Schemas.file, 16),
                    false,
                    'referenceImages',
                ),
            ],
            execution: {
                ...Ports.execution(ComponentEffect.Inference, ['inference.image']),
                handler: 'inference.image@2',
            },
            migratesFrom: [],
        };
        return [original, current];
    }
}
