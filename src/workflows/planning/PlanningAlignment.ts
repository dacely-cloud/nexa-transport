// SPDX-License-Identifier: Apache-2.0

import { WorkflowCodec } from '../WorkflowCodec.js';
import type { WorkflowNode, WorkflowEdge } from '../WorkflowTypes.js';
import type { ResourceBinding } from '../ResourceTypes.js';
import type { PlanningDocument, PlanningRequirement } from './PlanningTypes.js';

/** A fingerprint detects graph drift; it never proves a requirement is fulfilled or runnable. */
export interface PlanningRequirementFingerprint {
    readonly id: string;
    readonly hash: string;
}
export interface PlanningGraphFingerprint {
    readonly graphHash: string;
    readonly requirements: readonly PlanningRequirementFingerprint[];
}
/** Server-created semantic anchors for the request and the proposed graph. */
export interface PlanningAlignmentAnchor extends PlanningGraphFingerprint {
    readonly version: 1;
    readonly beforeHash: string;
}
/** Connected steps share a review boundary, including data, flow, and resource edges. */
export interface PlanningSemanticGroup {
    readonly nodeIds: readonly string[];
    readonly value: string;
}
export interface PlanningSignature {
    readonly id: string;
    readonly value: string;
}
export interface PlanningSignatureTargets {
    readonly graph: string;
    readonly requirements: readonly PlanningSignature[];
}
interface SemanticNode extends Omit<WorkflowNode, 'label'> {}
interface SemanticEdge extends Omit<WorkflowEdge, 'id'> {}

/** Portable canonicalization shared by server anchors and browser comparisons. No I/O or inference. */
export class PlanningAlignment {
    /** Excludes labels, layout and library metadata; retains executable configuration and resource scope. */
    public static groups(document: PlanningDocument): readonly PlanningSemanticGroup[] {
        const nodes: ReadonlyMap<string, WorkflowNode> = new Map(
            document.nodes.map((node: WorkflowNode): [string, WorkflowNode] => [node.id, node]),
        );
        if (nodes.size !== document.nodes.length) {
            throw new Error('Duplicate component identities cannot be compared with the plan');
        }
        const adjacency: Map<string, Set<string>> = new Map();
        for (const node of document.nodes) {
            adjacency.set(node.id, new Set());
        }
        for (const edge of document.edges) {
            if (!adjacency.has(edge.from.node)) {
                adjacency.set(edge.from.node, new Set());
            }
            if (!adjacency.has(edge.to.node)) {
                adjacency.set(edge.to.node, new Set());
            }
            adjacency.get(edge.from.node)?.add(edge.to.node);
            adjacency.get(edge.to.node)?.add(edge.from.node);
        }
        const membership: Map<string, number> = new Map();
        const groups: string[][] = [];
        for (const first of [...adjacency.keys()].sort()) {
            if (membership.has(first)) {
                continue;
            }
            const members: string[] = [];
            const pending: string[] = [first];
            membership.set(first, groups.length);
            while (pending.length > 0) {
                const id: string | undefined = pending.pop();
                if (id === undefined) {
                    break;
                }
                members.push(id);
                for (const neighbor of adjacency.get(id) ?? []) {
                    if (membership.has(neighbor)) {
                        continue;
                    }
                    membership.set(neighbor, groups.length);
                    pending.push(neighbor);
                }
            }
            groups.push(members.sort());
        }
        const edges: string[][] = groups.map((): string[] => []);
        for (const edge of document.edges) {
            const group: number | undefined = membership.get(edge.from.node);
            if (group === undefined) {
                throw new Error('Missing semantic edge group');
            }
            const checked: WorkflowEdge = WorkflowCodec.edge(edge);
            const semantic: SemanticEdge = {
                kind: checked.kind,
                from: checked.from,
                to: checked.to,
            };
            edges[group]?.push(JSON.stringify(semantic));
        }
        return groups.map((ids: readonly string[], index: number): PlanningSemanticGroup => ({
            nodeIds: ids,
            value: JSON.stringify({
                nodes: ids.map((id: string): SemanticNode | string => {
                    const node: WorkflowNode | undefined = nodes.get(id);
                    if (node === undefined) {
                        return id;
                    }
                    const checked: WorkflowNode = WorkflowCodec.node(node);
                    return {
                        id: checked.id,
                        component: checked.component,
                        componentVersion: checked.componentVersion,
                        configuration: checked.configuration,
                        resources: checked.resources.toSorted(
                            (left: ResourceBinding, right: ResourceBinding): number =>
                                left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
                        ),
                    };
                }),
                edges: (edges[index] ?? []).sort(),
            }),
        }));
    }
    /** Hash each group once, then combine small hashes for the graph and each linked requirement. */
    public static targets(
        groups: readonly PlanningSemanticGroup[],
        hashes: readonly string[],
        requirements: readonly PlanningRequirement[],
    ): PlanningSignatureTargets {
        if (groups.length !== hashes.length) {
            throw new Error('Missing semantic group fingerprints');
        }
        const byNode: Map<string, string> = new Map();
        for (let index: number = 0; index < groups.length; index += 1) {
            const group: PlanningSemanticGroup | undefined = groups[index];
            const hash: string | undefined = hashes[index];
            if (group === undefined || hash === undefined) {
                throw new Error('Missing semantic group fingerprint');
            }
            for (const id of group.nodeIds) {
                byNode.set(id, hash);
            }
        }
        return {
            graph: JSON.stringify(hashes.toSorted()),
            requirements: requirements.map(
                (requirement: PlanningRequirement): PlanningSignature => ({
                    id: requirement.id,
                    value: JSON.stringify(
                        [...new Set(requirement.nodeIds)]
                            .sort()
                            .map((id: string): readonly [string, string | null] => [
                                id,
                                byNode.get(id) ?? null,
                            ]),
                    ),
                }),
            ),
        };
    }
}
