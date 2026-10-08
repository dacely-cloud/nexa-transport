// SPDX-License-Identifier: Apache-2.0

import type {
    WorkflowNode,
    WorkflowEdge,
    WorkflowPosition,
    WorkflowPatch,
} from '../WorkflowTypes.js';
import { PlanningCodec } from './PlanningCodec.js';
import type { PlanningDocument } from './PlanningTypes.js';

/** Pure proposal application shared with the editor. No persistence, activation or I/O. */
export class PlanningEdits {
    public static apply(document: PlanningDocument, patch: WorkflowPatch): PlanningDocument {
        const nodes: Map<string, WorkflowNode> = new Map(
            document.nodes.map((node: WorkflowNode): [string, WorkflowNode] => [node.id, node]),
        );
        const edges: Map<string, WorkflowEdge> = new Map(
            document.edges.map((edge: WorkflowEdge): [string, WorkflowEdge] => [edge.id, edge]),
        );
        const positions: Map<string, WorkflowPosition> = new Map(
            document.positions.map((position: WorkflowPosition): [string, WorkflowPosition] => [
                position.id,
                position,
            ]),
        );
        for (const id of patch.removeNodes) {
            if (!nodes.delete(id)) {
                throw new Error(`Cannot remove missing component ${id}`);
            }
            positions.delete(id);
        }
        for (const id of patch.removeEdges) {
            if (!edges.delete(id)) {
                throw new Error(`Cannot remove missing connection ${id}`);
            }
        }
        for (const node of patch.nodes) {
            nodes.set(node.id, node);
        }
        for (const position of patch.positions) {
            if (!nodes.has(position.id)) {
                throw new Error(`Cannot position missing component ${position.id}`);
            }
            positions.set(position.id, position);
        }
        for (const edge of patch.edges) {
            edges.set(edge.id, edge);
        }
        for (const edge of edges.values()) {
            if (!nodes.has(edge.from.node) || !nodes.has(edge.to.node)) {
                throw new Error(`Connection ${edge.id} references a removed or missing component`);
            }
        }
        return PlanningCodec.document({
            details: patch.details ?? document.details,
            nodes: [...nodes.values()],
            positions: [...positions.values()],
            edges: [...edges.values()],
        });
    }
}
