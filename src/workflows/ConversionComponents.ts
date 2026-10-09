// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ConversionKind, ScalarConversion } from './ScalarConversion.js';
import {
    ComponentCategory,
    ComponentRole,
    ComponentEffect,
    PortDirection,
    type ComponentDefinition,
} from './ComponentTypes.js';
import { ComponentFactory } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { Schemas } from './Schemas.js';

/** One conversion family exposes fixed typed presets with identical execution and editing rules. */
export class ConversionComponents {
    /** Definitions reject implicit null/default handling and make whitespace handling an explicit option. */
    public static definitions(): readonly ComponentDefinition[] {
        return Object.values(ConversionKind).map((kind: ConversionKind): ComponentDefinition => ({
            id: 'data.to-' + kind,
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Transform,
            display: CoreComponents.display(
                'Convert to ' + kind,
                'Explicitly convert a scalar value to ' +
                    kind +
                    '. Invalid values fail without coercing a fallback.',
                'Prepare a selected value for a typed input.',
                ['convert', 'type', kind],
                'text',
                ['value'],
            ),
            configuration: Schemas.object([
                Schemas.field('value', Schemas.json, false),
                Schemas.field('trim', Schemas.boolean, false),
                ...(kind === ConversionKind.Boolean
                    ? [Schemas.field('numericBooleans', Schemas.boolean, false)]
                    : []),
            ]),
            defaults: {
                trim: false,
                ...(kind === ConversionKind.Boolean ? { numericBooleans: false } : {}),
            },
            ports: [
                ComponentFactory.flow('in', PortDirection.Input),
                ComponentFactory.input('input', 'Value', Schemas.json, true, 'value'),
                ComponentFactory.flow('out', PortDirection.Output),
                ComponentFactory.output(
                    'value',
                    'Converted ' + kind,
                    ScalarConversion.schema(kind),
                ),
            ],
            resources: [],
            execution: ComponentFactory.execution(ComponentEffect.Pure),
            resourceRole: null,
            migratesFrom: [],
        }));
    }
}
