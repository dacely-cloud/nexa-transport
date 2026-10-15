// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxSceneEvent, RobloxSceneNode } from './RobloxSceneTypes';

/** Bounds both hardware renderers before allocating seekable ribbon geometry. */
export class RobloxBeamBudget {
    /** Lifetime capacity includes future nodes and recorded segment changes. */
    public static validate(
        nodes: readonly RobloxSceneNode[],
        events: readonly RobloxSceneEvent[],
    ): void {
        let total: number = 0;
        for (const node of nodes) {
            if (node.className !== 'Beam') {
                continue;
            }
            let maximum: number =
                typeof node.properties['Segments'] === 'number' ? node.properties['Segments'] : 0;
            for (const event of events) {
                if (
                    event.kind === 'recording' &&
                    event.nodeId === node.id &&
                    event.property === 'Segments'
                ) {
                    for (const sample of event.samples) {
                        if (typeof sample.value === 'number') {
                            maximum = Math.max(maximum, sample.value);
                        }
                    }
                }
            }
            total += maximum;
        }
        if (total > 8192) {
            throw new Error('Scene exceeds the 8192 lifetime Beam segment budget');
        }
    }
}
