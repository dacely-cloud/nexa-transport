// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene } from './RobloxSceneTypes';

/** Bounded observation intervals shared by automatic emission and particle motion. */
export class RobloxParticleIntervals {
    /** Recording observations are held exactly; authored tweens are evaluated at 60 Hz. */
    public static boundaries(
        scene: RobloxScene,
        nodeId: string,
        properties: readonly string[],
        trigger: string | null,
    ): readonly number[] {
        const times: Set<number> = new Set([0, scene.duration]);
        for (const event of scene.events) {
            if (
                event.nodeId !== nodeId ||
                event.trigger !== trigger ||
                (event.kind !== 'recording' && event.kind !== 'tween') ||
                !properties.includes(event.property)
            ) {
                continue;
            }
            if (event.kind === 'recording') {
                for (const sample of event.samples) {
                    times.add(sample.at);
                }
            } else {
                for (let step: number = 0; step <= Math.ceil(event.duration * 60); step++) {
                    times.add(
                        Math.min(scene.duration, event.at + Math.min(event.duration, step / 60)),
                    );
                }
            }
        }
        return [...times].sort((a: number, b: number): number => a - b);
    }
}
