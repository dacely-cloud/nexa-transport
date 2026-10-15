// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    RobloxHierarchyDelta,
    RobloxSceneEvent,
    RobloxSceneNode,
    RobloxValue,
} from './RobloxSceneTypes';

/** Validates scoped native links without creating implicit instances or external input targets. */
export class RobloxSceneReferences {
    /** Initial XML only contains initial nodes; later observations may use introduced lifetime nodes. */
    public static validate(
        initial: readonly RobloxSceneNode[],
        hierarchy: readonly RobloxHierarchyDelta[],
        events: readonly RobloxSceneEvent[],
    ): void {
        const introduced: Map<string, number> = new Map<string, number>();
        for (const node of initial) {
            introduced.set(node.id, 0);
        }
        for (const node of initial) {
            this.#properties(node, introduced, 0);
        }
        for (const delta of hierarchy) {
            for (const node of delta.created) {
                introduced.set(node.id, delta.at);
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
                this.#value(sample.value, introduced, sample.at);
            }
        }
    }

    static #properties(
        node: RobloxSceneNode,
        introduced: ReadonlyMap<string, number>,
        at: number,
    ): void {
        for (const value of Object.values(node.properties)) {
            this.#value(value, introduced, at);
        }
    }

    static #value(value: RobloxValue, introduced: ReadonlyMap<string, number>, at: number): void {
        if (typeof value !== 'object' || value.kind !== 'Instance' || value.id === null) {
            return;
        }
        const birth: number | undefined = introduced.get(value.id);
        if (birth === undefined || birth > at) {
            throw new Error('Instance reference targets an unknown or future node: ' + value.id);
        }
    }
}
