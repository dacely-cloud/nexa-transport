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

/** Direct model operations do not create agents, grant tools, or share conversation memory. */
export class InferenceComponents {
    /** Versioned text generation with an explicit reusable model binding and offline fixture. */
    public static definitions(): readonly ComponentDefinition[] {
        return [
            {
                id: 'inference.text',
                version: '1',
                role: ComponentRole.Step,
                category: ComponentCategory.Models,
                display: {
                    ...CoreComponents.display(
                        'Generate text',
                        'Ask the connected model for one text result.',
                        'Summarize a document or write a first draft.',
                        ['inference', 'text', 'model', 'prompt'],
                        'model',
                        ['prompt'],
                    ),
                    inspectorFields: ['prompt', 'instructions', 'maxOutputTokens', 'mockOutput'],
                },
                configuration: Schemas.object([
                    Schemas.field(
                        'prompt',
                        { ...Schemas.text, minLength: 1, maxLength: 64000 },
                        false,
                    ),
                    Schemas.field('instructions', { ...Schemas.text, maxLength: 16000 }),
                    Schemas.field('maxOutputTokens', {
                        ...Schemas.number,
                        whole: true,
                        minimum: 1,
                        maximum: 32768,
                    }),
                    Schemas.field('mockOutput', {
                        ...Schemas.text,
                        nullable: true,
                        maxLength: 128000,
                    }),
                ]),
                defaults: { instructions: '', maxOutputTokens: 2048, mockOutput: null },
                ports: [
                    Ports.flow('in', PortDirection.Input),
                    Ports.input(
                        'prompt',
                        'Prompt',
                        { ...Schemas.text, minLength: 1, maxLength: 64000 },
                        true,
                        'prompt',
                    ),
                    {
                        ...Ports.resource(
                            'model',
                            'Text model',
                            'model',
                            PortDirection.Input,
                            true,
                        ),
                        maxConnections: 1,
                        modelCapabilities: ['text', 'reasoning'],
                    },
                    Ports.flow('out', PortDirection.Output),
                    Ports.output('text', 'Result text', { ...Schemas.text, maxLength: 128000 }),
                    Ports.output('usage', 'Model and usage', Schemas.object([], true)),
                ],
                resources: [],
                execution: {
                    ...Ports.execution(ComponentEffect.Inference, ['inference.text']),
                    handler: 'inference.text@1',
                },
                resourceRole: null,
                migratesFrom: [],
            },
        ];
    }
}
