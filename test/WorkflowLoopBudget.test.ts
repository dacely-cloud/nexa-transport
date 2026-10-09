// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { ComponentRegistry } from '../src/workflows/ComponentRegistry.js';
import { SchemaValues } from '../src/workflows/SchemaValues.js';
import type { ComponentDefinition } from '../src/workflows/ComponentTypes.js';
import type { WorkflowValue } from '../src/workflows/WorkflowTypes.js';

it.each(['flow.each', 'flow.repeat'])(
    'keeps %s loop allowances optional and exact',
    (component: string): void => {
        const catalog: ComponentRegistry = ComponentRegistry.builtin();
        const definition: ComponentDefinition | null = catalog.get(component, '1');
        if (definition === null) {
            throw new Error('Missing loop component');
        }
        const configured: Readonly<Record<string, WorkflowValue>> = catalog.create(
            component,
            '1',
            'loop',
        ).configuration;
        expect(SchemaValues.inspect(definition.configuration, configured)).toHaveLength(0);
        for (const value of ['0', '9007199254740993', '9223372036854775807']) {
            expect(
                SchemaValues.inspect(definition.configuration, {
                    ...configured,
                    creditLimitMicrocents: value,
                }),
            ).toHaveLength(0);
        }
        for (const value of [-1, 0.5, '1.5', '-1', '9223372036854775808', null]) {
            expect(
                SchemaValues.inspect(definition.configuration, {
                    ...configured,
                    creditLimitMicrocents: value,
                }).length,
            ).toBeGreaterThan(0);
        }
    },
);
