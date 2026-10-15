// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import type { RobloxSceneNode, RobloxHierarchyDelta } from './RobloxSceneTypes';

/** A native UV offset at one clock instant; speed integration continues from this anchor. */
export interface RobloxBeamPhaseAnchor {
    readonly at: number;
    readonly offset: number;
}
/** Captured private animation state is distinct from Roblox's serialized property table. */
export interface RobloxBeamPhaseTrack {
    readonly nodeId: string;
    readonly samples: readonly RobloxBeamPhaseAnchor[];
}

/** Validates snapshots, native method resets and phase corrections at texture changes or reattachment. */
export class RobloxBeamPhases {
    /** Native anchors share the complete recording's sample budget and lifetime identity scope. */
    public static decode(
        raw: unknown,
        duration: number,
        nodes: ReadonlyMap<string, RobloxSceneNode>,
        hierarchy: readonly RobloxHierarchyDelta[],
        remaining: number,
    ): readonly RobloxBeamPhaseTrack[] | undefined {
        if (raw === undefined) {
            return undefined;
        }
        const births: Map<string, number> = new Map();
        for (const delta of hierarchy) {
            for (const node of delta.created) {
                births.set(node.id, delta.at);
            }
        }
        const seen: Set<string> = new Set();
        let total: number = 0;
        const tracks: readonly RobloxBeamPhaseTrack[] = RobloxSceneCodec.array(raw, 2048).map(
            (raw: unknown): RobloxBeamPhaseTrack => {
                const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
                    'nodeId',
                    'samples',
                ]);
                const nodeId: string = RobloxSceneCodec.identity(fields['nodeId']);
                if (nodes.get(nodeId)?.className !== 'Beam' || seen.has(nodeId)) {
                    throw new Error('Beam phase must target one unique lifetime Beam');
                }
                seen.add(nodeId);
                let previous: number = -1;
                const samples: readonly RobloxBeamPhaseAnchor[] = RobloxSceneCodec.array(
                    fields['samples'],
                    4096,
                ).map((raw: unknown): RobloxBeamPhaseAnchor => {
                    const sample: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
                        'at',
                        'offset',
                    ]);
                    const at: number = RobloxSceneCodec.number(
                        sample['at'],
                        births.get(nodeId) ?? 0,
                        duration,
                    );
                    if (at <= previous) {
                        throw new Error(
                            'Beam phase anchors must have strictly increasing timestamps',
                        );
                    }
                    previous = at;
                    total++;
                    return Object.freeze({
                        at,
                        offset: RobloxSceneCodec.number(sample['offset'], 0, 1),
                    });
                });
                if (samples.length === 0 || total > remaining) {
                    throw new Error('Beam phase exceeds the complete recorded sample budget');
                }
                return Object.freeze({ nodeId, samples: Object.freeze(samples) });
            },
        );
        return Object.freeze(tracks);
    }
}
