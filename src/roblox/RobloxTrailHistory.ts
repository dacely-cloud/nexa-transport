// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import type { RobloxHierarchyDelta, RobloxSceneNode } from './RobloxSceneTypes';

/** Native cross-section identity survives moving-head replacement and retention clipping. */
export interface RobloxTrailPoint {
    readonly serial: number;
    readonly born: number;
    readonly a: readonly [number, number, number];
    readonly b: readonly [number, number, number];
    readonly travel: number;
    readonly separated: boolean;
}
/** Native history mutation discriminators. */
export const RobloxTrailMutation = { Reset: 'reset', Step: 'step' } as const;
/** One mutation replaces the complete path or advances its head and retention edge. */
export type RobloxTrailMutation = (typeof RobloxTrailMutation)[keyof typeof RobloxTrailMutation];
/** Ordered native observation, independent of serialized instance properties. */
export interface RobloxTrailSample {
    readonly kind: RobloxTrailMutation;
    readonly at: number;
    readonly first: number | null;
    readonly points: readonly RobloxTrailPoint[];
    readonly edge?: RobloxTrailPoint;
}
/** One scoped lifetime Trail can contain negative pre-capture birth times. */
export interface RobloxTrailTrack {
    readonly nodeId: string;
    readonly samples: readonly RobloxTrailSample[];
}

