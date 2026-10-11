// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignComponentAction as Action,
    type DesignVariantCommand,
    type DesignComponentCombineVariants,
    type DesignComponentAddVariant,
    type DesignComponentVariantProperties,
} from './DesignComponentTypes.js';
import { DesignKind, DesignFlow, type DesignDocument, type DesignNode } from './DesignTypes.js';
import { DesignOperationKind as Op, type DesignOperation } from './DesignOperationTypes.js';
import type { DesignVariantValue } from './DesignVariantTypes.js';
import type {
    DesignSelectionPlan,
    DesignSelectionGeometry,
    DesignSelectionBounds,
} from './DesignSelectionTypes.js';
import { DesignSelectionContext as Context } from './DesignSelectionContext.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';
import { DesignVariants } from './DesignVariants.js';
import { DesignComponentSwap } from './DesignComponentSwap.js';
import { DesignVariantGeometry } from './DesignVariantGeometry.js';

/** Atomic variant authoring shares geometry and override handling across native and browser runtimes. */
export class DesignVariantEdits {
    /** Plans one typed command; final document validation rejects collisions without partial writes. */
    public static plan(
        document: DesignDocument,
        pageId: string,
        command: DesignVariantCommand,
        identify: (sourceId: string) => string,
    ): DesignSelectionPlan {
        if (command.action === Action.CombineVariants) {
            return this.#combine(
                new Context(document, pageId, command.selection),
                command,
                identify,
            );
        }
        const id: string =
            command.action === Action.SetVariant
                ? command.instanceId
                : command.action === Action.EditVariant
                  ? command.componentId
                  : command.componentSetId;
        const context: Context = new Context(document, pageId, [id]);
        const node: DesignNode = context.node(id);
        if (command.action === Action.SetVariant) {
            if (node.kind !== DesignKind.Instance || node.componentId === null) {
                throw new Error('Choose a linked instance to change its variant.');
            }
            const next: DesignNode | null = DesignVariants.match(
                context.nodes,
                context.node(node.componentId),
                command.values,
            );
            if (next === null) {
                throw new Error('This variant property combination is unavailable.');
            }
            return {
                operations: [
                    {
                        op: Op.Update,
                        id,
                        changes: {
                            componentId: next.id,
                            overrides: DesignComponentSwap.overrides(
                                context.nodes,
                                node.componentId,
                                next.id,
                                node.overrides,
                            ),
                        },
                    },
                ],
                selection: [id],
            };
        }
        if (command.action === Action.EditVariant) {
            if (
                node.kind !== DesignKind.Component ||
                DesignVariants.parent(context.nodes, node) === null
            ) {
                throw new Error('Choose a variant component definition.');
            }
            return {
                operations: [
                    {
                        op: Op.Update,
                        id,
                        changes: { variant: command.values, name: this.#name(command.values) },
                    },
                ],
                selection: [id],
            };
        }
        if (node.kind !== DesignKind.ComponentSet || node.variants === undefined) {
            throw new Error('Choose a component set.');
        }
        if (command.action === Action.AddVariant) {
            return this.#add(context, node, command, identify);
        }
        if (command.action === Action.VariantProperties) {
            return this.#properties(context, node, command);
        }
        if (node.children.some((child: string): boolean => context.node(child).locked)) {
            throw new Error('Unlock the variant definitions before releasing their set.');
        }
        return {
            operations: [
                { op: Op.Update, id, changes: { kind: DesignKind.Group, variants: null } },
                ...node.children.map((child: string): DesignOperation => ({
                    op: Op.Update,
                    id: child,
                    changes: { variant: null },
                })),
            ],
            selection: [id],
        };
    }

