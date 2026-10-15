// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxBeamFrame } from './RobloxBeamGeometry';
import type { RobloxTrailPoint } from './RobloxTrailHistory';
import { RobloxTrailTimeline } from './RobloxTrailTimeline';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxProperties, RobloxSceneRuntime } from './RobloxSceneRuntime';
import { RobloxValues } from './RobloxSceneSchema';
import type {
    RobloxScene,
    RobloxSceneNode,
    RobloxValue,
    RobloxVector3,
    RobloxColor3,
} from './RobloxSceneTypes';
import type { RobloxParticleView } from './RobloxParticleOrientation';

interface TrailSpan {
    readonly a: RobloxTrailPoint;
    readonly b: RobloxTrailPoint;
}
interface TrailStorage {
    readonly node: RobloxSceneNode;
    readonly timeline: RobloxTrailTimeline;
    vertices: Float32Array;
}

/** Shared world-space Trail triangles retain native point births, clipping and disconnected strips. */
export class RobloxTrailGeometry {
    /** Ribbons share position XYZ, unpremultiplied RGBA and local UV hardware attributes. */
    public static readonly vertexFloats: number = 9;
    readonly #trails: readonly TrailStorage[];
    /** Native history contains geometry; current instance properties control all living segments. */
    public constructor(
        public readonly scene: RobloxScene,
        public readonly trigger: string | null = null,
    ) {
        const nodes: ReadonlyMap<string, RobloxSceneNode> = RobloxSceneHierarchy.catalog(scene);
        this.#trails = (scene.trailHistory ?? []).map((track): TrailStorage => {
            const node: RobloxSceneNode | undefined = nodes.get(track.nodeId);
            if (node?.className !== 'Trail') {
                throw new Error('Missing native Trail owner');
            }
            return {
                node,
                timeline: new RobloxTrailTimeline(track),
                vertices: new Float32Array(0),
            };
        });
    }

    /** Disabled trails continue fading; only native clears or retained topology remove their past. */
    public sample(
        time: number,
        view: RobloxParticleView,
        values: ReadonlyMap<
            string,
            Readonly<Record<string, RobloxValue>>
        > = RobloxSceneRuntime.evaluate(this.scene, time, this.trigger),
    ): readonly RobloxBeamFrame[] {
        if (!Number.isFinite(time) || time < 0 || time > this.scene.duration) {
            throw new Error('Trail timestamp lies outside the scene');
        }
        const active: ReadonlyMap<string, RobloxSceneNode> = RobloxSceneHierarchy.active(
            this.scene,
            time,
        );
        const frames: RobloxBeamFrame[] = [];
        for (const storage of this.#trails) {
            const properties: Readonly<Record<string, RobloxValue>> | undefined = values.get(
                storage.node.id,
            );
            if (properties === undefined || !active.has(storage.node.id)) {
                continue;
            }
            const points: readonly RobloxTrailPoint[] = storage.timeline.sample(time);
            const head: RobloxTrailPoint | undefined = points.at(-1);
            if (head === undefined) {
                continue;
            }
            const lifetime: number = RobloxProperties.number(properties, 'Lifetime');
            const maximum: number = RobloxProperties.number(properties, 'MaxLength');
            const cutoff: number = time - lifetime;
            const distance: number = maximum > 0 ? head.travel - maximum : -Infinity;
            const spans: TrailSpan[] = [];
            for (let index: number = 1; index < points.length; index++) {
                const a: RobloxTrailPoint | undefined = points[index - 1];
                const b: RobloxTrailPoint | undefined = points[index];
                if (
                    a === undefined ||
                    b === undefined ||
                    b.separated ||
                    b.born <= cutoff ||
                    b.travel < distance ||
                    (a.a.every((v: number, i: number): boolean => v === b.a[i]) &&
                        a.b.every((v: number, i: number): boolean => v === b.b[i]))
                ) {
                    continue;
                }
                const age: number = b.born > a.born ? (cutoff - a.born) / (b.born - a.born) : 0;
                const length: number =
                    b.travel > a.travel ? (distance - a.travel) / (b.travel - a.travel) : 0;
                const fraction: number = Math.max(0, Math.min(1, Math.max(age, length)));
                if (fraction < 1) {
                    spans.push({
                        a: fraction > 0 ? RobloxTrailGeometry.#mix(a, b, fraction) : a,
                        b,
                    });
                }
            }
            const first: TrailSpan | undefined = spans[0];
            if (first === undefined) {
                continue;
            }
            const needed: number = spans.length * 6 * RobloxTrailGeometry.vertexFloats;
            if (storage.vertices.length < needed) {
                storage.vertices = new Float32Array(needed);
            }
            const colors: RobloxValue | undefined = properties['Color'];
            const opacity: RobloxValue | undefined = properties['Transparency'];
            const widths: RobloxValue | undefined = properties['WidthScale'];
            if (
                typeof colors !== 'object' ||
                colors.kind !== 'ColorSequence' ||
                typeof opacity !== 'object' ||
                opacity.kind !== 'NumberSequence' ||
                typeof widths !== 'object' ||
                widths.kind !== 'NumberSequence'
            ) {
                throw new Error('Missing native Trail appearance sequences');
            }
            const modifier: number =
                1 - RobloxProperties.number(properties, 'LocalTransparencyModifier');
            const influence: number = RobloxProperties.number(properties, 'LightInfluence');
            const gain: number =
                RobloxProperties.number(properties, 'Brightness') * (1 - influence) + influence;
            const mode: number = RobloxProperties.enum(properties, 'TextureMode');
            const textureLength: number = RobloxProperties.number(properties, 'TextureLength');
            const total: number = head.travel - first.a.travel;
            let offset: number = 0;
            for (let index: number = 0; index < spans.length; index++) {
                const span: TrailSpan | undefined = spans[index];
                if (span === undefined) {
                    continue;
                }
                const previous: TrailSpan | undefined = spans[index - 1];
                const next: TrailSpan | undefined = spans[index + 1];
                for (const [step, side] of [
                    [0, -1],
                    [0, 1],
                    [1, 1],
                    [0, -1],
                    [1, 1],
                    [1, -1],
                ] as const) {
                    const point: RobloxTrailPoint = step === 0 ? span.a : span.b;
                    const before: RobloxTrailPoint =
                        step === 0 && previous?.b.serial === span.a.serial ? previous.a : span.a;
                    const after: RobloxTrailPoint =
                        step === 1 && next?.a.serial === span.b.serial ? next.b : span.b;
                    const age: number = Math.max(0, Math.min(1, (time - point.born) / lifetime));
                    const width: number = RobloxSceneRuntime.scalar(widths, age, 0);
                    const color: RobloxColor3 = RobloxSceneRuntime.color(colors, age);
                    const alpha: number =
                        Math.max(0, Math.min(1, 1 - RobloxSceneRuntime.scalar(opacity, age, 0))) *
                        modifier;
                    const u: number =
                        mode === 0
                            ? ((point.travel - first.a.travel) * textureLength) /
                              Math.max(1e-10, total)
                            : mode === 1
                              ? (point.travel - head.travel) / textureLength
                              : point.travel / textureLength;
                    RobloxTrailGeometry.#position(
                        storage.vertices,
                        offset,
                        point,
                        before,
                        after,
                        side,
                        width,
                        view,
                        properties['FaceCamera'] === true,
                    );
                    storage.vertices[offset + 3] = color.r * gain;
                    storage.vertices[offset + 4] = color.g * gain;
                    storage.vertices[offset + 5] = color.b * gain;
                    storage.vertices[offset + 6] = alpha;
                    storage.vertices[offset + 7] = u;
                    storage.vertices[offset + 8] = (1 - side) / 2;
                    offset += RobloxTrailGeometry.vertexFloats;
                }
            }
            const center: RobloxVector3 = RobloxValues.vector3(
                (head.a[0] + head.b[0]) / 2,
                (head.a[1] + head.b[1]) / 2,
                (head.a[2] + head.b[2]) / 2,
            );
            frames.push({
                id: storage.node.id,
                vertices: storage.vertices,
                count: offset / RobloxTrailGeometry.vertexFloats,
                center,
                texture: typeof properties['Texture'] === 'string' ? properties['Texture'] : '',
                lightEmission: RobloxProperties.number(properties, 'LightEmission'),
                zOffset: 0,
            });
        }
        return frames;
    }

    static #mix(a: RobloxTrailPoint, b: RobloxTrailPoint, t: number): RobloxTrailPoint {
        return {
            serial: a.serial,
            born: a.born + (b.born - a.born) * t,
            travel: a.travel + (b.travel - a.travel) * t,
            separated: a.separated,
            a: [
                a.a[0] + (b.a[0] - a.a[0]) * t,
                a.a[1] + (b.a[1] - a.a[1]) * t,
                a.a[2] + (b.a[2] - a.a[2]) * t,
            ],
            b: [
                a.b[0] + (b.b[0] - a.b[0]) * t,
                a.b[1] + (b.b[1] - a.b[1]) * t,
                a.b[2] + (b.b[2] - a.b[2]) * t,
            ],
        };
    }

    static #position(
        output: Float32Array,
        offset: number,
        point: RobloxTrailPoint,
        before: RobloxTrailPoint,
        after: RobloxTrailPoint,
        side: number,
        width: number,
        view: RobloxParticleView,
        faceCamera: boolean,
    ): void {
        const cx: number = (point.a[0] + point.b[0]) / 2;
        const cy: number = (point.a[1] + point.b[1]) / 2;
        const cz: number = (point.a[2] + point.b[2]) / 2;
        let x: number = (point.b[0] - point.a[0]) / 2;
        let y: number = (point.b[1] - point.a[1]) / 2;
        let z: number = (point.b[2] - point.a[2]) / 2;
        if (faceCamera) {
            const half: number = Math.hypot(x, y, z);
            const tx: number = (after.a[0] + after.b[0] - before.a[0] - before.b[0]) / 2;
            const ty: number = (after.a[1] + after.b[1] - before.a[1] - before.b[1]) / 2;
            const tz: number = (after.a[2] + after.b[2] - before.a[2] - before.b[2]) / 2;
            x = (view.position.y - cy) * tz - (view.position.z - cz) * ty;
            y = (view.position.z - cz) * tx - (view.position.x - cx) * tz;
            z = (view.position.x - cx) * ty - (view.position.y - cy) * tx;
            let length: number = Math.hypot(x, y, z);
            if (length < 1e-10) {
                const tangent: number = tx * tx + ty * ty + tz * tz;
                const projection: number =
                    tangent > 1e-20
                        ? (view.up.x * tx + view.up.y * ty + view.up.z * tz) / tangent
                        : 0;
                x = view.up.x - projection * tx;
                y = view.up.y - projection * ty;
                z = view.up.z - projection * tz;
                length = Math.hypot(x, y, z);
            }
            if (length < 1e-10) {
                x = view.right.x;
                y = view.right.y;
                z = view.right.z;
                length = Math.hypot(x, y, z);
            }
            const scale: number = half / Math.max(1e-10, length);
            x *= scale;
            y *= scale;
            z *= scale;
        }
        output[offset] = cx + x * width * side;
        output[offset + 1] = cy + y * width * side;
        output[offset + 2] = cz + z * width * side;
    }
}
