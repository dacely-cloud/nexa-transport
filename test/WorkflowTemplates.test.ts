// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { ComponentRegistry } from '../src/workflows/ComponentRegistry.js';
import { WorkflowTemplateFields } from '../src/workflows/TemplateFields.js';
import { WorkflowTemplateInputs } from '../src/workflows/TemplateInputs.js';
import { WorkflowGraphValidation } from '../src/workflows/GraphValidation.js';
import type { GraphIssue } from '../src/workflows/GraphTypes.js';
import type { WorkflowTemplateGraph } from '../src/workflows/TemplateInputs.js';

it('creates a runnable plain template and diagnoses missing custom values in the editor', (): void => {
    const catalog: ComponentRegistry = ComponentRegistry.builtin();
    const node: ReturnType<ComponentRegistry['create']> = catalog.create(
        'text.template',
        '1',
        'text',
    );
    expect(node.configuration['template']).toBe('Hello');
    const report: ReturnType<typeof WorkflowGraphValidation.inspect> =
        WorkflowGraphValidation.inspect({
            workflowId: 'workflow',
            revision: '1',
            nodes: [{ ...node, configuration: { template: 'Hello {{name}}' } }],
            edges: [],
        });
    expect(report.valid).toBe(false);
    const missing: GraphIssue | undefined = report.issues.find(
        (issue: GraphIssue): boolean => issue.path === 'values',
    );
    expect(missing?.message).toContain('name. Provide it in Template values');
});

it('shares bounded safe paths and preserves zero, false, empty text and null', (): void => {
    expect(WorkflowTemplateFields.paths('{{user.name}} / {{user.name}} / {{value}}')).toEqual([
        'user.name',
        'value',
    ]);
    for (const value of [0, false, '', null]) {
        expect(WorkflowTemplateFields.value({ value }, 'value')).toBe(value);
    }
    for (const template of ['{{constructor.name}}', '{{process.exit()}}', '{{user.__proto__}}']) {
        expect((): readonly string[] => WorkflowTemplateFields.paths(template)).toThrow();
    }
});

it('rejects an empty submission before sending a directly started template run', (): void => {
    const catalog: ComponentRegistry = ComponentRegistry.builtin();
    const graph: WorkflowTemplateGraph = {
        nodes: [
            catalog.create('trigger.manual', '1', 'start'),
            {
                ...catalog.create('text.template', '1', 'text'),
                configuration: { template: 'Hello {{user.name}}' },
            },
        ],
        edges: [
            {
                id: 'flow',
                kind: 'flow',
                from: { node: 'start', port: 'started' },
                to: { node: 'text', port: 'in' },
            },
            {
                id: 'data',
                kind: 'data',
                from: { node: 'start', port: 'input' },
                to: { node: 'text', port: 'values' },
            },
        ],
    };
    expect((): void => WorkflowTemplateInputs.validate(graph, 'start', {})).toThrow('user.name');
    expect((): void =>
        WorkflowTemplateInputs.validate(graph, 'start', { user: { name: 'Ada' } }),
    ).not.toThrow();
    expect((): void => WorkflowTemplateInputs.validate(graph, 'other-trigger', {})).not.toThrow();
});
