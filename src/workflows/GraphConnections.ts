// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { GraphIssueCode, type GraphNode, type GraphConnectionsResult } from './GraphTypes.js';
import type { ComponentPort } from './ComponentTypes.js';
import type { WorkflowEdge, WorkflowValue } from './WorkflowTypes.js';
import { PortCompatibility } from './PortCompatibility.js';
import type { GraphProblems } from './GraphProblems.js';

/** Linear connection indexing for both validation and per-node inspection. */
export class GraphConnections {
    public static key(nodeId: string, portId: string): string {
        return JSON.stringify([nodeId, portId]);
    }
    public static inspect(
        edges: readonly WorkflowEdge[],
        nodes: ReadonlyMap<string, GraphNode>,
        problems: GraphProblems,
    ): GraphConnectionsResult {
        const accepted: WorkflowEdge[] = [];
        const incoming: Map<string, WorkflowEdge[]> = new Map();
        const counts: Map<string, number> = new Map();
        const ids: Set<string> = new Set();
        const connections: Set<string> = new Set();
        for (const edge of edges) {
            const key: string = JSON.stringify([
                edge.kind,
                edge.from.node,
                edge.from.port,
                edge.to.node,
                edge.to.port,
            ]);
            if (ids.has(edge.id) || connections.has(key)) {
                problems.add(
                    GraphIssueCode.Duplicate,
                    'Connection identity or endpoints are duplicated',
                    null,
                    edge.id,
                );
                continue;
            }
            ids.add(edge.id);
            connections.add(key);
            const source: ComponentPort | undefined = nodes
                .get(edge.from.node)
                ?.ports.get(edge.from.port);
            const target: ComponentPort | undefined = nodes
                .get(edge.to.node)
                ?.ports.get(edge.to.port);
            if (source === undefined || target === undefined) {
                problems.add(
                    GraphIssueCode.Endpoint,
                    'Connection refers to a missing component or port',
                    null,
                    edge.id,
                );
                continue;
            }
            const problem: string | null = PortCompatibility.problem(source, target, edge.kind);
            if (problem !== null) {
                problems.add(GraphIssueCode.Connection, problem, edge.to.node, edge.id);
                continue;
            }
            if (target.modelCapabilities !== undefined) {
                const sourceNode: GraphNode | undefined = nodes.get(edge.from.node);
                const capability: WorkflowValue | undefined =
                    sourceNode?.node.configuration['capability'];
                if (
                    sourceNode?.definition.id === 'model.binding' &&
                    (typeof capability !== 'string' ||
                        !target.modelCapabilities.includes(capability))
                ) {
                    problems.add(
                        GraphIssueCode.Connection,
                        'This model binding targets a different operation',
                        edge.to.node,
                        edge.id,
                    );
                    continue;
                }
            }
            const sourceKey: string = this.key(edge.from.node, edge.from.port);
            const targetKey: string = this.key(edge.to.node, edge.to.port);
            const sourceCount: number = (counts.get(sourceKey) ?? 0) + 1;
            const targetCount: number = (counts.get(targetKey) ?? 0) + 1;
            counts.set(sourceKey, sourceCount);
            counts.set(targetKey, targetCount);
            if (sourceCount > source.maxConnections || targetCount > target.maxConnections) {
                problems.add(
                    GraphIssueCode.Cardinality,
                    'Port connection limit exceeded; use an explicit collector or join',
                    edge.to.node,
                    edge.id,
                );
            }
            const inputs: WorkflowEdge[] = incoming.get(targetKey) ?? [];
            inputs.push(edge);
            incoming.set(targetKey, inputs);
            accepted.push(edge);
        }
        return { edges: accepted, incoming };
    }
}
