// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignKind, type DesignDocument, type DesignNode } from './DesignTypes.js';
import type { DesignVariantValue } from './DesignVariantTypes.js';

/** Portable variant lookup keeps saved definitions, library previews and instance choices consistent. */
export class DesignVariants {
    /** One set represents its child definitions once in the reusable component library. */
    public static library(document: DesignDocument): readonly DesignNode[] {
        const sets: ReadonlySet<string> = new Set(
            document.nodes
                .filter((node: DesignNode): boolean => node.kind === DesignKind.ComponentSet)
                .map((node: DesignNode): string => node.id),
        );
        return document.nodes.filter(
            (node: DesignNode): boolean =>
                node.kind === DesignKind.ComponentSet ||
                (node.kind === DesignKind.Component && !sets.has(node.parentId ?? '')),
        );
    }
    /** A linked instance stores the chosen child definition, never a mutable set reference. */
    public static definition(nodes: ReadonlyMap<string, DesignNode>, id: string): DesignNode {
        const source: DesignNode | undefined = nodes.get(id);
        const definition: DesignNode | undefined =
            source?.kind === DesignKind.ComponentSet
                ? nodes.get(source.variants?.defaultId ?? '')
                : source;
        if (definition?.kind !== DesignKind.Component) {
            throw new Error('Choose a component definition or a set with a default variant.');
        }
        return definition;
    }
    /** The source hierarchy identifies a variant set without storing another reference on each instance. */
    public static parent(
        nodes: ReadonlyMap<string, DesignNode>,
        component: DesignNode,
    ): DesignNode | null {
        const parent: DesignNode | undefined = nodes.get(component.parentId ?? '');
        return parent?.kind === DesignKind.ComponentSet ? parent : null;
    }
    /** Canonical keys are insensitive to the incidental ordering of supplied dimension records. */
    public static key(values: readonly DesignVariantValue[]): string {
        return JSON.stringify(
            values.toSorted((a: DesignVariantValue, b: DesignVariantValue): number =>
                a.property < b.property ? -1 : a.property > b.property ? 1 : 0,
            ),
        );
    }
    /** Definition rows display the authored values in property order. */
    public static label(
        component: DesignNode,
        properties: readonly string[] = component.variant?.map(
            (entry: DesignVariantValue): string => entry.property,
        ) ?? [],
    ): string {
        if (component.variant === undefined) {
            return component.name;
        }
        const values: ReadonlyMap<string, string> = new Map(
            component.variant.map((entry: DesignVariantValue): readonly [string, string] => [
                entry.property,
                entry.value,
            ]),
        );
        return properties.map((property: string): string => values.get(property) ?? '').join(' / ');
    }
    /** The set's child ordering also controls option ordering, without a duplicated value registry. */
    public static options(
        nodes: ReadonlyMap<string, DesignNode>,
        set: DesignNode,
        property: string,
    ): readonly string[] {
        const values: Set<string> = new Set();
        for (const id of set.children) {
            const value: string | undefined = nodes
                .get(id)
                ?.variant?.find(
                    (entry: DesignVariantValue): boolean => entry.property === property,
                )?.value;
            if (value !== undefined) {
                values.add(value);
            }
        }
        return [...values];
    }
    /** Partial property choices retain every other dimension and never guess a missing combination. */
    public static match(
        nodes: ReadonlyMap<string, DesignNode>,
        component: DesignNode,
        changes: readonly DesignVariantValue[],
    ): DesignNode | null {
        const set: DesignNode | null = this.parent(nodes, component);
        if (set?.variants === undefined || component.variant === undefined) {
            throw new Error('Choose an instance from a component set.');
        }
        const values: Map<string, string> = new Map(
            component.variant.map((entry: DesignVariantValue): readonly [string, string] => [
                entry.property,
                entry.value,
            ]),
        );
        for (const change of changes) {
            if (!set.variants.properties.includes(change.property)) {
                throw new Error(
                    'Variant property is not in this component set: ' + change.property,
                );
            }
            values.set(change.property, change.value);
        }
        for (const id of set.children) {
            const candidate: DesignNode | undefined = nodes.get(id);
            if (
                candidate?.variant !== undefined &&
                candidate.variant.every(
                    (entry: DesignVariantValue): boolean =>
                        values.get(entry.property) === entry.value,
                )
            ) {
                return candidate;
            }
        }
        return null;
    }
    /** Copies produce distinct tuples while retaining every additional dimension. */
    public static copyValues(
        values: readonly DesignVariantValue[],
        used: ReadonlySet<string>,
    ): readonly DesignVariantValue[] {
        const first: DesignVariantValue | undefined = values[0];
        if (first === undefined) {
            throw new Error('Variant values are missing.');
        }
        for (let index: number = 1; index <= used.size + 1; index++) {
            const suffix: string = index === 1 ? ' copy' : ' copy ' + String(index);
            const copy: readonly DesignVariantValue[] = [
                {
                    ...first,
                    value:
                        first.value
                            .slice(0, 80 - suffix.length)
                            .toWellFormed()
                            .trimEnd() + suffix,
                },
                ...values.slice(1),
            ];
            if (!used.has(this.key(copy))) {
                return copy;
            }
        }
        throw new Error('Cannot allocate distinct variant values.');
    }
}
