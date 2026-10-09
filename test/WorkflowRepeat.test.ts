// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { ComponentRegistry } from '../src/workflows/ComponentRegistry.js';
import { GraphEach } from '../src/workflows/GraphEach.js';
import { LoopComponents } from '../src/workflows/LoopComponents.js';
import { WorkflowGraphValidation } from '../src/workflows/GraphValidation.js';
import type { WorkflowGraph } from '../src/workflows/GraphTypes.js';
import type { WorkflowNode } from '../src/workflows/WorkflowTypes.js';

it('validates the explicit repeat boundary and rejects a mismatched collector', (): void => {
    const catalog: ComponentRegistry = ComponentRegistry.builtin();
    const loop: WorkflowNode = catalog.create('flow.repeat', '1', 'loop');
    const end: WorkflowNode = catalog.create('flow.repeat-result', '1', 'end');
    const graph: WorkflowGraph = {
        workflowId: 'workflow',
        revision: '1',
        nodes: [
            catalog.create('trigger.manual', '1', 'start'),
            { ...loop, configuration: { ...loop.configuration, initial: null } },
            { ...end, configuration: { loop: 'loop', done: true } },
        ],
        edges: [
            {
                id: 'start',
                kind: 'flow',
                from: { node: 'start', port: 'started' },
                to: { node: 'loop', port: 'in' },
            },
            {
                id: 'body',
                kind: 'flow',
                from: { node: 'loop', port: 'body' },
                to: { node: 'end', port: 'in' },
            },
            {
                id: 'state',
                kind: 'data',
                from: { node: 'loop', port: 'state' },
                to: { node: 'end', port: 'value' },
            },
        ],
    };
    expect(WorkflowGraphValidation.inspect(graph)).toMatchObject({ valid: true });
    expect(GraphEach.regions(graph)[0]?.members).toEqual(new Set(['end']));
    expect(LoopComponents.result(loop.component)).toBe(end.component);
    expect(LoopComponents.maximum(loop)).toBe(10);
    expect((): void => {
        GraphEach.regions({
            ...graph,
            nodes: graph.nodes.map((node: WorkflowNode): WorkflowNode =>
                node.id === 'end' ? { ...node, component: 'flow.each-result' } : node,
            ),
        });
    }).toThrow('owning');
});
