// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    RobloxScene,
    RobloxSceneNode,
    RobloxValue,
    RobloxNumberSequence,
    RobloxColorSequence,
    RobloxColor3,
    RobloxVector3,
    RobloxCFrame,
    RobloxSceneEvent,
    RobloxPropertySample,
} from './RobloxSceneTypes';
import { RobloxValues } from './RobloxSceneSchema';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';

/** Typed access to validated properties, with explicit missing-property errors. */
export class RobloxProperties {
    /** Reads a native scalar. */
    public static number(properties: Readonly<Record<string, RobloxValue>>, key: string): number {
        const value: RobloxValue | undefined = properties[key];
        if (typeof value !== 'number') {
            throw new Error('Expected scalar: ' + key);
        }
        return value;
    }
    /** Reads a native enum value. */
    public static enum(properties: Readonly<Record<string, RobloxValue>>, key: string): number {
        const value: RobloxValue | undefined = properties[key];
        if (typeof value !== 'object' || value.kind !== 'Enum') {
            throw new Error('Expected enum: ' + key);
        }
        return value.value;
    }
    /** Reads a native RGB color. */
    public static color(
        properties: Readonly<Record<string, RobloxValue>>,
        key: string,
    ): RobloxColor3 {
        const value: RobloxValue | undefined = properties[key];
        if (typeof value !== 'object' || value.kind !== 'Color3') {
            throw new Error('Expected color: ' + key);
        }
        return value;
    }
    /** Reads a native vector. */
    public static vector(
        properties: Readonly<Record<string, RobloxValue>>,
        key: string,
    ): RobloxVector3 {
        const value: RobloxValue | undefined = properties[key];
        if (typeof value !== 'object' || value.kind !== 'Vector3') {
            throw new Error('Expected vector: ' + key);
        }
        return value;
    }
    /** Reads a native frame. */
    public static cframe(
        properties: Readonly<Record<string, RobloxValue>>,
        key: string,
    ): RobloxCFrame {
        const value: RobloxValue | undefined = properties[key];
        if (typeof value !== 'object' || value.kind !== 'CFrame') {
            throw new Error('Expected frame: ' + key);
        }
        return value;
    }
}

/** Pure seekable timeline evaluation. Playback order does not affect a frame's values. */
interface RobloxTimelineIndex {
    readonly nodes: ReadonlyMap<string, RobloxSceneNode>;
    readonly events: ReadonlyMap<string, readonly RobloxSceneEvent[]>;
}

/** Pure seekable timeline evaluation. Playback order does not affect a frame's values. */
export class RobloxSceneRuntime {
    static readonly #indices: WeakMap<RobloxScene, RobloxTimelineIndex> = new WeakMap();
    /** Evaluates the selected timeline from its immutable baseline. */
    public static evaluate(
        scene: RobloxScene,
        time: number,
        trigger: string | null = null,
    ): ReadonlyMap<string, Readonly<Record<string, RobloxValue>>> {
        return new Map(
            RobloxSceneHierarchy.nodes(scene, time).map(
                (
                    node: RobloxSceneNode,
                ): readonly [string, Readonly<Record<string, RobloxValue>>] => [
                    node.id,
                    this.properties(scene, node.id, time, trigger),
                ],
            ),
        );
    }

    /** Samples one node without evaluating unrelated tracks, including particle birth poses. */
    public static properties(
        scene: RobloxScene,
        nodeId: string,
        time: number,
        trigger: string | null = null,
    ): Readonly<Record<string, RobloxValue>> {
        const index: RobloxTimelineIndex = this.#index(scene);
        const node: RobloxSceneNode | undefined = index.nodes.get(nodeId);
        if (node === undefined) {
            throw new Error('Missing timeline node');
        }
        const result: Record<string, RobloxValue> = { ...node.properties };
        for (const event of index.events.get(nodeId) ?? []) {
            if (
                event.kind === 'burst' ||
                event.kind === 'clear' ||
                event.trigger !== trigger ||
                time < event.at
            ) {
                continue;
            }
            const from: RobloxValue | undefined = result[event.property];
            if (from === undefined) {
                throw new Error('Missing timeline property');
            }
            if (event.kind === 'recording') {
                const sample: RobloxValue | null = this.sample(event.samples, time);
                if (sample !== null) {
                    result[event.property] = sample;
                }
            } else {
                result[event.property] = this.interpolate(
                    from,
                    event.to,
                    Math.min(1, (time - event.at) / event.duration),
                );
            }
        }
        return result;
    }

