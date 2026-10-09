// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentCategory,
    ComponentEffect,
    ComponentRole,
    PortDirection,
    type ComponentDefinition,
} from './ComponentTypes.js';
import { ComponentFactory } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { Schemas } from './Schemas.js';
import { MappingCodec } from './mapping/MappingCodec.js';
import { MappingMode } from './mapping/MappingTypes.js';

/** Executable field mapping uses the same plan as authoring, with explicit named data inputs. */
export class MappingComponents {
    public static definition(): ComponentDefinition {
        return {
            id: 'data.mapping',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Transform,
            display: CoreComponents.display(
                'Map fields',
                'Select fields, fill templates and apply explicit defaults to real inputs.',
                'Turn a source record into a named report payload.',
                ['mapping', 'fields', 'template', 'data'],
                'text',
                [],
            ),
            configuration: Schemas.object([
                Schemas.field('mapping_plan', MappingCodec.schema),
                Schemas.field('operation', Schemas.choice(Object.values(MappingMode)), false),
                Schemas.field('source', Schemas.json, false),
                Schemas.field('context', Schemas.json, false),
            ]),
            defaults: {
                mapping_plan: MappingCodec.encode(MappingCodec.initial()),
                operation: MappingMode.Fields,
            },
            ports: [
                ComponentFactory.flow('in', PortDirection.Input),
                ComponentFactory.input('source', 'Source', Schemas.json, false, 'source'),
                ComponentFactory.input('context', 'Context', Schemas.json, false, 'context'),
                ComponentFactory.flow('out', PortDirection.Output),
                ComponentFactory.output('value', 'Mapped fields', Schemas.object([], true)),
            ],
            resources: [],
            execution: ComponentFactory.execution(ComponentEffect.Pure),
            resourceRole: null,
            migratesFrom: [],
        };
    }
}
