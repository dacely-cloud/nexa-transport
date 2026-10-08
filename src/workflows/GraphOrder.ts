// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ComponentRole } from './ComponentTypes.js';
import { WorkflowEdgeKind, type WorkflowEdge } from './WorkflowTypes.js';
import { GraphIssueCode, GraphSeverity, type GraphNode } from './GraphTypes.js';
import type { GraphProblems } from './GraphProblems.js';

/** Iterative dependency analysis handles large graphs without recursion or canvas-order semantics. */
export class GraphOrder {
    public static inspect(
        nodes: ReadonlyMap<string, GraphNode>,
        edges: readonly WorkflowEdge[],
        problems: GraphProblems,
    ): readonly string[] {
        const executable: readonly GraphNode[] = [...nodes.values()]
            .filter(
                (entry: GraphNode): boolean =>
                    entry.definition.role === ComponentRole.Step ||
                    entry.definition.role === ComponentRole.Trigger,
            )
            .sort((left: GraphNode, right: GraphNode): number =>
                left.node.id < right.node.id ? -1 : left.node.id > right.node.id ? 1 : 0,
            );
        const dependencies: Map<string, Set<string>> = new Map();
        const outgoing: Map<string, Set<string>> = new Map();
        const flow: Map<string, Set<string>> = new Map();
        for (const entry of executable) {
            dependencies.set(entry.node.id, new Set());
            outgoing.set(entry.node.id, new Set());
            flow.set(entry.node.id, new Set());
        }
        for (const edge of edges) {
            if (edge.kind === WorkflowEdgeKind.Resource) {
                continue;
            }
            if (dependencies.has(edge.to.node) && dependencies.has(edge.from.node)) {
                dependencies.get(edge.to.node)?.add(edge.from.node);
                outgoing.get(edge.from.node)?.add(edge.to.node);
                if (edge.kind === WorkflowEdgeKind.Flow) {
                    flow.get(edge.from.node)?.add(edge.to.node);
                }
            }
        }
        const queue: string[] = executable
            .filter((entry: GraphNode): boolean => dependencies.get(entry.node.id)?.size === 0)
            .map((entry: GraphNode): string => entry.node.id);
        const order: string[] = [];
        for (let cursor: number = 0; cursor < queue.length; cursor += 1) {
            const id: string | undefined = queue[cursor];
            if (id === undefined) {
                throw new Error('Incomplete dependency queue');
            }
            order.push(id);
            for (const next of [...(outgoing.get(id) ?? [])].sort()) {
                const waiting: Set<string> | undefined = dependencies.get(next);
                waiting?.delete(id);
                if (waiting?.size === 0) {
                    queue.push(next);
                }
            }
        }
        if (order.length !== executable.length) {
            problems.add(
                GraphIssueCode.Cycle,
                'Flow or data dependencies contain a cycle; use an explicit bounded loop component',
            );
        }
        const triggers: string[] = executable
            .filter((entry: GraphNode): boolean => entry.definition.role === ComponentRole.Trigger)
            .map((entry: GraphNode): string => entry.node.id);
        if (triggers.length === 0) {
            problems.add(GraphIssueCode.Trigger, 'Add a trigger or manual start');
        }
        const reachable: Set<string> = new Set(triggers);
        for (let cursor: number = 0; cursor < triggers.length; cursor += 1) {
            const id: string | undefined = triggers[cursor];
            if (id === undefined) {
                throw new Error('Incomplete reachability queue');
            }
            for (const next of flow.get(id) ?? []) {
                if (!reachable.has(next)) {
                    reachable.add(next);
                    triggers.push(next);
                }
            }
        }
        for (const entry of executable) {
            if (!reachable.has(entry.node.id)) {
                problems.add(
                    GraphIssueCode.Unreachable,
                    'No trigger activates this step',
                    entry.node.id,
                    null,
                    null,
                    GraphSeverity.Warning,
                );
            }
        }
        return Object.freeze(order);
    }
}