    /** Finds the latest observation in logarithmic time; seeking has no mutable cursor. */
    public static sample(
        samples: readonly RobloxPropertySample[],
        time: number,
    ): RobloxValue | null {
        let low: number = 0;
        let high: number = samples.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            const sample: RobloxPropertySample | undefined = samples[middle];
            if (sample !== undefined && sample.at <= time) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return samples[low - 1]?.value ?? null;
    }

    static #index(scene: RobloxScene): RobloxTimelineIndex {
        const cached: RobloxTimelineIndex | undefined = this.#indices.get(scene);
        if (cached !== undefined) {
            return cached;
        }
        const events: Map<string, RobloxSceneEvent[]> = new Map();
        for (const event of scene.events) {
            const list: RobloxSceneEvent[] = events.get(event.nodeId) ?? [];
            list.push(event);
            events.set(event.nodeId, list);
        }
        const index: RobloxTimelineIndex = {
            nodes: RobloxSceneHierarchy.catalog(scene),
            events,
        };
        this.#indices.set(scene, index);
        return index;
    }

    /** Native linear interpolation for the supported tween property types. */
    public static interpolate(from: RobloxValue, to: RobloxValue, alpha: number): RobloxValue {
        const lerp: (a: number, b: number) => number = (a: number, b: number): number =>
            a + (b - a) * alpha;
        if (typeof from === 'number' && typeof to === 'number') {
            return lerp(from, to);
        }
        if (typeof from !== 'object' || typeof to !== 'object') {
            throw new Error('Unsupported interpolation');
        }
        if (from.kind === 'Color3' && to.kind === 'Color3') {
            return RobloxValues.color(lerp(from.r, to.r), lerp(from.g, to.g), lerp(from.b, to.b));
        }
        if (from.kind === 'Vector3' && to.kind === 'Vector3') {
            return RobloxValues.vector3(lerp(from.x, to.x), lerp(from.y, to.y), lerp(from.z, to.z));
        }
        if (from.kind === 'Vector2' && to.kind === 'Vector2') {
            return { kind: 'Vector2', x: lerp(from.x, to.x), y: lerp(from.y, to.y) };
        }
        if (from.kind === 'UDim2' && to.kind === 'UDim2') {
            return RobloxValues.udim2(
                lerp(from.xScale, to.xScale),
                lerp(from.xOffset, to.xOffset),
                lerp(from.yScale, to.yScale),
                lerp(from.yOffset, to.yOffset),
            );
        }
        throw new Error('Unsupported interpolation');
    }

    /** Samples a scalar sequence with a stable envelope offset over the particle's lifetime. */
    public static scalar(
        sequence: RobloxNumberSequence,
        age: number,
        envelope: number = 0,
    ): number {
        for (let index: number = 1; index < sequence.points.length; index++) {
            const a: import('./RobloxSceneTypes').RobloxNumberKeypoint | undefined =
                sequence.points[index - 1];
            const b: import('./RobloxSceneTypes').RobloxNumberKeypoint | undefined =
                sequence.points[index];
            if (a !== undefined && b !== undefined && age <= b.time) {
                const alpha: number = (age - a.time) / (b.time - a.time);
                return (
                    (a.value + a.envelope * envelope) * (1 - alpha) +
                    (b.value + b.envelope * envelope) * alpha
                );
            }
        }
        return sequence.points.at(-1)?.value ?? 0;
    }

    /** Samples a native RGB sequence. */
    public static color(sequence: RobloxColorSequence, age: number): RobloxColor3 {
        for (let index: number = 1; index < sequence.points.length; index++) {
            const a: import('./RobloxSceneTypes').RobloxColorKeypoint | undefined =
                sequence.points[index - 1];
            const b: import('./RobloxSceneTypes').RobloxColorKeypoint | undefined =
                sequence.points[index];
            if (a !== undefined && b !== undefined && age <= b.time) {
                const alpha: number = (age - a.time) / (b.time - a.time);
                return RobloxValues.color(
                    a.color.r + (b.color.r - a.color.r) * alpha,
                    a.color.g + (b.color.g - a.color.g) * alpha,
                    a.color.b + (b.color.b - a.color.b) * alpha,
                );
            }
        }
        return sequence.points.at(-1)?.color ?? RobloxValues.color();
    }
}
