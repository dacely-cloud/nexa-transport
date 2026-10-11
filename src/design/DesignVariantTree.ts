// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignKind, type DesignNode } from './DesignTypes.js';
import { DesignVariants } from './DesignVariants.js';

/** Cross-record invariants are checked once after an entire atomic transaction. */
export class DesignVariantTree {
    /** Sets retain their child identities and one complete, unique tuple per definition. */
    public static validate(nodes: ReadonlyMap<string, DesignNode>): void {
        for (const node of nodes.values()) {
            const parent: DesignNode | undefined = nodes.get(node.parentId ?? '');
            if (node.variant !== undefined && parent?.kind !== DesignKind.ComponentSet) {
                throw new Error('Variant values require an immediate component-set parent.');
            }
            if (node.kind !== DesignKind.ComponentSet) {
                continue;
            }
            if (
                node.variants === undefined ||
                node.children.length === 0 ||
                node.children.length > 128
            ) {
                throw new Error('A component set requires 1 to 128 editable variants.');
            }
            if (
                node.variants.defaultId === null ||
                !node.children.includes(node.variants.defaultId)
            ) {
                throw new Error(
                    'Choose an immediate variant as the default before removing or moving it.',
                );
            }
            let ancestor: DesignNode | undefined = parent;
            while (ancestor !== undefined) {
                if (ancestor.kind === DesignKind.Component) {
                    throw new Error(
                        'Component sets belong outside reusable component definitions.',
                    );
                }
                ancestor = nodes.get(ancestor.parentId ?? '');
            }
            const keys: Set<string> = new Set();
            for (const id of node.children) {
                const component: DesignNode | undefined = nodes.get(id);
                if (component?.kind !== DesignKind.Component || component.variant === undefined) {
                    throw new Error('Component sets accept only variant component definitions.');
                }
                if (
                    component.variant.length !== node.variants.properties.length ||
                    component.variant.some(
                        (value): boolean => !node.variants?.properties.includes(value.property),
                    )
                ) {
                    throw new Error(
                        'Variant values must match every property of their component set.',
                    );
                }
                const key: string = DesignVariants.key(component.variant);
                if (keys.has(key)) {
                    throw new Error('Variant property combinations must be unique.');
                }
                keys.add(key);
            }
        }
    }
}