/** Validates incremental paths before any rendering buffers are allocated. */
export class RobloxTrailHistory {
    /** History operations and cross-sections share the complete scene sample budget. */
    public static decode(
        raw: unknown,
        duration: number,
        nodes: ReadonlyMap<string, RobloxSceneNode>,
        hierarchy: readonly RobloxHierarchyDelta[],
        remaining: number,
    ): readonly RobloxTrailTrack[] | undefined {
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
        const tracks: readonly RobloxTrailTrack[] = RobloxSceneCodec.array(raw, 2048).map(
            (raw: unknown): RobloxTrailTrack => {
                const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
                    'nodeId',
                    'samples',
                ]);
                const nodeId: string = RobloxSceneCodec.identity(fields['nodeId']);
                if (nodes.get(nodeId)?.className !== 'Trail' || seen.has(nodeId)) {
                    throw new Error('Trail history must target one unique lifetime Trail');
                }
                seen.add(nodeId);
                let previous: number = -1;
                const path: RobloxTrailPoint[] = [];
                const samples: readonly RobloxTrailSample[] = RobloxSceneCodec.array(
                    fields['samples'],
                    8192,
                ).map((raw: unknown): RobloxTrailSample => {
                    const sample: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
                        raw,
                        ['kind', 'at', 'first', 'points'],
                        ['edge'],
                    );
                    const kind: unknown = sample['kind'];
                    if (kind !== RobloxTrailMutation.Reset && kind !== RobloxTrailMutation.Step) {
                        throw new Error('Unknown Trail history mutation');
                    }
                    if (previous < 0 && kind !== RobloxTrailMutation.Reset) {
                        throw new Error('Trail history must begin with a reset');
                    }
                    const at: number = RobloxSceneCodec.number(
                        sample['at'],
                        births.get(nodeId) ?? 0,
                        duration,
                    );
                    if (at < previous) {
                        throw new Error('Trail history times must be nondecreasing');
                    }
                    previous = at;
                    if (++total > remaining) {
                        throw new Error(
                            'Trail history exceeds the complete recorded sample budget',
                        );
                    }
                    const points: readonly RobloxTrailPoint[] = RobloxSceneCodec.array(
                        sample['points'],
                        kind === RobloxTrailMutation.Reset ? 4096 : 2,
                    ).map((raw: unknown): RobloxTrailPoint => {
                        if (++total > remaining) {
                            throw new Error(
                                'Trail history exceeds the complete recorded sample budget',
                            );
                        }
                        return this.#point(raw, at);
                    });
                    const edge: RobloxTrailPoint | undefined =
                        sample['edge'] === undefined ? undefined : this.#point(sample['edge'], at);
                    if (edge !== undefined && ++total > remaining) {
                        throw new Error(
                            'Trail history exceeds the complete recorded sample budget',
                        );
                    }
                    const first: number | null =
                        sample['first'] === null
                            ? null
                            : RobloxSceneCodec.number(sample['first'], 0, 4294967295, true);
                    this.#apply(path, kind, first, points, edge);
                    return Object.freeze({
                        kind,
                        at,
                        first,
                        points: Object.freeze(points),
                        ...(edge === undefined ? {} : { edge }),
                    });
                });
                if (samples.length === 0) {
                    throw new Error('Trail history must contain an initial observation');
                }
                return Object.freeze({ nodeId, samples: Object.freeze(samples) });
            },
        );
        return Object.freeze(tracks);
    }

    static #point(raw: unknown, at: number): RobloxTrailPoint {
        const point: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
            'serial',
            'born',
            'a',
            'b',
            'travel',
            'separated',
        ]);
        if (typeof point['separated'] !== 'boolean') {
            throw new Error('Trail strip boundary must be boolean');
        }
        return Object.freeze({
            serial: RobloxSceneCodec.number(point['serial'], 0, 4294967295, true),
            born: RobloxSceneCodec.number(point['born'], -60, at),
            a: this.#vector(point['a']),
            b: this.#vector(point['b']),
            travel: RobloxSceneCodec.number(point['travel'], 0, 1e12),
            separated: point['separated'],
        });
    }

    static #vector(raw: unknown): readonly [number, number, number] {
        const values: readonly unknown[] = RobloxSceneCodec.array(raw, 3);
        if (values.length !== 3) {
            throw new Error('Trail world positions require three components');
        }
        const vector: readonly [number, number, number] = [
            RobloxSceneCodec.number(values[0], -1e6, 1e6),
            RobloxSceneCodec.number(values[1], -1e6, 1e6),
            RobloxSceneCodec.number(values[2], -1e6, 1e6),
        ];
        return Object.freeze(vector);
    }

    static #apply(
        path: RobloxTrailPoint[],
        kind: RobloxTrailMutation,
        first: number | null,
        points: readonly RobloxTrailPoint[],
        edge: RobloxTrailPoint | undefined,
    ): void {
        if (kind === RobloxTrailMutation.Reset) {
            path.length = 0;
        }
        for (const point of points) {
            let tail: RobloxTrailPoint | undefined = path.at(-1);
            if (kind === RobloxTrailMutation.Step && tail?.serial === point.serial) {
                if (point.born < tail.born || point.separated !== tail.separated) {
                    throw new Error(
                        'Trail head replacement rewrites its birth order or strip identity',
                    );
                }
                path.pop();
                tail = path.at(-1);
            } else if (
                tail !== undefined &&
                (point.serial <= tail.serial ||
                    (kind === RobloxTrailMutation.Step && point.serial !== tail.serial + 1))
            ) {
                throw new Error('Trail append must introduce the next cross-section identity');
            }
            if (tail !== undefined && (point.born < tail.born || point.travel < tail.travel)) {
                throw new Error('Trail path birth times and travel must be nondecreasing');
            }
            path.push(point);
        }
        if (first === null) {
            if (points.length > 0 || edge !== undefined) {
                throw new Error('Cleared Trail cannot retain updated cross-sections');
            }
            path.length = 0;
        } else {
            const start: number = path.findIndex(
                (point: RobloxTrailPoint): boolean => point.serial === first,
            );
            if (start < 0 || (kind === RobloxTrailMutation.Reset && start !== 0)) {
                throw new Error('Trail retention boundary must target a current cross-section');
            }
            path.splice(0, start);
        }
        if (edge !== undefined) {
            const previous: RobloxTrailPoint | undefined = path[0];
            const next: RobloxTrailPoint | undefined = path[1];
            if (
                kind === RobloxTrailMutation.Reset ||
                previous === undefined ||
                next === undefined ||
                edge.serial !== first ||
                edge.separated !== previous.separated ||
                next.separated ||
                edge.born < previous.born ||
                edge.born > next.born ||
                edge.travel < previous.travel ||
                edge.travel > next.travel
            ) {
                throw new Error('Trail clipping must advance the current retention edge');
            }
            path[0] = edge;
        }
        if (path.length > 4096) {
            throw new Error('Trail history exceeds 4096 retained cross-sections');
        }
    }
}