    static #combine(
        context: Context,
        command: DesignComponentCombineVariants,
        identify: (sourceId: string) => string,
    ): DesignSelectionPlan {
        if (
            context.roots.length < 2 ||
            context.roots.some(
                (node: DesignNode): boolean =>
                    node.kind !== DesignKind.Component || node.variant !== undefined,
            )
        ) {
            throw new Error('Choose at least two standalone component definitions to combine.');
        }
        const id: string = identify('component-set');
        const grouped: DesignSelectionPlan = DesignSelectionTree.group(context, id);
        const used: Set<string> = new Set();
        const values: Map<string, readonly DesignVariantValue[]> = new Map();
        for (const component of context.roots) {
            let tuple: readonly DesignVariantValue[] = [
                {
                    property: command.property,
                    value: component.name.slice(0, 80).toWellFormed().trim() || 'Default',
                },
            ];
            if (used.has(DesignVariants.key(tuple))) {
                tuple = DesignVariants.copyValues(tuple, used);
            }
            used.add(DesignVariants.key(tuple));
            values.set(component.id, tuple);
        }
        const first: DesignNode | undefined = context.roots[0];
        if (first === undefined) {
            throw new Error('Choose component definitions.');
        }
        return {
            operations: grouped.operations.map((operation: DesignOperation): DesignOperation => {
                if (operation.op === Op.Insert && operation.node.id === id) {
                    return {
                        ...operation,
                        node: {
                            ...operation.node,
                            name: command.name,
                            kind: DesignKind.ComponentSet,
                            variants: { properties: [command.property], defaultId: first.id },
                        },
                    };
                }
                if (operation.op === Op.Update) {
                    const variant: readonly DesignVariantValue[] | undefined = values.get(
                        operation.id,
                    );
                    if (variant !== undefined) {
                        return { ...operation, changes: { ...operation.changes, variant } };
                    }
                }
                return operation;
            }),
            selection: [id],
        };
    }

    static #add(
        context: Context,
        set: DesignNode,
        command: DesignComponentAddVariant,
        identify: (sourceId: string) => string,
    ): DesignSelectionPlan {
        if (set.children.length >= 128) {
            throw new Error('A component set supports at most 128 variants.');
        }
        const sourceId: string | null = command.componentId ?? set.variants?.defaultId ?? null;
        if (sourceId === null || !set.children.includes(sourceId)) {
            throw new Error('Copy an immediate variant from this component set.');
        }
        const sourceContext: Context = new Context(context.document, context.pageId, [sourceId]);
        const copy: DesignSelectionPlan = DesignSelectionTree.duplicate(sourceContext, identify);
        if (set.layout.flow !== DesignFlow.Absolute) {
            return copy;
        }
        const source: DesignSelectionGeometry = context.local(context.box(sourceId), set.id);
        const sourceBounds: DesignSelectionBounds = Context.bounds(source);
        const bounds: readonly DesignSelectionBounds[] = set.children.map(
            (id: string): DesignSelectionBounds =>
                Context.bounds(context.local(context.box(id), set.id)),
        );
        const right: number = Math.max(
            ...bounds.map((box: DesignSelectionBounds): number => box.right),
        );
        const delta: number = right + 24 - sourceBounds.left;
        const copyId: string | undefined = copy.selection[0];
        const geometry: DesignSelectionGeometry = context.local(context.box(set.id), set.parentId);
        const width: number = Math.max(geometry.width, sourceBounds.right + delta);
        const height: number = Math.max(geometry.height, sourceBounds.bottom);
        const dx: number = (width - geometry.width) / 2;
        const dy: number = (height - geometry.height) / 2;
        const angle: number = (geometry.rotation * Math.PI) / 180;
        const x: number = geometry.x + (Math.cos(angle) - 1) * dx - Math.sin(angle) * dy;
        const y: number = geometry.y + Math.sin(angle) * dx + (Math.cos(angle) - 1) * dy;
        const positioned: DesignSelectionPlan = {
            operations: [
                ...copy.operations.map((operation: DesignOperation): DesignOperation => {
                    if (operation.op === Op.Insert && operation.node.id === copyId) {
                        return {
                            ...operation,
                            node: {
                                ...operation.node,
                                ...source,
                                x: source.x + delta,
                                placement: DesignSelectionTree.fixed(operation.node, true),
                            },
                        };
                    }
                    return operation;
                }),
                {
                    op: Op.Update,
                    id: set.id,
                    changes: {
                        width,
                        height,
                        x,
                        y,
                        placement: DesignSelectionTree.fixed(set, set.placement.absolute),
                    },
                },
            ],
            selection: copy.selection,
        };
        return DesignVariantGeometry.flowingParent(context, set, sourceId, positioned);
    }

    static #properties(
        context: Context,
        set: DesignNode,
        command: DesignComponentVariantProperties,
    ): DesignSelectionPlan {
        const previous: readonly string[] = set.variants?.properties ?? [];
        if (
            command.properties.some(
                (property): boolean => property.from !== null && !previous.includes(property.from),
            )
        ) {
            throw new Error('Rename or retain an existing variant property.');
        }
        const operations: DesignOperation[] = [
            {
                op: Op.Update,
                id: set.id,
                changes: {
                    variants: {
                        properties: command.properties.map((property): string => property.name),
                        defaultId: set.variants?.defaultId ?? null,
                    },
                },
            },
        ];
        for (const id of set.children) {
            const child: DesignNode = context.node(id);
            if (child.locked) {
                throw new Error('Unlock the variant definitions before editing their properties.');
            }
            const variant: readonly DesignVariantValue[] = command.properties.map(
                (property): DesignVariantValue => ({
                    property: property.name,
                    value:
                        property.from === null
                            ? 'Default'
                            : (child.variant?.find(
                                  (entry: DesignVariantValue): boolean =>
                                      entry.property === property.from,
                              )?.value ?? 'Default'),
                }),
            );
            operations.push({ op: Op.Update, id, changes: { variant, name: this.#name(variant) } });
        }
        return { operations, selection: [set.id] };
    }

    static #name(values: readonly DesignVariantValue[]): string {
        return values
            .map((entry: DesignVariantValue): string => entry.property + '=' + entry.value)
            .join(', ')
            .slice(0, 160)
            .toWellFormed();
    }
}
