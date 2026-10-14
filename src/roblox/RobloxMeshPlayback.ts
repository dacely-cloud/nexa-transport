// SPDX-License-Identifier: Apache-2.0

import type {
    RobloxScene,
    RobloxSceneNode,
    RobloxSceneEvent,
    RobloxValue,
} from './RobloxSceneTypes';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxSceneRuntime } from './RobloxSceneRuntime';

/** One atomic replacement with a loaded template at the recorded timestamp. */
export interface RobloxMeshPlaybackSample {
    readonly at: number;
    readonly template: string;
}

/** Readonly geometry observations grouped by native instance and activation. */
export interface RobloxMeshPlaybackTrack {
    readonly nodeId: string;
    readonly trigger: string | null;
    readonly samples: readonly RobloxMeshPlaybackSample[];
}

/** Baseline and replacement templates shared by XML export and generated Luau. */
export interface RobloxMeshPlaybackPlan {
    readonly templates: readonly RobloxSceneNode[];
    readonly tracks: readonly RobloxMeshPlaybackTrack[];
}

/** Replays MeshId/MeshSize through ApplyMesh instead of assigning readonly properties. */
export class RobloxMeshPlayback {
    /** Selects readonly observations that belong to one loaded mesh geometry. */
    public static geometry(event: RobloxSceneEvent, node: RobloxSceneNode | undefined): boolean {
        return (
            node?.className === 'MeshPart' &&
            event.kind === 'recording' &&
            (event.property === 'MeshId' || event.property === 'MeshSize')
        );
    }

    /** Combines simultaneous identity/dimension samples and retains the texture at each replacement. */
    public static plan(scene: RobloxScene): RobloxMeshPlaybackPlan {
        const catalog: ReadonlyMap<string, RobloxSceneNode> = RobloxSceneHierarchy.catalog(scene);
        const templates: RobloxSceneNode[] = [...catalog.values()].filter(
            (node: RobloxSceneNode): boolean => node.className === 'MeshPart',
        );
        const groups: Map<string, RobloxSceneEvent[]> = new Map();
        for (const event of scene.events) {
            if (!this.geometry(event, catalog.get(event.nodeId))) {
                continue;
            }
            const key: string = JSON.stringify([event.nodeId, event.trigger]);
            const group: RobloxSceneEvent[] = groups.get(key) ?? [];
            group.push(event);
            groups.set(key, group);
        }
        const tracks: RobloxMeshPlaybackTrack[] = [];
        const identities: Map<string, string> = new Map();
        for (const group of groups.values()) {
            const first: RobloxSceneEvent | undefined = group[0];
            if (first === undefined) {
                throw new Error('Missing mesh playback group');
            }
            const node: RobloxSceneNode | undefined = catalog.get(first.nodeId);
            if (node === undefined) {
                throw new Error('Missing mesh playback node');
            }
            const times: Set<number> = new Set();
            for (const event of group) {
                if (event.kind !== 'recording') {
                    throw new Error('Invalid mesh playback observation');
                }
                for (const sample of event.samples) {
                    times.add(sample.at);
                }
            }
            const samples: RobloxMeshPlaybackSample[] = [];
            for (const at of [...times].sort((a: number, b: number): number => a - b)) {
                const properties: Readonly<Record<string, RobloxValue>> =
                    RobloxSceneRuntime.properties(scene, node.id, at, first.trigger);
                const key: string = JSON.stringify([
                    node.id,
                    properties['MeshId'],
                    properties['MeshSize'],
                    properties['TextureID'],
                ]);
                let template: string | undefined = identities.get(key);
                if (template === undefined) {
                    if (templates.length >= 4096) {
                        throw new Error('Mesh playback exceeds the 4096 template budget');
                    }
                    template = 'variant.' + node.id + '.' + String(templates.length);
                    identities.set(key, template);
                    templates.push({ ...node, id: template, properties });
                }
                samples.push({ at, template });
            }
            tracks.push({ nodeId: node.id, trigger: first.trigger, samples });
        }
        return { templates, tracks };
    }
}
