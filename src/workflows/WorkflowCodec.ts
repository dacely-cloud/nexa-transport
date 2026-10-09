// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowGroupCodec } from './WorkflowGroupCodec.js';
import type { WorkflowGroup, WorkflowGroupReference } from './WorkflowGroupTypes.js';
import { WorkflowInput } from './WorkflowInput.js';
import { WorkflowJson } from './WorkflowJson.js';
import { ResourceBindingCodec } from './ResourceBindingCodec.js';
import { WorkflowEdgeKind } from './WorkflowTypes.js';
import type {
    WorkflowDetails,
    WorkflowNode,
    WorkflowPosition,
    WorkflowEdge,
    WorkflowEndpoint,
    WorkflowPatch,
    WorkflowManifest,
    WorkflowNodeReference,
    WorkflowEdgeReference,
} from './WorkflowTypes.js';
import type { ResourceBinding } from './ResourceTypes.js';

/** Syntax validation permits incomplete drafts; publishing requires graph/permission validation. */
export class WorkflowCodec {
    /** Compact metadata is safe to load without node payloads. */
    public static details(raw: unknown): WorkflowDetails {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'name',
            'description',
            'tags',
            'folder',
        ]);
        const tags: readonly string[] = WorkflowInput.list(
            value['tags'],
            32,
            (entry: unknown): string => WorkflowInput.text(entry, 64),
        );
        WorkflowInput.unique(tags);
        return Object.freeze({
            name: WorkflowInput.text(value['name'], 160, false, 'Workflow name'),
            description: WorkflowInput.text(
                value['description'],
                2000,
                true,
                'Workflow description',
            ),
            tags,
            folder:
                value['folder'] === null
                    ? null
                    : WorkflowInput.id(value['folder'], 'Workflow folder ID'),
        });
    }
    /** Typed resource bindings are preserved even when their selection is unresolved. */
    public static node(raw: unknown): WorkflowNode {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'component',
            'componentVersion',
            'label',
            'configuration',
            'resources',
        ]);
        const resources: readonly ResourceBinding[] = WorkflowInput.list(
            value['resources'],
            64,
            (entry: unknown): ResourceBinding => ResourceBindingCodec.parse(entry),
        );
        WorkflowInput.unique(resources.map((entry: ResourceBinding): string => entry.id));
        return Object.freeze({
            id: WorkflowInput.id(value['id'], 'Node ID'),
            component: WorkflowInput.id(value['component'], 'Component ID'),
            componentVersion: WorkflowInput.id(value['componentVersion'], 'Component version'),
            label: WorkflowInput.text(value['label'], 160, false, 'Node label'),
            configuration: WorkflowJson.object(value['configuration']),
            resources,
        });
    }
    /** Finite bounded CSS coordinates are intentional small numbers. */
    public static position(raw: unknown): WorkflowPosition {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'x',
            'y',
        ]);
        const x: unknown = value['x'];
        const y: unknown = value['y'];
        if (
            typeof x !== 'number' ||
            typeof y !== 'number' ||
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            Math.abs(x) > 10_000_000 ||
            Math.abs(y) > 10_000_000
        ) {
            throw new Error('Invalid workflow position');
        }
        return Object.freeze({ id: WorkflowInput.id(value['id']), x, y });
    }
    /** Port existence and compatibility are evaluated against the registry after saving. */
    public static edge(raw: unknown): WorkflowEdge {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'kind',
            'from',
            'to',
        ]);
        const kind: unknown = value['kind'];
        if (
            kind !== WorkflowEdgeKind.Flow &&
            kind !== WorkflowEdgeKind.Data &&
            kind !== WorkflowEdgeKind.Resource
        ) {
            throw new Error('Invalid workflow connection kind');
        }
        return Object.freeze({
            id: WorkflowInput.id(value['id']),
            kind,
            from: this.#endpoint(value['from']),
            to: this.#endpoint(value['to']),
        });
    }
    /** An edit has explicit, nonoverlapping upserts and deletions. */
    public static patch(raw: unknown): WorkflowPatch {
        const source: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const hierarchy: boolean =
            Object.hasOwn(source, 'groups') || Object.hasOwn(source, 'removeGroups');
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'details',
            'nodes',
            'positions',
            'edges',
            'removeNodes',
            'removeEdges',
            ...(hierarchy ? ['groups', 'removeGroups'] : []),
        ]);
        const nodes: readonly WorkflowNode[] = WorkflowInput.list(
            value['nodes'],
            256,
            (entry: unknown): WorkflowNode => this.node(entry),
        );
        const positions: readonly WorkflowPosition[] = WorkflowInput.list(
            value['positions'],
            1000,
            (entry: unknown): WorkflowPosition => this.position(entry),
        );
        const edges: readonly WorkflowEdge[] = WorkflowInput.list(
            value['edges'],
            1000,
            (entry: unknown): WorkflowEdge => this.edge(entry),
        );
        const removeNodes: readonly string[] = WorkflowInput.list(
            value['removeNodes'],
            1000,
            (entry: unknown): string => WorkflowInput.id(entry),
        );
        const removeEdges: readonly string[] = WorkflowInput.list(
            value['removeEdges'],
            1000,
            (entry: unknown): string => WorkflowInput.id(entry),
        );
        WorkflowInput.unique([
            ...nodes.map((node: WorkflowNode): string => node.id),
            ...removeNodes,
        ]);
        WorkflowInput.unique([
            ...positions.map((position: WorkflowPosition): string => position.id),
            ...removeNodes,
        ]);
        WorkflowInput.unique([
            ...edges.map((edge: WorkflowEdge): string => edge.id),
            ...removeEdges,
        ]);
        const groups: readonly WorkflowGroup[] | undefined = hierarchy
            ? WorkflowInput.list(value['groups'], 256, (entry: unknown): WorkflowGroup =>
                  WorkflowGroupCodec.parse(entry),
              )
            : undefined;
        const removeGroups: readonly string[] | undefined = hierarchy
            ? WorkflowInput.list(value['removeGroups'], 1000, (entry: unknown): string =>
                  WorkflowInput.id(entry),
              )
            : undefined;
        if (groups !== undefined && removeGroups !== undefined) {
            WorkflowInput.unique([
                ...groups.map((group: WorkflowGroup): string => group.id),
                ...removeGroups,
            ]);
        }
        return Object.freeze({
            ...(groups === undefined || removeGroups === undefined ? {} : { groups, removeGroups }),
            details: value['details'] === null ? null : this.details(value['details']),
            nodes,
            positions,
            edges,
            removeNodes,
            removeEdges,
        });
    }
    /** Stored manifests have bounded reference arrays and a version gate. */
    public static manifest(raw: unknown): WorkflowManifest {
        const source: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const hierarchy: boolean = Object.hasOwn(source, 'groups');
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'format',
            'workflowId',
            'revision',
            'details',
            'nodes',
            'edges',
            ...(hierarchy ? ['groups'] : []),
        ]);
        if (value['format'] !== 1) {
            throw new Error('Unsupported workflow format');
        }
        const nodes: readonly WorkflowNodeReference[] = WorkflowInput.list(
            value['nodes'],
            10_000,
            (entry: unknown): WorkflowNodeReference => {
                const node: Readonly<Record<string, unknown>> = WorkflowInput.record(entry, [
                    'id',
                    'content',
                    'position',
                ]);
                return Object.freeze({
                    id: WorkflowInput.id(node['id']),
                    content: WorkflowInput.id(node['content']),
                    position: WorkflowInput.id(node['position']),
                });
            },
        );
        const edges: readonly WorkflowEdgeReference[] = WorkflowInput.list(
            value['edges'],
            50_000,
            (entry: unknown): WorkflowEdgeReference => {
                const edge: Readonly<Record<string, unknown>> = WorkflowInput.record(entry, [
                    'id',
                    'content',
                ]);
                return Object.freeze({
                    id: WorkflowInput.id(edge['id']),
                    content: WorkflowInput.id(edge['content']),
                });
            },
        );
        WorkflowInput.unique(nodes.map((node: WorkflowNodeReference): string => node.id));
        WorkflowInput.unique(edges.map((edge: WorkflowEdgeReference): string => edge.id));
        const groups: readonly WorkflowGroupReference[] | undefined = hierarchy
            ? WorkflowInput.list(
                  value['groups'],
                  1000,
                  (entry: unknown): WorkflowGroupReference => {
                      const group: Readonly<Record<string, unknown>> = WorkflowInput.record(entry, [
                          'id',
                          'content',
                      ]);
                      return Object.freeze({
                          id: WorkflowInput.id(group['id']),
                          content: WorkflowInput.id(group['content']),
                      });
                  },
              )
            : undefined;
        if (groups !== undefined) {
            WorkflowInput.unique(groups.map((group: WorkflowGroupReference): string => group.id));
        }
        return Object.freeze({
            ...(groups === undefined ? {} : { groups }),
            format: 1,
            workflowId: WorkflowInput.id(value['workflowId']),
            revision: ResourceBindingCodec.decimal(value['revision']),
            details: this.details(value['details']),
            nodes,
            edges,
        });
    }
    static #endpoint(raw: unknown): WorkflowEndpoint {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'node',
            'port',
        ]);
        return Object.freeze({
            node: WorkflowInput.id(value['node']),
            port: WorkflowInput.id(value['port']),
        });
    }
}
