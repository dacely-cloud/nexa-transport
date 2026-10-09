// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowGraph } from './GraphTypes.js';
import type { WorkflowEdge, WorkflowNode } from './WorkflowTypes.js';

/** The body is an explicit execution region, independent of canvas grouping. */
export interface WorkflowEachRegion {
    readonly loop: WorkflowNode;
    readonly end: string;
    readonly members: ReadonlySet<string>;
}

/** Rejects escaping item values, ambiguous collection boundaries and accidental repetition. */
export class GraphEach {
    /** Validates structural ownership before any item can execute. */
    public static regions(graph: WorkflowGraph): readonly WorkflowEachRegion[] {
        const nodes: ReadonlyMap<string, WorkflowNode> = new Map(
            graph.nodes.map((node: WorkflowNode): [string, WorkflowNode] => [node.id, node]),
        );
        const outgoing: Map<string, WorkflowEdge[]> = new Map();
        for (const edge of graph.edges) {
            if (edge.kind !== 'flow') {
                continue;
            }
            const list: WorkflowEdge[] = outgoing.get(edge.from.node) ?? [];
            list.push(edge);
            outgoing.set(edge.from.node, list);
        }
        const regions: WorkflowEachRegion[] = [];
        const owned: Set<string> = new Set();
        for (const loop of graph.nodes) {
            if (loop.component !== 'flow.each') {
                continue;
            }
            const members: Set<string> = new Set();
            const pending: string[] = (outgoing.get(loop.id) ?? [])
                .filter((edge: WorkflowEdge): boolean => edge.from.port === 'body')
                .map((edge: WorkflowEdge): string => edge.to.node);
            const ends: string[] = [];
            for (let cursor: number = 0; cursor < pending.length; cursor += 1) {
                const id: string | undefined = pending[cursor];
                if (id === undefined || members.has(id)) {
                    continue;
                }
                const node: WorkflowNode | undefined = nodes.get(id);
                if (node === undefined) {
                    throw new Error('For each item has a missing body component');
                }
                if (node.component === 'flow.each') {
                    throw new Error('Nested For each item bodies are not supported yet');
                }
                if (owned.has(id)) {
                    throw new Error('A component cannot belong to two For each item bodies');
                }
                members.add(id);
                if (node.component === 'flow.each-result') {
                    if (node.configuration['loop'] !== loop.id) {
                        throw new Error(
                            'Collect item result must name its owning For each item component',
                        );
                    }
                    ends.push(id);
                } else {
                    for (const edge of outgoing.get(id) ?? []) {
                        pending.push(edge.to.node);
                    }
                }
            }
            if (ends.length !== 1) {
                throw new Error(
                    'For each item requires exactly one reachable Collect item result component',
                );
            }
            const end: string | undefined = ends[0];
            if (end === undefined) {
                throw new Error('Missing item collection boundary');
            }
            for (const id of members) {
                if (id !== end && (outgoing.get(id)?.length ?? 0) === 0) {
                    throw new Error('Every item body branch must lead to Collect item result');
                }
                owned.add(id);
            }
            for (const edge of graph.edges) {
                if (edge.kind === 'resource') {
                    continue;
                }
                const fromBody: boolean = members.has(edge.from.node);
                const toBody: boolean = members.has(edge.to.node);
                if (fromBody && !toBody) {
                    throw new Error('Item body values must leave through Collect item result');
                }
                if (toBody && !fromBody && edge.from.node !== loop.id) {
                    throw new Error('Pass shared data through the For each item Context input');
                }
                if (edge.from.node === loop.id) {
                    const itemPort: boolean = ['body', 'item', 'index', 'shared'].includes(
                        edge.from.port,
                    );
                    if (itemPort !== toBody) {
                        throw new Error(
                            'Use item ports inside the body and completed results outside it',
                        );
                    }
                }
            }
            regions.push({ loop, end, members });
        }
        for (const node of graph.nodes) {
            if (node.component === 'flow.each-result' && !owned.has(node.id)) {
                throw new Error('Collect item result must be inside its For each item body');
            }
        }
        return regions;
    }
}
