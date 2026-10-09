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
import { WorkflowInput } from './WorkflowInput.js';
import {
    WorkflowApplications,
    type WorkflowApplicationDefinition,
} from './terminal/Applications.js';

/** Interactive applications execute in the owner's VM; Nexa operates their real terminal UI. */
export class TerminalComponents {
    public static definitions(): readonly ComponentDefinition[] {
        return WorkflowApplications.all.map(
            (app: WorkflowApplicationDefinition): ComponentDefinition => ({
                id: `terminal.${app.id}`,
                version: '1',
                role: ComponentRole.Step,
                category: ComponentCategory.Agents,
                display: {
                    ...CoreComponents.display(
                        app.title,
                        `Let Nexa operate ${app.title} in your VM. Sign in through Applications setup first.`,
                        'Implement and verify a task in your workspace.',
                        ['terminal', 'coding', app.id],
                        'terminal',
                        ['task'],
                    ),
                    inspectorFields: ['task', 'maxTurns'],
                },
                configuration: Schemas.object([
                    Schemas.field(
                        'task',
                        { ...Schemas.text, minLength: 1, maxLength: WorkflowInput.taskCharacters },
                        false,
                    ),
                    Schemas.field('maxTurns', {
                        ...Schemas.number,
                        whole: true,
                        minimum: 1,
                        maximum: 1000,
                    }),
                ]),
                defaults: { maxTurns: 30 },
                ports: [
                    Ports.flow('in', PortDirection.Input),
                    Ports.input('task', 'Task', Schemas.text, true, 'task'),
                    Ports.input('context', 'Context', Schemas.json, false),
                    Ports.flow('out', PortDirection.Output),
                    Ports.output('text', 'Result', Schemas.text),
                ],
                resources: [],
                execution: {
                    ...Ports.execution(ComponentEffect.External, ['terminal.execute']),
                    timeoutMs: '86400000',
                    streaming: true,
                },
                resourceRole: null,
                migratesFrom: [],
            }),
        );
    }
}
