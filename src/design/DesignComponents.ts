// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    type DesignDocument,
    type DesignNode,
    type DesignOverride,
    type DesignBox,
    type DesignPage,
} from './DesignTypes.js';
import {
    DesignComponentAction as Action,
    type DesignComponentCommand,
    type DesignComponentRequest,
    type DesignComponentOverrideChanges,
} from './DesignComponentTypes.js';
import { DesignOperationKind as Op, type DesignOperation } from './DesignOperationTypes.js';
import { DesignOperationCodec } from './DesignOperationCodec.js';
import type { DesignSelectionPlan } from './DesignSelectionTypes.js';
import { DesignSelectionContext as Context } from './DesignSelectionContext.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';
import { DesignComponentDetach } from './DesignComponentDetach.js';
import { DesignComponentTargets } from './DesignComponentTargets.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignLayoutEngine } from './DesignLayout.js';
import { DesignNodeCodec } from './DesignNodeCodec.js';
import { DesignValues as V } from './DesignValues.js';

/** Components and instances use the same atomic operation planner in every runtime. */
export class DesignComponents {
    /** Reachable source layers are exposed without materializing or copying rendered instance children. */
    public static targets(document: DesignDocument, componentId: string): readonly DesignNode[] {
        const nodes: ReadonlyMap<string, DesignNode> = new Map(
            document.nodes.map((node: DesignNode): readonly [string, DesignNode] => [
                node.id,
                node,
            ]),
        );
        if (nodes.get(componentId)?.kind !== DesignKind.Component) {
            throw new Error('Choose a component definition.');
        }
        return [...DesignComponentTargets.ids(nodes, componentId)].map((id: string): DesignNode => {
            const node: DesignNode | undefined = nodes.get(id);
            if (node === undefined) {
                throw new Error('Component layer is missing.');
            }
            return node;
        });
    }
    /** Strict command parsing also bounds override values through the normal layer codec. */
    public static command(raw: unknown): DesignComponentCommand {
        const header: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['action', 'selection', 'componentId', 'x', 'y', 'instanceId', 'targetId', 'changes'],
            ['action'],
        );
        const action: Action = V.choice(header['action'], Object.values(Action));
        if (action === Action.Create || action === Action.Detach) {
            const value: Readonly<Record<string, unknown>> = V.record(raw, ['action', 'selection']);
            return {
                action,
                selection: V.list(value['selection'], 128, (id: unknown): string => V.id(id)),
            };
        }
        if (action === Action.Place) {
            const value: Readonly<Record<string, unknown>> = V.record(raw, [
                'action',
                'componentId',
                'x',
                'y',
            ]);
            return {
                action,
                componentId: V.id(value['componentId']),
                x: V.number(value['x']),
                y: V.number(value['y']),
            };
        }
        if (action === Action.Reset) {
            const value: Readonly<Record<string, unknown>> = V.record(raw, [
                'action',
                'instanceId',
                'targetId',
            ]);
            return {
                action,
                instanceId: V.id(value['instanceId']),
                targetId: V.optionalId(value['targetId']),
            };
        }
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'action',
            'instanceId',
            'targetId',
            'changes',
        ]);
        const fields: Readonly<Record<string, unknown>> = V.fields(
            value['changes'],
            ['name', 'text', 'style', 'visible'],
            [],
        );
        if (Object.keys(fields).length === 0) {
            throw new Error('Choose at least one override field.');
        }
        const validated: DesignOverride = DesignNodeCodec.override({
            nodeId: value['targetId'],
            name: null,
            text: null,
            style: null,
            visible: null,
            ...fields,
        });
        const changes: DesignComponentOverrideChanges = {
            ...(Object.hasOwn(fields, 'name') ? { name: validated.name } : {}),
            ...(Object.hasOwn(fields, 'text') ? { text: validated.text } : {}),
            ...(Object.hasOwn(fields, 'style') ? { style: validated.style } : {}),
            ...(Object.hasOwn(fields, 'visible') ? { visible: validated.visible } : {}),
        };
        return {
            action,
            instanceId: V.id(value['instanceId']),
            targetId: V.id(value['targetId']),
            changes,
        };
    }
    /** Native durable commands retain the normal revision and retry identity. */
    public static request(raw: unknown): DesignComponentRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'expectedRevision',
            'commandId',
            'pageId',
            'command',
        ]);
        return {
            id: V.id(value['id']),
            expectedRevision: V.revision(value['expectedRevision']),
            commandId: V.id(value['commandId']),
            pageId: V.id(value['pageId']),
            command: this.command(value['command']),
        };
    }
    /** Creates a standalone instance using the definition's resolved size, without copying its descendants. */
    public static instance(
        document: DesignDocument,
        componentId: string,
        id: string,
        x: number,
        y: number,
    ): DesignNode {
        const nodes: ReadonlyMap<string, DesignNode> = new Map(
            document.nodes.map((node: DesignNode): readonly [string, DesignNode] => [
                node.id,
                node,
            ]),
        );
        const component: DesignNode | undefined = nodes.get(componentId);
        if (component?.kind !== DesignKind.Component) {
            throw new Error('Choose a component definition.');
        }
        let root: DesignNode = component;
        while (root.parentId !== null) {
            const parent: DesignNode | undefined = nodes.get(root.parentId);
            if (parent === undefined) {
                throw new Error('Component parent is missing.');
            }
            root = parent;
        }
        const sourcePage: string | undefined = document.pages.find((page): boolean =>
            page.roots.includes(root.id),
        )?.id;
        if (sourcePage === undefined) {
            throw new Error('Component belongs to no page.');
        }
        const box: DesignBox | undefined = new DesignLayoutEngine(document, sourcePage)
            .solve()
            .boxes.find((candidate: DesignBox): boolean => candidate.id === component.id);
        return {
            ...DesignDefaults.node(V.id(id), DesignKind.Instance, component.name),
            componentId,
            x: V.number(x),
            y: V.number(y),
            width: box?.width ?? component.width,
            height: box?.height ?? component.height,
            rotation: component.rotation,
        };
    }
    /** Generated IDs are random in the browser and deterministic inside native retry-safe transactions. */
    public static plan(
        document: DesignDocument,
        pageId: string,
        input: DesignComponentCommand,
        identify: (sourceId: string) => string,
    ): DesignSelectionPlan {
        const command: DesignComponentCommand = this.command(input);
        const page: DesignPage | undefined = document.pages.find(
            (entry: DesignPage): boolean => entry.id === pageId,
        );
        if (page === undefined) {
            throw new Error('Design page not found.');
        }
        let plan: DesignSelectionPlan;
        if (command.action === Action.Place) {
            const node: DesignNode = this.instance(
                document,
                command.componentId,
                identify('instance'),
                command.x,
                command.y,
            );
            plan = {
                operations: [
                    { op: Op.Insert, node, parentId: null, pageId, index: page.roots.length },
                ],
                selection: [node.id],
            };
        } else if (command.action === Action.Create) {
            const context: Context = new Context(document, pageId, command.selection);
            const node: DesignNode | undefined = context.roots[0];
            if (context.roots.length === 1 && node?.kind === DesignKind.Component) {
                throw new Error('This layer is already a component.');
            }
            if (
                context.roots.length === 1 &&
                node !== undefined &&
                (node.kind === DesignKind.Frame || node.kind === DesignKind.Group)
            ) {
                plan = {
                    operations: [
                        { op: Op.Update, id: node.id, changes: { kind: DesignKind.Component } },
                    ],
                    selection: [node.id],
                };
            } else {
                const grouped: DesignSelectionPlan = DesignSelectionTree.group(
                    context,
                    identify('component'),
                );
                const operations: readonly DesignOperation[] = grouped.operations.map(
                    (operation: DesignOperation): DesignOperation =>
                        operation.op === Op.Insert
                            ? {
                                  ...operation,
                                  node: {
                                      ...operation.node,
                                      kind: DesignKind.Component,
                                      name: 'Component',
                                  },
                              }
                            : operation,
                );
                plan = { operations, selection: grouped.selection };
            }
        } else if (command.action === Action.Detach) {
            plan = DesignComponentDetach.plan(
                new Context(document, pageId, command.selection),
                identify,
            );
        } else {
            const context: Context = new Context(document, pageId, [command.instanceId]);
            const node: DesignNode = context.node(command.instanceId);
            if (node.kind !== DesignKind.Instance || node.componentId === null) {
                throw new Error('Choose a linked instance.');
            }
            const targets: ReadonlySet<string> = DesignComponentTargets.ids(
                context.nodes,
                node.componentId,
            );
            if (command.targetId !== null && !targets.has(command.targetId)) {
                throw new Error('Override target is outside this component.');
            }
            const overrides: DesignOverride[] = node.overrides.filter(
                (entry: DesignOverride): boolean =>
                    command.action === Action.Reset && command.targetId === null
                        ? false
                        : entry.nodeId !== command.targetId,
            );
            if (command.action === Action.Override) {
                const before: DesignOverride | undefined = node.overrides.find(
                    (entry: DesignOverride): boolean => entry.nodeId === command.targetId,
                );
                overrides.push({
                    nodeId: command.targetId,
                    name: before?.name ?? null,
                    text: before?.text ?? null,
                    style: before?.style ?? null,
                    visible: before?.visible ?? null,
                    ...command.changes,
                });
            }
            plan = {
                operations: [{ op: Op.Update, id: node.id, changes: { overrides } }],
                selection: [node.id],
            };
        }
        return {
            operations: DesignOperationCodec.operations(plan.operations),
            selection: plan.selection,
        };
    }
}
