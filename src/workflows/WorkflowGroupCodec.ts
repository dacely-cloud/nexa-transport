// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { PortDirection } from './ComponentTypes.js';
import { WorkflowInput } from './WorkflowInput.js';
import type { WorkflowGroup, WorkflowGroupPort } from './WorkflowGroupTypes.js';

/** Portable hierarchy validation never changes executable edges or grants resource access. */
export class WorkflowGroupCodec {
    /** Rejects extra fields and bounds each immutable group body before storage or import. */
    public static parse(raw: unknown): WorkflowGroup {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'title',
            'objective',
            'parent',
            'x',
            'y',
            'nodes',
            'ports',
        ]);
        const nodes: readonly string[] = WorkflowInput.list(
            value['nodes'],
            10_000,
            (entry: unknown): string => WorkflowInput.id(entry),
        );
        const ports: readonly WorkflowGroupPort[] = WorkflowInput.list(
            value['ports'],
            1000,
            (entry: unknown): WorkflowGroupPort => this.#port(entry),
        );
        WorkflowInput.unique(nodes);
        WorkflowInput.unique(ports.map((port: WorkflowGroupPort): string => port.id));
        WorkflowInput.unique(
            ports.map((port: WorkflowGroupPort): string =>
                JSON.stringify([port.direction, port.endpoint.node, port.endpoint.port]),
            ),
        );
        return Object.freeze({
            id: WorkflowInput.id(value['id']),
            title: WorkflowInput.text(value['title'], 160),
            objective: WorkflowInput.text(value['objective'], 2000, true),
            parent: value['parent'] === null ? null : WorkflowInput.id(value['parent']),
            x: this.#coordinate(value['x']),
            y: this.#coordinate(value['y']),
            nodes,
            ports,
        });
    }
    /** Validates ownership and published aliases against the entire post-edit node identity set. */
    public static validate(groups: readonly WorkflowGroup[], nodeIds: readonly string[]): void {
        if (groups.length > 1000) {
            throw new Error('A workflow can contain at most 1000 groups.');
        }
        WorkflowInput.unique(groups.map((group: WorkflowGroup): string => group.id));
        const nodes: ReadonlySet<string> = new Set(nodeIds);
        const byId: ReadonlyMap<string, WorkflowGroup> = new Map(
            groups.map((group: WorkflowGroup): [string, WorkflowGroup] => [group.id, group]),
        );
        const owners: Map<string, string> = new Map();
        for (const group of groups) {
            if (nodes.has(group.id)) {
                throw new Error('Groups and nodes must have separate identities.');
            }
            for (const id of group.nodes) {
                if (!nodes.has(id)) {
                    throw new Error('A grouped node is unavailable.');
                }
                if (owners.has(id)) {
                    throw new Error('A node cannot belong to more than one group.');
                }
                owners.set(id, group.id);
            }
        }
        const paths: Map<string, readonly string[]> = new Map();
        for (const group of groups) {
            const path: string[] = [];
            let cursor: string | null = group.id;
            while (cursor !== null) {
                if (path.includes(cursor)) {
                    throw new Error('A group cannot contain itself.');
                }
                if (path.length >= 16) {
                    throw new Error('Group nesting cannot exceed 16 levels.');
                }
                const parent: WorkflowGroup | undefined = byId.get(cursor);
                if (parent === undefined) {
                    throw new Error('A group parent is unavailable.');
                }
                path.push(cursor);
                cursor = parent.parent;
            }
            paths.set(group.id, path);
        }
        for (const group of groups) {
            for (const port of group.ports) {
                const owner: string | undefined = owners.get(port.endpoint.node);
                if (owner === undefined || paths.get(owner)?.includes(group.id) !== true) {
                    throw new Error('A published port must refer to a node inside its group.');
                }
            }
        }
    }
    static #port(raw: unknown): WorkflowGroupPort {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'label',
            'direction',
            'endpoint',
        ]);
        const direction: unknown = value['direction'];
        if (direction !== PortDirection.Input && direction !== PortDirection.Output) {
            throw new Error('Invalid published port direction.');
        }
        const endpoint: Readonly<Record<string, unknown>> = WorkflowInput.record(
            value['endpoint'],
            ['node', 'port'],
        );
        return Object.freeze({
            id: WorkflowInput.id(value['id']),
            label: WorkflowInput.text(value['label'], 160),
            direction,
            endpoint: Object.freeze({
                node: WorkflowInput.id(endpoint['node']),
                port: WorkflowInput.id(endpoint['port']),
            }),
        });
    }
    static #coordinate(raw: unknown): number {
        if (typeof raw !== 'number' || !Number.isFinite(raw) || Math.abs(raw) > 1_000_000) {
            throw new Error('Invalid group coordinate.');
        }
        return raw;
    }
}
