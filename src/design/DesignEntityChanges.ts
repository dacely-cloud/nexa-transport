// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignEntityChange } from './DesignOperationTypes.js';

interface Identity {
    readonly id: string;
}

/** Canonical entity comparisons are shared by atomic editing and wire deltas. */
export class DesignEntityChanges {
    /** Compares already-validated records with canonical field ordering. */
    public static equal<T>(left: T, right: T): boolean {
        return JSON.stringify(left) === JSON.stringify(right);
    }
    /** Emits before and after images only for added, removed or modified identities. */
    public static diff<T extends Identity>(
        before: readonly T[],
        after: readonly T[],
    ): readonly DesignEntityChange<T>[] {
        const previous: Map<string, T> = new Map(
            before.map((entry: T): [string, T] => [entry.id, entry]),
        );
        const next: Map<string, T> = new Map(
            after.map((entry: T): [string, T] => [entry.id, entry]),
        );
        const output: DesignEntityChange<T>[] = [];
        for (const id of new Set([...previous.keys(), ...next.keys()])) {
            const left: T | null = previous.get(id) ?? null;
            const right: T | null = next.get(id) ?? null;
            if (!this.equal(left, right)) {
                output.push({ id, before: left, after: right });
            }
        }
        return output;
    }
}
