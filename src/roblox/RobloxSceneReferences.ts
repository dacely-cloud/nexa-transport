// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    RobloxHierarchyDelta,
    RobloxSceneEvent,
    RobloxSceneNode,
    RobloxValue,
} from './RobloxSceneTypes';
import { RobloxSceneSchema, type RobloxPropertySpec } from './RobloxSceneSchema';

interface ScopedNode {
    readonly node: RobloxSceneNode;
    readonly at: number;
}

/** Validates scoped native links without creating implicit instances or external input targets. */
export class RobloxSceneReferences {
    /** Initial XML only contains initial nodes; later observations may use introduced lifetime nodes. */
    public static validate(
        initial: readonly RobloxSceneNode[],
        hierarchy: readonly RobloxHierarchyDelta[],
        events: readonly RobloxSceneEvent[],
    ): void {
        const introduced: Map<string, ScopedNode> = new Map<string, ScopedNode>();
        for (const node of initial) {
            introduced.set(node.id, { node, at: 0 });
        }
        for (const node of initial) {
            this.#properties(node, introduced, 0);
        }
        for (const delta of hierarchy) {
            for (const node of delta.created) {
                introduced.set(node.id, { node, at: delta.at });
            }
            for (const node of delta.created) {
                this.#properties(node, introduced, delta.at);
            }
        }
        for (const event of events) {
            if (event.kind !== 'recording') {
                continue;
            }
            for (const sample of event.samples) {
                const node: RobloxSceneNode | undefined = introduced.get(event.nodeId)?.node;
                if (node === undefined) {
                    throw new Error('Missing reference owner');
                }
                this.#value(
                    sample.value,
                    introduced,
                    sample.at,
                    RobloxSceneSchema[node.className][event.property],
                );
            }
        }
    }

    static #properties(
        node: RobloxSceneNode,
        introduced: ReadonlyMap<string, ScopedNode>,
        at: number,
    ): void {
        for (const [property, value] of Object.entries(node.properties)) {
            this.#value(value, introduced, at, RobloxSceneSchema[node.className][property]);
        }
    }

    static #value(
        value: RobloxValue,
        introduced: ReadonlyMap<string, ScopedNode>,
        at: number,
        spec: RobloxPropertySpec | undefined,
    ): void {
        if (typeof value !== 'object' || value.kind !== 'Instance' || value.id === null) {
            return;
        }
        const target: ScopedNode | undefined = introduced.get(value.id);
        if (target === undefined || target.at > at) {
            throw new Error('Instance reference targets an unknown or future node: ' + value.id);
        }
        if (
            spec?.referenceClasses !== undefined &&
            !spec.referenceClasses.includes(target.node.className)
        ) {
            throw new Error(
                'Instance reference targets an incompatible class: ' + target.node.className,
            );
        }
    }
}
