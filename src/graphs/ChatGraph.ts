// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Available semantic colors, shared by the agent and workflow-based chat renderer. */
export const ChatGraphColor = {
    Blue: 'blue',
    Green: 'green',
    Purple: 'purple',
    Orange: 'orange',
    Red: 'red',
    Gray: 'gray',
} as const;
/** A supported graph card color. */
export type ChatGraphColor = (typeof ChatGraphColor)[keyof typeof ChatGraphColor];
/** A named idea or capability; descriptions are plain text. */
export interface ChatGraphNode extends Readonly<Record<string, string>> {
    readonly id: string;
    readonly label: string;
    readonly description: string;
    readonly color: ChatGraphColor;
}
/** A directed, labelled relationship between two existing nodes. */
export interface ChatGraphEdge extends Readonly<Record<string, string>> {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly label: string;
}
/** A non-executable graph delivered directly into a conversation. */
export interface ChatGraph extends Readonly<
    Record<string, string | readonly ChatGraphNode[] | readonly ChatGraphEdge[]>
> {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly nodes: readonly ChatGraphNode[];
    readonly edges: readonly ChatGraphEdge[];
}
/** Bounded, portable validation at both the tool and transport trust boundaries. */
export class ChatGraphs {
    /** Reject malformed graphs before they can reach layout or connection routing. */
    public static parse(raw: unknown): ChatGraph {
        this.#record(raw);
        const id: string = this.#id(Reflect.get(raw, 'id'));
        const title: string = this.#text(Reflect.get(raw, 'title'), 160, false);
        const description: string = this.#text(Reflect.get(raw, 'description'), 1000, true);
        const rawNodes: unknown = Reflect.get(raw, 'nodes');
        const rawEdges: unknown = Reflect.get(raw, 'edges');
        if (
            !Array.isArray(rawNodes) ||
            rawNodes.length < 1 ||
            rawNodes.length > 100 ||
            !Array.isArray(rawEdges) ||
            rawEdges.length > 300
        ) {
            throw new Error('Graphs require 1–100 nodes and at most 300 connections.');
        }
        const nodes: readonly ChatGraphNode[] = Object.freeze(
            rawNodes.map((entry: unknown): ChatGraphNode => {
                this.#record(entry);
                const color: ChatGraphColor | undefined = Object.values(ChatGraphColor).find(
                    (candidate: ChatGraphColor): boolean =>
                        candidate === Reflect.get(entry, 'color'),
                );
                if (color === undefined) {
                    throw new Error('Invalid graph node color.');
                }
                return Object.freeze({
                    id: this.#id(Reflect.get(entry, 'id')),
                    label: this.#text(Reflect.get(entry, 'label'), 120, false),
                    description: this.#text(Reflect.get(entry, 'description'), 600, true),
                    color,
                });
            }),
        );
        const nodeIds: ReadonlySet<string> = new Set(
            nodes.map((node: ChatGraphNode): string => node.id),
        );
        if (nodeIds.size !== nodes.length) {
            throw new Error('Duplicate graph node id.');
        }
        const edges: readonly ChatGraphEdge[] = Object.freeze(
            rawEdges.map((entry: unknown): ChatGraphEdge => {
                this.#record(entry);
                const from: string = this.#id(Reflect.get(entry, 'from'));
                const to: string = this.#id(Reflect.get(entry, 'to'));
                if (!nodeIds.has(from) || !nodeIds.has(to)) {
                    throw new Error('Graph connection references a missing node.');
                }
                return Object.freeze({
                    id: this.#id(Reflect.get(entry, 'id')),
                    from,
                    to,
                    label: this.#text(Reflect.get(entry, 'label'), 120, true),
                });
            }),
        );
        if (new Set(edges.map((edge: ChatGraphEdge): string => edge.id)).size !== edges.length) {
            throw new Error('Duplicate graph connection id.');
        }
        const graph: ChatGraph = Object.freeze({ id, title, description, nodes, edges });
        if (JSON.stringify(graph).length > 100_000) {
            throw new Error('Graph exceeds the 100000 character limit.');
        }
        return graph;
    }
    static #record(raw: unknown): asserts raw is Readonly<Record<string, unknown>> {
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new Error('Invalid graph record.');
        }
    }
    static #text(raw: unknown, limit: number, empty: boolean): string {
        if (typeof raw !== 'string' || raw.length > limit || (!empty && raw.trim().length === 0)) {
            throw new Error(`Invalid graph text; maximum ${limit} characters.`);
        }
        return raw;
    }
    static #id(raw: unknown): string {
        const value: string = this.#text(raw, 80, false);
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/u.test(value)) {
            throw new Error('Graph ids use letters, digits, underscores and hyphens.');
        }
        return value;
    }
}
