// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxVector3 } from './RobloxSceneTypes';
import { RobloxSceneCodec } from './RobloxSceneCodec';

/** A held native Workspace.GlobalWind observation, relative to this scene's clock. */
export interface RobloxWindSample {
    readonly at: number;
    readonly value: RobloxVector3;
}
/** Environment observations remain separate from imported instance properties. */
export interface RobloxEnvironmentState {
    readonly wind: readonly RobloxWindSample[];
}

/** Validates and samples bounded native environment data without replaying earlier frames. */
export class RobloxEnvironment {
    static readonly #calm: RobloxVector3 = Object.freeze({ kind: 'Vector3', x: 0, y: 0, z: 0 });

    /** Normalizes an optional environment at the scene trust boundary. */
    public static decode(raw: unknown, duration: number): RobloxEnvironmentState | undefined {
        if (raw === undefined) {
            return undefined;
        }
        const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, ['wind']);
        const wind: unknown = fields['wind'];
        if (!Array.isArray(wind) || wind.length < 1 || wind.length > 4096) {
            throw new Error('Environment wind requires 1..4096 observations');
        }
        let previous: number = -1;
        const samples: RobloxWindSample[] = wind.map(
            (item: unknown, index: number): RobloxWindSample => {
                const sample: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(item, [
                    'at',
                    'value',
                ]);
                const at: number = RobloxSceneCodec.number(sample['at'], 0, duration);
                if ((index === 0 && at !== 0) || at <= previous) {
                    throw new Error(
                        'Environment wind must start at zero and use strictly increasing times',
                    );
                }
                previous = at;
                const value: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
                    sample['value'],
                    ['kind', 'x', 'y', 'z'],
                );
                if (value['kind'] !== 'Vector3') {
                    throw new Error('Environment wind must be a Vector3');
                }
                return Object.freeze({
                    at,
                    value: Object.freeze({
                        kind: 'Vector3',
                        x: RobloxSceneCodec.number(value['x'], -100000, 100000),
                        y: RobloxSceneCodec.number(value['y'], -100000, 100000),
                        z: RobloxSceneCodec.number(value['z'], -100000, 100000),
                    }),
                });
            },
        );
        return Object.freeze({ wind: Object.freeze(samples) });
    }

    /** Looks up the current held world-space wind; scenes without metadata remain calm. */
    public static wind(scene: RobloxScene, time: number): RobloxVector3 {
        const samples: readonly RobloxWindSample[] | undefined = scene.environment?.wind;
        if (samples === undefined) {
            return this.#calm;
        }
        let low: number = 0;
        let high: number = samples.length;
        while (low < high) {
            const middle: number = (low + high) >>> 1;
            if ((samples[middle]?.at ?? Infinity) <= time) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return samples[Math.max(0, low - 1)]?.value ?? this.#calm;
    }
}
