// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentRole,
    ComponentCategory,
    ComponentEffect,
    PortDirection,
    IncomingPolicy,
    type ComponentDefinition,
    type ComponentDisplay,
} from './ComponentTypes.js';
import { ComponentFactory as Ports } from './ComponentFactory.js';
import { WorkflowOutputView } from './runtime/RunTypes.js';
import { Schemas } from './Schemas.js';
import type { WorkflowObject } from './WorkflowTypes.js';
import type { ObjectSchema } from './SchemaTypes.js';

/** Concrete authoring contracts for the first deterministic and organizing families. */
export class CoreComponents {
    /** Conditions accept selected JSON; runtime validation requires a boolean without coercion. */
    public static definitions(): readonly ComponentDefinition[] {
        const manual: ComponentDefinition = {
            id: 'trigger.manual',
            version: '1',
            role: ComponentRole.Trigger,
            category: ComponentCategory.Triggers,
            display: this.display(
                'Manual start',
                'Start one run with explicit input data.',
                'Start a personal study session.',
                ['start', 'input', 'manual'],
                'trigger',
                ['description'],
            ),
            configuration: Schemas.object([Schemas.field('description', Schemas.text, false)]),
            defaults: { description: '' },
            ports: [
                Ports.flow('started', PortDirection.Output, 'Started'),
                Ports.output('input', 'Submitted input', Schemas.object([], true)),
            ],
            resources: [],
            execution: Ports.execution(ComponentEffect.Pure),
            resourceRole: null,
            migratesFrom: [],
        };
        const template: ComponentDefinition = {
            id: 'text.template',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Transform,
            display: this.display(
                'Text template',
                'Fill a text template from named input values.',
                'Write a greeting using the submitted name.',
                ['text', 'prompt', 'format'],
                'text',
                ['template'],
            ),
            configuration: Schemas.object([
                Schemas.field('template', Schemas.text),
                Schemas.field('values', Schemas.object([], true), false),
            ]),
            defaults: { template: 'Hello' },
            ports: [
                Ports.flow('in', PortDirection.Input),
                Ports.input('values', 'Template values', Schemas.object([], true), false, 'values'),
                Ports.flow('out', PortDirection.Output),
                Ports.output('text', 'Filled text', Schemas.text),
            ],
            resources: [],
            execution: Ports.execution(ComponentEffect.Pure),
            resourceRole: null,
            migratesFrom: [],
        };
        const condition: ComponentDefinition = {
            id: 'logic.condition',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Conditions,
            display: this.display(
                'Condition',
                'Validate a JSON boolean and route it. Other values fail instead of becoming false.',
                'Continue only when the answer passes a check.',
                ['if', 'branch', 'boolean'],
                'condition',
                ['condition'],
            ),
            configuration: Schemas.object([Schemas.field('condition', Schemas.boolean, false)]),
            defaults: {},
            ports: [
                Ports.flow('in', PortDirection.Input),
                Ports.input('condition', 'Condition', Schemas.json, true, 'condition'),
                Ports.flow('matched', PortDirection.Output, 'Matched'),
                Ports.flow('not-matched', PortDirection.Output, 'Not matched'),
            ],
            resources: [],
            execution: Ports.execution(ComponentEffect.Pure),
            resourceRole: null,
            migratesFrom: [],
        };
        const join: ComponentDefinition = {
            id: 'flow.join',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Flow,
            display: this.display(
                'Join branches',
                'Wait according to an explicit branch completion rule.',
                'Combine independent research branches.',
                ['parallel', 'join', 'collect'],
                'join',
                ['mode'],
            ),
            configuration: Schemas.object([
                Schemas.field(
                    'mode',
                    Schemas.choice([
                        'all-applicable',
                        'first-success',
                        'required-count',
                        'time-window',
                    ]),
                ),
                Schemas.field(
                    'requiredCount',
                    { ...Schemas.number, whole: true, minimum: 1, maximum: 1_000 },
                    false,
                ),
                Schemas.field('windowMs', Schemas.count, false),
            ]),
            defaults: { mode: 'all-applicable' },
            ports: [
                {
                    ...Ports.flow('in', PortDirection.Input),
                    maxConnections: 1_000,
                    incoming: IncomingPolicy.Join,
                },
                Ports.flow('out', PortDirection.Output),
            ],
            resources: [],
            execution: Ports.execution(ComponentEffect.Wait),
            resourceRole: null,
            migratesFrom: [],
        };
        const output: ComponentDefinition = {
            id: 'output.return',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Output,
            display: this.display(
                'Return result',
                'Expose a named completed value in run mode.',
                'Return a study guide or generated report.',
                ['output', 'result', 'return'],
                'output',
                ['name', 'view'],
            ),
            configuration: Schemas.object([
                Schemas.field('name', { ...Schemas.text, minLength: 1, maxLength: 160 }),
                Schemas.field(
                    'view',
                    { ...Schemas.text, choices: Object.values(WorkflowOutputView) },
                    false,
                ),
                Schemas.field('value', Schemas.json, false),
            ]),
            defaults: { name: 'Result' },
            ports: [
                Ports.flow('in', PortDirection.Input),
                Ports.input('value', 'Result', Schemas.json, true, 'value'),
            ],
            resources: [],
            execution: Ports.execution(ComponentEffect.Pure),
            resourceRole: null,
            migratesFrom: [],
        };
        return [
            manual,
            template,
            condition,
            join,
            output,
            this.#visual(
                'visual.note',
                'Note',
                'Keep an explanation beside the workflow.',
                { text: '' },
                Schemas.object([Schemas.field('text', Schemas.text)]),
                'note',
            ),
            this.#visual(
                'visual.frame',
                'Frame',
                'Organize a section without adding execution dependencies.',
                { title: 'Section', collapsed: false },
                Schemas.object([
                    Schemas.field('title', Schemas.text),
                    Schemas.field('collapsed', Schemas.boolean),
                ]),
                'frame',
            ),
        ];
    }
    public static display(
        title: string,
        description: string,
        example: string,
        tags: readonly string[],
        card: string,
        fields: readonly string[],
    ): ComponentDisplay {
        return {
            title,
            description,
            example,
            tags,
            card,
            accent: 'neutral',
            compactFields: fields,
            inspectorFields: fields,
        };
    }
    static #visual(
        id: string,
        title: string,
        description: string,
        defaults: WorkflowObject,
        configuration: ObjectSchema,
        card: string,
    ): ComponentDefinition {
        return {
            id,
            version: '1',
            role: ComponentRole.Visual,
            category: ComponentCategory.Utilities,
            display: this.display(
                title,
                description,
                'Explain the purpose of this section.',
                ['organize', card],
                card,
                Object.keys(defaults),
            ),
            configuration,
            defaults,
            ports: [],
            resources: [],
            execution: null,
            resourceRole: null,
            migratesFrom: [],
        };
    }
}
