// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { ComponentRegistry } from '../src/workflows/ComponentRegistry.js';
import { WorkflowHttpInputs } from '../src/workflows/HttpInputs.js';
import type { ComponentDefinition } from '../src/workflows/ComponentTypes.js';

it('shares the API request catalog and keeps proxy configuration out of the browser contract', (): void => {
    const definition: ComponentDefinition | null = ComponentRegistry.builtin().get(
        'http.request',
        '1',
    );
    if (definition === null) {
        throw new Error('Missing HTTP Request');
    }
    expect(definition.display.title).toBe('HTTP Request');
    expect(definition.execution?.effect).toBe('external');
    expect(definition.ports.map((port): string => port.id)).toContain('response');
    expect(
        definition.configuration.fields.some((field): boolean =>
            field.name.toLowerCase().includes('proxy'),
        ),
    ).toBe(false);
    expect(
        WorkflowHttpInputs.parse(definition.defaults, { url: 'https://example.com' }),
    ).toMatchObject({ method: 'GET', timeoutMs: 30000, maxResponseBytes: 262144 });
});
