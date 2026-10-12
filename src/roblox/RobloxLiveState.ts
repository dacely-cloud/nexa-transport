// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import type { RobloxScene, RobloxSceneEvent, RobloxSceneNode } from './RobloxSceneTypes';

/** One current native DOM projection and newly observed particle commands. */
export interface RobloxLiveState {
    readonly time: number;
    readonly scene: RobloxScene;
    readonly particleEvents: readonly RobloxSceneEvent[];
    readonly accepted: boolean | null;
}

/** Validates every native live response independently of the running script. */
export class RobloxLiveStateCodec {
    /** Keeps live current values separate from offline animation tracks. */
    public static decode(raw: unknown): RobloxLiveState {
        const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
            'kind',
            'time',
            'scene',
            'particleEvents',
            'accepted',
        ]);
        if (
            fields['kind'] !== 'native-live-state' ||
            (fields['accepted'] !== null && typeof fields['accepted'] !== 'boolean')
        ) {
            throw new Error('Invalid native live state');
        }
        const time: number = RobloxSceneCodec.number(fields['time'], 0, 60);
        const scene: RobloxScene = RobloxSceneCodec.decode(fields['scene']);
        if (scene.events.length !== 0 || (scene.inputs?.length ?? 0) !== 0) {
            throw new Error('Live state must contain current properties, not offline tracks');
        }
        const particles: RobloxScene = RobloxSceneCodec.decode({
            ...scene,
            duration: Math.max(scene.duration, time, 0.01),
            events: fields['particleEvents'],
        });
        const nodes: ReadonlyMap<string, RobloxSceneNode> = new Map(
            scene.nodes.map((node: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                node.id,
                node,
            ]),
        );
        for (const event of particles.events) {
            if (
                (event.kind !== 'burst' && event.kind !== 'clear') ||
                event.at > time + 1e-9 ||
                !nodes.has(event.nodeId)
            ) {
                throw new Error('Invalid live particle command');
            }
        }
        return Object.freeze({
            time,
            scene,
            particleEvents: particles.events,
            accepted: fields['accepted'],
        });
    }
}
