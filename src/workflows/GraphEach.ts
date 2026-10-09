// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { LoopComponents } from './LoopComponents.js';
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
            if (!LoopComponents.isLoop(loop.component)) {
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
                    throw new Error('Loop has a missing body component');
                }
                if (LoopComponents.isLoop(node.component)) {
                    throw new Error('Nested loop bodies are not supported yet');
                }
                if (owned.has(id)) {
                    throw new Error('A component cannot belong to two loop bodies');
                }
                members.add(id);
                if (LoopComponents.isResult(node.component)) {
                    if (
                        node.configuration['loop'] !== loop.id ||
                        node.component !== LoopComponents.result(loop.component)
                    ) {
                        throw new Error('Result boundary must match its owning loop component');
                    }
                    ends.push(id);
                } else {
                    for (const edge of outgoing.get(id) ?? []) {
                        pending.push(edge.to.node);
                    }
                }
            }
            if (ends.length !== 1) {
                throw new Error('Loop requires exactly one reachable matching result boundary');
            }
            const end: string | undefined = ends[0];
            if (end === undefined) {
                throw new Error('Missing loop result boundary');
            }
            for (const id of members) {
                if (id !== end && (outgoing.get(id)?.length ?? 0) === 0) {
                    throw new Error('Every loop body branch must lead to its result boundary');
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
                    throw new Error('Loop body values must leave through its result boundary');
                }
                if (toBody && !fromBody && edge.from.node !== loop.id) {
                    throw new Error('Pass shared data through the loop Context input');
                }
                if (edge.from.node === loop.id) {
                    const itemPort: boolean = ['body', 'item', 'state', 'index', 'shared'].includes(
                        edge.from.port,
                    );
                    if (itemPort !== toBody) {
                        throw new Error(
                            'Use iteration ports inside the body and completed results outside it',
                        );
                    }
                }
            }
            regions.push({ loop, end, members });
        }
        for (const node of graph.nodes) {
            if (LoopComponents.isResult(node.component) && !owned.has(node.id)) {
                throw new Error('Result boundary must be inside its owning loop body');
            }
        }
        return regions;
    }
}
