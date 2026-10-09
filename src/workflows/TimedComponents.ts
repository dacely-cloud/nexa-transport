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
import { WorkflowTimedTrigger } from './TimedTrigger.js';

/** One typed event component feeds the existing durable publication/schedule/run path. */
export class TimedComponents {
    public static definition(): ComponentDefinition {
        return {
            id: WorkflowTimedTrigger.component,
            version: '1',
            role: ComponentRole.Trigger,
            category: ComponentCategory.Triggers,
            display: CoreComponents.display(
                'Timed Event',
                'Start on a reviewed schedule. Saving or publishing does not activate it.',
                'Every hour, collect updates and prepare a report.',
                ['start', 'timer', 'schedule', 'weekdays', 'calendar'],
                'clock',
                ['schedule'],
            ),
            configuration: Schemas.object([
                Schemas.field(
                    'schedule',
                    Schemas.object([
                        Schemas.field('timing', Schemas.object([], true)),
                        Schemas.field('missed', Schemas.choice(['skip', 'latest', 'catch-up'])),
                        Schemas.field('catchUpLimit', {
                            ...Schemas.number,
                            whole: true,
                            minimum: 1,
                            maximum: 20,
                        }),
                        Schemas.field('lateGraceMs', Schemas.count),
                        Schemas.field('maxConcurrentRuns', {
                            ...Schemas.number,
                            whole: true,
                            minimum: 1,
                            maximum: 32,
                        }),
                    ]),
                ),
            ]),
            defaults: WorkflowTimedTrigger.configuration({
                timing: { kind: 'interval', startAtMs: '0', endAtMs: null, intervalMs: '3600000' },
                missed: 'skip',
                catchUpLimit: 1,
                lateGraceMs: '60000',
                maxConcurrentRuns: 1,
            }),
            ports: [
                Ports.flow('started', PortDirection.Output, 'Started'),
                Ports.output('input', 'Submitted input', Schemas.object([], true)),
                Ports.output(
                    'event',
                    'Timing event',
                    Schemas.object([
                        Schemas.field('kind', Schemas.choice(['scheduled', 'manual', 'mock'])),
                        Schemas.field('intendedAtMs', { ...Schemas.timestamp, nullable: true }),
                        Schemas.field('observedAtMs', Schemas.timestamp),
                        Schemas.field('activationRevision', { ...Schemas.count, nullable: true }),
                    ]),
                ),
            ],
            resources: [],
            execution: Ports.execution(ComponentEffect.Pure),
            resourceRole: null,
            migratesFrom: [],
        };
    }
}
