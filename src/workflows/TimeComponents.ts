// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentRole,
    ComponentCategory,
    ComponentEffect,
    MockBehavior,
    PortDirection,
    type ComponentDefinition,
} from './ComponentTypes.js';
import { ComponentFactory as Ports } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { WorkflowTimeLimits } from './TimeLimits.js';
import { Schemas } from './Schemas.js';
import type { ValueSchema } from './SchemaTypes.js';

/** Durable branch waits share one runtime contract, with distinct duration and instant inputs. */
export class TimeComponents {
    /** Catalog entries do not activate schedules or keep a browser timer alive. */
    public static definitions(): readonly ComponentDefinition[] {
        return [this.#definition(false), this.#definition(true)];
    }
    static #definition(until: boolean): ComponentDefinition {
        const field: string = until ? 'atMs' : 'durationMs';
        const schema: ValueSchema = until
            ? Schemas.timestamp
            : { ...Schemas.count, minimum: 1, maximum: Number(WorkflowTimeLimits.maximumMs) };
        return {
            id: until ? 'time.until' : 'time.delay',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Time,
            display: CoreComponents.display(
                until ? 'Wait until' : 'Delay',
                until
                    ? 'Continue this branch at a chosen time.'
                    : 'Pause this branch for a duration, then continue.',
                until
                    ? 'Wait until the release time before preparing the announcement.'
                    : 'Wait five minutes before checking again.',
                ['wait', 'time', 'pause', 'timer'],
                'clock',
                [field],
            ),
            configuration: Schemas.object([Schemas.field(field, schema, false)]),
            defaults: until ? {} : { durationMs: '60000' },
            ports: [
                Ports.flow('in', PortDirection.Input, 'Start waiting'),
                Ports.input(
                    until ? 'at' : 'duration',
                    until ? 'Continue at' : 'Wait duration',
                    schema,
                    true,
                    field,
                ),
                Ports.flow('out', PortDirection.Output, 'Continue'),
                Ports.output(
                    'timing',
                    'Wait result',
                    Schemas.object([
                        Schemas.field('intendedAtMs', Schemas.timestamp),
                        Schemas.field('resumedAtMs', Schemas.timestamp),
                        Schemas.field('sample', Schemas.boolean),
                    ]),
                ),
            ],
            resources: [],
            execution: {
                ...Ports.execution(ComponentEffect.Wait),
                mock: MockBehavior.Deterministic,
            },
            resourceRole: null,
            migratesFrom: [],
        };
    }
}
