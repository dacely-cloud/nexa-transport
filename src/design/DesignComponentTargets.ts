// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignKind, type DesignNode } from './DesignTypes.js';

/** Override scope follows both authored children and nested component references. */
export class DesignComponentTargets {
    /** A visited set bounds traversal even before the document's cycle check has run. */
    public static ids(
        nodes: ReadonlyMap<string, DesignNode>,
        componentId: string,
    ): ReadonlySet<string> {
        const selected: Set<string> = new Set();
        const pending: string[] = [componentId];
        while (pending.length > 0) {
            const id: string | undefined = pending.pop();
            if (id === undefined || selected.has(id)) {
                continue;
            }
            const node: DesignNode | undefined = nodes.get(id);
            if (node === undefined) {
                throw new Error('Component layer is missing.');
            }
            selected.add(id);
            pending.push(...node.children.toReversed());
            if (node.kind === DesignKind.Instance && node.componentId !== null) {
                pending.push(node.componentId);
            }
        }
        return selected;
    }
}
