// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ListPlans } from './lists/ListPlan.js';
import { MappingValidation } from './mapping/MappingValidation.js';
import { WorkflowTimedTrigger } from './TimedTrigger.js';
import { ComponentRegistry } from './ComponentRegistry.js';
import {
    ComponentRole,
    PortDirection,
    type ComponentDefinition,
    type ComponentPort,
} from './ComponentTypes.js';
import { SchemaValues } from './SchemaValues.js';
import {
    GraphIssueCode,
    GraphSeverity,
    type WorkflowGraph,
    type GraphValidation,
    type GraphNode,
    type GraphConnectionsResult,
} from './GraphTypes.js';
import { GraphProblems } from './GraphProblems.js';
import { GraphConnections } from './GraphConnections.js';
import { GraphResources } from './GraphResources.js';
import { GraphEach } from './GraphEach.js';
import { GraphOrder } from './GraphOrder.js';
import type { WorkflowEdge, WorkflowValue } from './WorkflowTypes.js';

/** Structural validation is pure and never activates a trigger, model, connector or tool. */
export class WorkflowGraphValidation {
    public static inspect(
        graph: WorkflowGraph,
        registry: ComponentRegistry = ComponentRegistry.builtin(),
    ): GraphValidation {
        if (graph.nodes.length > 10_000 || graph.edges.length > 50_000) {
            throw new Error('Workflow graph exceeds supported component or connection limits');
        }
        const problems: GraphProblems = new GraphProblems();
        const nodes: Map<string, GraphNode> = new Map();
        const ids: Set<string> = new Set();
        const capabilities: Set<string> = new Set();
        const unavailable: Set<string> = new Set();
        for (const node of graph.nodes) {
            if (ids.has(node.id)) {
                problems.add(GraphIssueCode.Duplicate, 'Component identity is duplicated', node.id);
                continue;
            }
            ids.add(node.id);
            const definition: ComponentDefinition | null = registry.get(
                node.component,
                node.componentVersion,
            );
            if (definition === null) {
                problems.add(
                    GraphIssueCode.Component,
                    'Component version is unavailable; keep the draft or migrate explicitly',
                    node.id,
                );
                continue;
            }
            nodes.set(node.id, {
                node,
                definition,
                ports: new Map(
                    definition.ports.map((port: ComponentPort): [string, ComponentPort] => [
                        port.id,
                        port,
                    ]),
                ),
            });
            for (const issue of SchemaValues.inspect(
                definition.configuration,
                node.configuration,
            )) {
                problems.add(
                    GraphIssueCode.Configuration,
                    issue.message,
                    node.id,
                    null,
                    issue.path,
                );
            }
            for (const capability of definition.execution?.capabilities ?? []) {
                capabilities.add(capability);
            }
            if (definition.execution !== null && definition.execution.handler === null) {
                unavailable.add(definition.id);
            }
        }
        const connections: GraphConnectionsResult = GraphConnections.inspect(
            graph.edges,
            nodes,
            problems,
        );
        let resourceRequirements: number = 0;
        for (const entry of nodes.values()) {
            this.#inputs(entry, connections, problems);
            GraphResources.card(entry, problems);
            resourceRequirements += GraphResources.bindings(
                entry,
                nodes,
                connections,
                problems,
            ).length;
            this.#configuration(entry, connections, problems);
        }
        try {
            GraphEach.regions(graph);
        } catch (caught: unknown) {
            problems.add(
                GraphIssueCode.Configuration,
                caught instanceof Error ? caught.message : 'Invalid For each item body',
            );
        }
        const order: readonly string[] = GraphOrder.inspect(nodes, connections.edges, problems);
        for (const component of unavailable) {
            problems.add(
                GraphIssueCode.Runtime,
                `Runtime handler is not installed for ${component}`,
                null,
                null,
                null,
                GraphSeverity.Warning,
            );
        }
        return Object.freeze({
            workflowId: graph.workflowId,
            revision: graph.revision,
            valid: problems.valid,
            issues: problems.issues,
            totalIssues: problems.total,
            truncated: problems.total > problems.issues.length,
            order,
            resourceRequirements,
            requiredCapabilities: Object.freeze([...capabilities].sort()),
            unavailableHandlers: Object.freeze([...unavailable].sort()),
        });
    }
    static #inputs(
        entry: GraphNode,
        connections: GraphConnectionsResult,
        problems: GraphProblems,
    ): void {
        for (const port of entry.definition.ports) {
            if (port.direction !== PortDirection.Input) {
                continue;
            }
            const incoming: readonly WorkflowEdge[] =
                connections.incoming.get(GraphConnections.key(entry.node.id, port.id)) ?? [];
            const literal: boolean =
                port.literalField !== null &&
                Object.hasOwn(entry.node.configuration, port.literalField);
            if (incoming.length === 0 && !literal && port.required) {
                problems.add(
                    GraphIssueCode.Required,
                    `Provide ${port.label}`,
                    entry.node.id,
                    null,
                    port.id,
                );
            }
            if (incoming.length > 0 && literal) {
                problems.add(
                    GraphIssueCode.Ambiguous,
                    'Choose either a connected value or a literal value',
                    entry.node.id,
                    null,
                    port.id,
                );
            }
        }
    }
    static #configuration(
        entry: GraphNode,
        connections: GraphConnectionsResult,
        problems: GraphProblems,
    ): void {
        if (entry.node.component === WorkflowTimedTrigger.component) {
            try {
                WorkflowTimedTrigger.read(entry.node);
            } catch (error: unknown) {
                problems.add(
                    GraphIssueCode.Configuration,
                    error instanceof Error ? error.message : 'Review this Timed Event',
                    entry.node.id,
                    null,
                    'schedule',
                );
            }
        }
        if (entry.definition.id === 'data.list') {
            try {
                ListPlans.parse(
                    entry.node.configuration,
                    Object.hasOwn(entry.node.configuration, 'context') ||
                        (connections.incoming.get(GraphConnections.key(entry.node.id, 'context'))
                            ?.length ?? 0) > 0,
                );
            } catch (caught: unknown) {
                problems.add(
                    GraphIssueCode.Configuration,
                    caught instanceof Error ? caught.message : 'Invalid list settings',
                    entry.node.id,
                    null,
                    'operation',
                );
            }
        }
        if (entry.definition.id === 'data.mapping') {
            const available: Set<string> = new Set(
                ['source', 'context'].filter(
                    (slot: string): boolean =>
                        Object.hasOwn(entry.node.configuration, slot) ||
                        (connections.incoming.get(GraphConnections.key(entry.node.id, slot))
                            ?.length ?? 0) > 0,
                ),
            );
            try {
                MappingValidation.parse(entry.node.configuration['mapping_plan'], available);
            } catch (caught: unknown) {
                problems.add(
                    GraphIssueCode.Configuration,
                    caught instanceof Error ? caught.message : 'Invalid mapping plan',
                    entry.node.id,
                    null,
                    'mapping_plan',
                );
            }
        }
        if (entry.definition.id === 'flow.join') {
            const mode: WorkflowValue | undefined = entry.node.configuration['mode'];
            const count: WorkflowValue | undefined = entry.node.configuration['requiredCount'];
            const window: WorkflowValue | undefined = entry.node.configuration['windowMs'];
            if (
                mode === 'required-count' &&
                (typeof count !== 'number' || !Number.isInteger(count) || count < 1)
            ) {
                problems.add(
                    GraphIssueCode.Configuration,
                    'Choose a positive whole number of branches',
                    entry.node.id,
                    null,
                    'requiredCount',
                );
            }
            if (
                mode === 'required-count' &&
                typeof count === 'number' &&
                count >
                    (connections.incoming.get(GraphConnections.key(entry.node.id, 'in'))?.length ??
                        0)
            ) {
                problems.add(
                    GraphIssueCode.Configuration,
                    'Required branch count exceeds connected branches',
                    entry.node.id,
                    null,
                    'requiredCount',
                );
            }
            if (mode === 'time-window' && (typeof window !== 'string' || window === '0')) {
                problems.add(
                    GraphIssueCode.Configuration,
                    'Choose a positive collection window',
                    entry.node.id,
                    null,
                    'windowMs',
                );
            }
        }
        if (
            entry.definition.role === ComponentRole.Resource &&
            entry.definition.id === 'model.binding'
        ) {
            if (
                entry.node.configuration['provider'] === null ||
                (entry.node.configuration['selection'] === 'exact' &&
                    entry.node.configuration['modelId'] === null)
            ) {
                problems.add(
                    GraphIssueCode.Setup,
                    'Choose an available provider and exact model or compatible-selection policy',
                    entry.node.id,
                    null,
                    'modelId',
                    GraphSeverity.Warning,
                );
            }
        }
        if (
            entry.definition.id === 'agent.reference' &&
            (entry.node.configuration['agentId'] === null ||
                entry.node.configuration['version'] === null)
        ) {
            problems.add(
                GraphIssueCode.Setup,
                'Select an authorized agent and explicit version before execution',
                entry.node.id,
                null,
                'agentId',
                GraphSeverity.Warning,
            );
        }
    }
}
