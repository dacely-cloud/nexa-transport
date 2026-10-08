// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ResourceFamily, ResourceUse, type ResourceBinding } from './ResourceTypes.js';
import { ResourceComponents } from './ResourceComponents.js';
import { WorkflowEdgeKind, type WorkflowEdge } from './WorkflowTypes.js';
import {
    GraphIssueCode,
    GraphSeverity,
    type GraphNode,
    type GraphConnectionsResult,
} from './GraphTypes.js';
import type { ComponentResourceSlot } from './ComponentTypes.js';
import { GraphConnections } from './GraphConnections.js';
import type { GraphProblems } from './GraphProblems.js';

/** Resolves explicit attachments only. No transitive access through meetings, agents or other wires. */
export class GraphResources {
    public static bindings(
        target: GraphNode,
        nodes: ReadonlyMap<string, GraphNode>,
        connections: GraphConnectionsResult,
        problems: GraphProblems,
    ): readonly ResourceBinding[] {
        const result: ResourceBinding[] = [...target.node.resources];
        for (const port of target.definition.ports) {
            const edges: readonly WorkflowEdge[] =
                connections.incoming.get(GraphConnections.key(target.node.id, port.id)) ?? [];
            for (const edge of edges) {
                if (edge.kind !== WorkflowEdgeKind.Resource) {
                    continue;
                }
                const source: GraphNode | undefined = nodes.get(edge.from.node);
                const family: ResourceFamily | undefined = source?.definition.externalFamily;
                if (source === undefined || family === undefined) {
                    continue;
                }
                const slot: ComponentResourceSlot | undefined = target.definition.resources.find(
                    (entry: ComponentResourceSlot): boolean => entry.family === family,
                );
                const use: ResourceUse | undefined = slot?.uses[0];
                if (slot === undefined || slot.uses.length !== 1 || use === undefined) {
                    problems.add(
                        GraphIssueCode.Resource,
                        'This component does not declare an unambiguous use for this resource',
                        target.node.id,
                        edge.id,
                    );
                    continue;
                }
                try {
                    result.push(
                        ResourceComponents.binding(
                            source.node,
                            family,
                            target.node.id,
                            edge.id,
                            use,
                        ),
                    );
                } catch {
                    problems.add(
                        GraphIssueCode.Resource,
                        'Resource configuration is incomplete or invalid',
                        source.node.id,
                        edge.id,
                    );
                }
            }
        }
        const ids: Set<string> = new Set();
        for (const binding of result) {
            if (ids.has(binding.id)) {
                problems.add(
                    GraphIssueCode.Duplicate,
                    'Resource binding identity is duplicated for this consumer',
                    target.node.id,
                );
            }
            ids.add(binding.id);
            if (binding.consumerId !== target.node.id) {
                problems.add(
                    GraphIssueCode.Resource,
                    'Resource binding belongs to a different consumer',
                    target.node.id,
                    null,
                    binding.id,
                );
            }
            if (
                !target.definition.resources.some(
                    (slot: ComponentResourceSlot): boolean =>
                        slot.family === binding.family && slot.uses.includes(binding.use),
                )
            ) {
                problems.add(
                    GraphIssueCode.Resource,
                    'Resource family or use is not supported by this component',
                    target.node.id,
                    null,
                    binding.id,
                );
            }
            if (binding.selection === null) {
                problems.add(
                    GraphIssueCode.Setup,
                    'Choose an authorized resource and exact target before live execution',
                    target.node.id,
                    null,
                    binding.id,
                    GraphSeverity.Warning,
                );
            }
        }
        return result;
    }
    /** Unconnected resource cards still retain a useful setup diagnosis without scheduling work. */
    public static card(node: GraphNode, problems: GraphProblems): void {
        const family: ResourceFamily | undefined = node.definition.externalFamily;
        if (family === undefined) {
            return;
        }
        try {
            const binding: ResourceBinding = ResourceComponents.binding(
                node.node,
                family,
                node.node.id,
                node.node.id,
                family === ResourceFamily.Compute ? ResourceUse.Compute : ResourceUse.Attach,
            );
            if (binding.selection === null) {
                problems.add(
                    GraphIssueCode.Setup,
                    'Resource selection is not configured',
                    node.node.id,
                    null,
                    'selection',
                    GraphSeverity.Warning,
                );
            }
        } catch {
            problems.add(
                GraphIssueCode.Resource,
                'Resource card contains an invalid selection, operation or limit',
                node.node.id,
            );
        }
    }
}
