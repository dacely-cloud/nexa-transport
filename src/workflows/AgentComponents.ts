// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentRole,
    ComponentCategory,
    ComponentEffect,
    PortDirection,
    type ComponentDefinition,
    type ComponentResourceSlot,
    type ComponentPort,
} from './ComponentTypes.js';
import { ResourceFamily, ResourceUse } from './ResourceTypes.js';
import { ResourceComponents } from './ResourceComponents.js';
import { CoreComponents } from './CoreComponents.js';
import { ComponentFactory as Ports } from './ComponentFactory.js';
import { Schemas } from './Schemas.js';

/** Agent, prompt, persona and model roles are separately reusable configurations. */
export class AgentComponents {
    public static definitions(): readonly ComponentDefinition[] {
        const families: readonly ResourceFamily[] = Object.values(ResourceFamily).filter(
            (family: ResourceFamily): boolean => family !== ResourceFamily.Compute,
        );
        const external: readonly ComponentPort[] = families.map(
            (family: ResourceFamily): ComponentPort =>
                Ports.resource(
                    family,
                    ResourceComponents.names[family],
                    `external.${family}`,
                    PortDirection.Input,
                ),
        );
        const agent: ComponentDefinition = {
            id: 'agent.run',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Agents,
            display: {
                ...CoreComponents.display(
                    'Run Agent',
                    'Give a worker a task, scoped context and separate model roles.',
                    'Analyze monthly reports and create an image using a different model.',
                    ['agent', 'task', 'reasoning', 'multimodal'],
                    'agent',
                    ['task'],
                ),
                accent: 'violet',
                inspectorFields: [
                    'task',
                    'agentId',
                    'agentVersion',
                    'modelRoles',
                    'maxTurns',
                    'outputFormat',
                ],
            },
            configuration: Schemas.object([
                Schemas.field('task', { ...Schemas.text, minLength: 1 }, false),
                Schemas.field('agentId', { ...Schemas.text, nullable: true }),
                Schemas.field('agentVersion', { ...Schemas.text, nullable: true }),
                Schemas.field('modelRoles', Schemas.object([], true)),
                Schemas.field('maxTurns', {
                    ...Schemas.number,
                    whole: true,
                    minimum: 1,
                    maximum: 1_000,
                }),
                Schemas.field('outputFormat', Schemas.choice(['text', 'json'])),
            ]),
            defaults: {
                agentId: null,
                agentVersion: null,
                modelRoles: {},
                maxTurns: 12,
                outputFormat: 'text',
            },
            ports: [
                Ports.flow('in', PortDirection.Input),
                Ports.input('task', 'Task', { ...Schemas.text, minLength: 1 }, true, 'task'),
                Ports.resource('agent', 'Agent', 'agent', PortDirection.Input),
                {
                    ...Ports.resource('reasoning', 'Reasoning model', 'model', PortDirection.Input),
                    maxConnections: 1,
                    modelCapabilities: ['reasoning', 'text'],
                },
                {
                    ...Ports.resource('images', 'Image model', 'model', PortDirection.Input),
                    maxConnections: 1,
                    modelCapabilities: ['image'],
                },
                Ports.resource('persona', 'Personas', 'persona', PortDirection.Input),
                Ports.resource('prompt', 'Prompt', 'prompt', PortDirection.Input),
                ...external,
                Ports.flow('out', PortDirection.Output),
                Ports.output('text', 'Result text', Schemas.text),
                Ports.output('data', 'Structured result', Schemas.json),
                Ports.output('artifacts', 'Artifacts', Schemas.list(Schemas.file, 128)),
            ],
            resources: families.map((family: ResourceFamily): ComponentResourceSlot => ({
                family,
                uses: [ResourceUse.Attach],
            })),
            execution: {
                ...Ports.execution(ComponentEffect.Inference, ['agent.execute']),
                streaming: true,
            },
            resourceRole: null,
            migratesFrom: [],
        };
        const model: ComponentDefinition = {
            id: 'model.binding',
            version: '1',
            role: ComponentRole.Resource,
            category: ComponentCategory.Models,
            display: {
                ...CoreComponents.display(
                    'Model',
                    'Bind an exact model or an explicit provider/capability policy.',
                    'Use a reasoning model and a separate image generation model.',
                    ['model', 'provider', 'images', 'audio'],
                    'model',
                    ['provider', 'capability', 'selection'],
                ),
                inspectorFields: ['provider', 'capability', 'selection', 'modelId', 'options'],
            },
            configuration: Schemas.object([
                Schemas.field('provider', { ...Schemas.text, nullable: true }),
                Schemas.field(
                    'capability',
                    Schemas.choice([
                        'reasoning',
                        'text',
                        'image',
                        'audio',
                        'transcription',
                        'speech',
                        'embedding',
                        'video',
                    ]),
                ),
                Schemas.field('selection', Schemas.choice(['exact', 'latest-compatible'])),
                Schemas.field('modelId', { ...Schemas.text, nullable: true }),
                Schemas.field('options', Schemas.object([], true)),
            ]),
            defaults: {
                provider: null,
                capability: 'reasoning',
                selection: 'exact',
                modelId: null,
                options: {},
            },
            ports: [Ports.resource('model', 'Model configuration', 'model', PortDirection.Output)],
            resources: [],
            execution: null,
            resourceRole: 'model',
            migratesFrom: [],
        };
        const persona: ComponentDefinition = {
            id: 'persona.instructions',
            version: '1',
            role: ComponentRole.Resource,
            category: ComponentCategory.Personas,
            display: CoreComponents.display(
                'Persona',
                'Provide instructions and tone without granting tools or permissions.',
                'Attach an editor persona to a writing agent.',
                ['expert', 'persona', 'tone'],
                'persona',
                ['purpose'],
            ),
            configuration: Schemas.object([
                Schemas.field('purpose', Schemas.text),
                Schemas.field('instructions', Schemas.text),
                Schemas.field('priority', {
                    ...Schemas.number,
                    whole: true,
                    minimum: 0,
                    maximum: 100,
                }),
            ]),
            defaults: { purpose: '', instructions: '', priority: 0 },
            ports: [Ports.resource('persona', 'Persona', 'persona', PortDirection.Output)],
            resources: [],
            execution: null,
            resourceRole: 'persona',
            migratesFrom: [],
        };
        const prompt: ComponentDefinition = {
            id: 'prompt.template',
            version: '1',
            role: ComponentRole.Resource,
            category: ComponentCategory.Prompts,
            display: CoreComponents.display(
                'Prompt',
                'Reuse task instructions without scheduling an inference call.',
                'Keep a reusable document extraction prompt.',
                ['prompt', 'template', 'instructions'],
                'prompt',
                ['text'],
            ),
            configuration: Schemas.object([Schemas.field('text', Schemas.text)]),
            defaults: { text: '' },
            ports: [Ports.resource('prompt', 'Prompt template', 'prompt', PortDirection.Output)],
            resources: [],
            execution: null,
            resourceRole: 'prompt',
            migratesFrom: [],
        };
        const reference: ComponentDefinition = {
            id: 'agent.reference',
            version: '1',
            role: ComponentRole.Resource,
            category: ComponentCategory.Agents,
            display: CoreComponents.display(
                'Agent definition',
                'Reference a shared worker at an explicit version.',
                'Reuse a research worker without sharing its conversation history.',
                ['agent', 'worker', 'shared'],
                'agent-resource',
                ['agentId', 'version'],
            ),
            configuration: Schemas.object([
                Schemas.field('agentId', { ...Schemas.text, nullable: true }),
                Schemas.field('version', { ...Schemas.text, nullable: true }),
            ]),
            defaults: { agentId: null, version: null },
            ports: [Ports.resource('agent', 'Agent definition', 'agent', PortDirection.Output)],
            resources: [],
            execution: null,
            resourceRole: 'agent',
            migratesFrom: [],
        };
        return [agent, model, persona, prompt, reference];
    }
}
