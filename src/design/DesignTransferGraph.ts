// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignKind, type DesignNode } from './DesignTypes.js';
import type { DesignSelectionContext } from './DesignSelectionContext.js';

/** Selected forests and reusable dependencies are indexed once, preserving variant topology. */
export class DesignTransferGraph {
    /** Authored layers in the selected forest. */
    public readonly content: ReadonlySet<string>;
    /** Additional reusable definitions, including complete sets for referenced variants. */
    public readonly dependencies: ReadonlySet<string>;
    /** Topmost imported definition roots. */
    public readonly dependencyRoots: readonly string[];
    readonly #reusable: Set<string> = new Set();
    /** The source context has already checked page ownership and selected ancestry. */
    public constructor(public readonly context: DesignSelectionContext) {
        const content: Set<string> = new Set();
        for (const root of context.roots) {
            this.#collect(root.id, content);
        }
        this.content = content;
        for (const id of content) {
            const node: DesignNode = context.node(id);
            if (
                node.kind === DesignKind.Component &&
                (node.variant === undefined || content.has(node.parentId ?? ''))
            ) {
                this.#collect(id, this.#reusable);
            }
        }
        const dependencies: Set<string> = new Set();
        const pending: string[] = [...content];
        for (let index: number = 0; index < pending.length; index++) {
            const node: DesignNode = context.node(pending[index] ?? '');
            if (
                node.componentId === null ||
                this.#reusable.has(node.componentId) ||
                dependencies.has(node.componentId)
            ) {
                continue;
            }
            const component: DesignNode = context.node(node.componentId);
            const parent: DesignNode | undefined = context.nodes.get(component.parentId ?? '');
            const root: string =
                parent?.kind === DesignKind.ComponentSet ? parent.id : component.id;
            const added: Set<string> = new Set();
            this.#collect(root, added);
            for (const id of added) {
                if (!dependencies.has(id)) {
                    dependencies.add(id);
                    pending.push(id);
                }
            }
        }
        this.dependencies = dependencies;
        this.dependencyRoots = [...dependencies].filter(
            (id: string): boolean => !dependencies.has(context.node(id).parentId ?? ''),
        );
    }
    /** References choose selected definitions when their entire reusable topology was copied. */
    public reference(
        id: string,
        content: ReadonlyMap<string, string>,
        dependencies: ReadonlyMap<string, string>,
    ): string {
        const mapped: string | undefined = this.#reusable.has(id)
            ? content.get(id)
            : dependencies.get(id);
        if (mapped === undefined) {
            throw new Error('Missing copied component dependency: ' + id);
        }
        return mapped;
    }
    #collect(root: string, destination: Set<string>): void {
        const stack: string[] = [root];
        while (stack.length > 0) {
            const id: string | undefined = stack.pop();
            if (id === undefined || destination.has(id)) {
                continue;
            }
            destination.add(id);
            stack.push(...this.context.node(id).children.toReversed());
        }
    }
}
