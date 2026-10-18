// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import { RobloxSceneSchema, RobloxValues } from './RobloxSceneSchema';
import { RobloxProperties } from './RobloxSceneRuntime';
import type { RobloxColor3, RobloxScene, RobloxValue, RobloxVector3 } from './RobloxSceneTypes';
import type { RobloxSurfaceResponse } from './RobloxSurfaceMaterial';

/** Held native Lighting service values, relative to the recording clock. */
export interface RobloxLightingSample {
    readonly at: number;
    readonly value: Readonly<Record<string, RobloxValue>>;
}

/** Shared outdoor illumination controls; occlusion and Studio's sky convolution need calibration. */
export interface RobloxLightingFrame {
    readonly direction: RobloxVector3;
    readonly sky: RobloxColor3;
    readonly ground: RobloxColor3;
    readonly sun: RobloxColor3;
    readonly brightness: number;
    readonly exposure: number;
    readonly specular: number;
    readonly shadows: boolean;
}

/** Seekable illumination replaces fixed viewer lights with authored, validated native settings. */
export class RobloxLighting {
    static readonly #defaults: Readonly<Record<string, RobloxValue>> = Object.freeze(
        Object.fromEntries(
            Object.entries(RobloxSceneSchema.Lighting).map(
                ([key, spec]): readonly [string, RobloxValue] => [key, spec.default],
            ),
        ),
    );

    /** Reject unknown properties, accessors, non-finite controls and oversized timelines. */
    public static decode(raw: unknown, duration: number): readonly RobloxLightingSample[] {
        if (Array.isArray(raw) && raw.length === 0) {
            throw new Error('Lighting requires at least one observation');
        }
        let previous: number = -1;
        return Object.freeze(
            RobloxSceneCodec.array(raw, 4096).map(
                (item: unknown, index: number): RobloxLightingSample => {
                    const sample: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
                        item,
                        ['at', 'value'],
                    );
                    const at: number = RobloxSceneCodec.number(sample['at'], 0, duration);
                    if ((index === 0 && at !== 0) || at <= previous) {
                        throw new Error(
                            'Lighting observations must start at zero with increasing times',
                        );
                    }
                    previous = at;
                    const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
                        sample['value'],
                        Object.keys(RobloxSceneSchema.Lighting),
                    );
                    const value: Record<string, RobloxValue> = {};
                    for (const [key, spec] of Object.entries(RobloxSceneSchema.Lighting)) {
                        value[key] = RobloxSceneCodec.value(fields[key], spec);
                    }
                    return Object.freeze({ at, value: Object.freeze(value) });
                },
            ),
        );
    }

    /** Held sampling works identically for first render, reverse seeks and retained live sessions. */
    public static properties(
        scene: RobloxScene,
        time: number,
    ): Readonly<Record<string, RobloxValue>> {
        const samples: readonly RobloxLightingSample[] | undefined = scene.environment?.lighting;
        if (samples === undefined) {
            return this.#defaults;
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
        return samples[Math.max(0, low - 1)]?.value ?? this.#defaults;
    }

    /** Uses a stable equinoctial sun path; exact Roblox sky/astronomical matching remains explicit. */
    public static sample(scene: RobloxScene, time: number): RobloxLightingFrame {
        const values: Readonly<Record<string, RobloxValue>> = this.properties(scene, time);
        const hour: number = ((RobloxProperties.number(values, 'ClockTime') - 12) * Math.PI) / 12;
        const latitude: number =
            (RobloxProperties.number(values, 'GeographicLatitude') * Math.PI) / 180;
        const direction: RobloxVector3 = RobloxValues.vector3(
            -Math.sin(hour),
            Math.cos(hour) * Math.cos(latitude),
            -Math.cos(hour) * Math.sin(latitude),
        );
        const ambient: RobloxColor3 = RobloxProperties.color(values, 'Ambient');
        const outdoor: RobloxColor3 = RobloxProperties.color(values, 'OutdoorAmbient');
        const top: RobloxColor3 = RobloxProperties.color(values, 'ColorShift_Top');
        const bottom: RobloxColor3 = RobloxProperties.color(values, 'ColorShift_Bottom');
        const diffuse: number =
            RobloxProperties.number(values, 'EnvironmentDiffuseScale') *
            Math.max(0, direction.y) *
            0.25;
        const base: RobloxColor3 =
            values['GlobalShadows'] === false
                ? ambient
                : RobloxValues.color(
                      Math.max(ambient.r, outdoor.r),
                      Math.max(ambient.g, outdoor.g),
                      Math.max(ambient.b, outdoor.b),
                  );
        return {
            direction,
            sky: RobloxValues.color(base.r + diffuse, base.g + diffuse, base.b + diffuse),
            ground: RobloxValues.color(
                ambient.r + bottom.r,
                ambient.g + bottom.g,
                ambient.b + bottom.b,
            ),
            sun: RobloxValues.color(1 + top.r, 1 + top.g, 1 + top.b),
            brightness: direction.y > 0 ? RobloxProperties.number(values, 'Brightness') : 0,
            exposure: 2 ** RobloxProperties.number(values, 'ExposureCompensation'),
            specular: RobloxProperties.number(values, 'EnvironmentSpecularScale'),
            shadows: values['GlobalShadows'] === true,
        };
    }

    /** Front-facing Lambert response preserves form instead of illuminating both sides equally. */
    public static diffuse(frame: RobloxLightingFrame, normal: RobloxVector3): RobloxColor3 {
        const up: number = Math.max(0, Math.min(1, normal.y * 0.5 + 0.5));
        const facing: number =
            Math.max(
                0,
                normal.x * frame.direction.x +
                    normal.y * frame.direction.y +
                    normal.z * frame.direction.z,
            ) * frame.brightness;
        return RobloxValues.color(
            frame.ground.r + (frame.sky.r - frame.ground.r) * up + frame.sun.r * facing,
            frame.ground.g + (frame.sky.g - frame.ground.g) * up + frame.sun.g * facing,
            frame.ground.b + (frame.sky.b - frame.ground.b) * up + frame.sun.b * facing,
        );
    }

    /** Directional specular response follows the authored camera and the actual smooth mesh normal. */
    public static specular(
        frame: RobloxLightingFrame,
        normal: RobloxVector3,
        view: RobloxVector3,
        material: RobloxSurfaceResponse,
    ): number {
        const x: number = frame.direction.x + view.x;
        const y: number = frame.direction.y + view.y;
        const z: number = frame.direction.z + view.z;
        const length: number = Math.hypot(x, y, z);
        if (
            length < 1e-8 ||
            normal.x * frame.direction.x +
                normal.y * frame.direction.y +
                normal.z * frame.direction.z <=
                0
        ) {
            return 0;
        }
        const facing: number = Math.max(0, (normal.x * x + normal.y * y + normal.z * z) / length);
        const power: number = Math.min(
            256,
            Math.max(2, 2 / (material.roughness * material.roughness) - 2),
        );
        return (
            frame.brightness *
            facing ** power *
            (0.04 + material.metalness * 0.76 + material.reflectance * 0.2)
        );
    }
}
