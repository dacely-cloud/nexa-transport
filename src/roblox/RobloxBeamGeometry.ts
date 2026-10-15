// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    RobloxCFrame,
    RobloxColor3,
    RobloxScene,
    RobloxSceneNode,
    RobloxValue,
    RobloxVector3,
} from './RobloxSceneTypes';
import type { RobloxParticleView } from './RobloxParticleOrientation';
import { RobloxBeamPath, type RobloxBeamPoint } from './RobloxBeamPath';
import { RobloxBeamMotion } from './RobloxBeamMotion';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxSceneRuntime, RobloxProperties } from './RobloxSceneRuntime';
import { RobloxPartGeometry } from './RobloxPartGeometry';
import { RobloxParticlePose } from './RobloxParticlePose';
import { RobloxValues } from './RobloxSceneSchema';

/** World-space triangles: position XYZ, color RGBA, and local unwrapped texture UV. */
export interface RobloxBeamFrame {
    readonly id: string;
    readonly vertices: Float32Array;
    readonly count: number;
    readonly center: RobloxVector3;
    readonly texture: string;
    readonly lightEmission: number;
    readonly zOffset: number;
}
interface BeamStorage {
    readonly node: RobloxSceneNode;
    readonly motion: RobloxBeamMotion;
    vertices: Float32Array;
}

/** One reusable, seekable ribbon sampler supplies both native Vulkan and browser WebGL. */
export class RobloxBeamGeometry {
    /** Position, unpremultiplied color/opacity and unwrapped UV match both hardware adapters. */
    public static readonly vertexFloats: number = 9;
    readonly #beams: readonly BeamStorage[];
    public constructor(
        public readonly scene: RobloxScene,
        public readonly trigger: string | null = null,
    ) {
        const births: Map<string, number> = new Map();
        for (const delta of scene.hierarchy ?? []) {
            for (const node of delta.created) {
                births.set(node.id, delta.at);
            }
        }
        this.#beams = [...RobloxSceneHierarchy.catalog(scene).values()]
            .filter((node: RobloxSceneNode): boolean => node.className === 'Beam')
            .map((node: RobloxSceneNode): BeamStorage => ({
                node,
                motion: new RobloxBeamMotion(node, births.get(node.id) ?? 0, scene, trigger),
                vertices: new Float32Array(0),
            }));
    }

    /** Evaluates current endpoint identities and poses; inactive or nil endpoints produce no surface. */
    public sample(
        time: number,
        view: RobloxParticleView,
        values: ReadonlyMap<
            string,
            Readonly<Record<string, RobloxValue>>
        > = RobloxSceneRuntime.evaluate(this.scene, time, this.trigger),
    ): readonly RobloxBeamFrame[] {
        if (!Number.isFinite(time) || time < 0 || time > this.scene.duration) {
            throw new Error('Beam timestamp lies outside the scene');
        }
        const active: ReadonlyMap<string, RobloxSceneNode> = RobloxSceneHierarchy.active(
            this.scene,
            time,
        );
        const frames: RobloxBeamFrame[] = [];
        for (const storage of this.#beams) {
            const properties: Readonly<Record<string, RobloxValue>> | undefined = values.get(
                storage.node.id,
            );
            if (properties === undefined || properties['Enabled'] !== true) {
                continue;
            }
            const start: RobloxCFrame | null = this.#attachment(
                properties['Attachment0'],
                active,
                values,
            );
            const end: RobloxCFrame | null = this.#attachment(
                properties['Attachment1'],
                active,
                values,
            );
            if (start === null || end === null) {
                continue;
            }
            const colors: RobloxValue | undefined = properties['Color'];
            const transparency: RobloxValue | undefined = properties['Transparency'];
            if (
                typeof colors !== 'object' ||
                colors.kind !== 'ColorSequence' ||
                typeof transparency !== 'object' ||
                transparency.kind !== 'NumberSequence'
            ) {
                throw new Error('Missing native Beam sequences');
            }
            const segments: number = RobloxProperties.number(properties, 'Segments');
            const needed: number = segments * 6 * RobloxBeamGeometry.vertexFloats;
            if (storage.vertices.length < needed) {
                storage.vertices = new Float32Array(needed);
            }
            const path: RobloxBeamPath = new RobloxBeamPath(
                start,
                end,
                RobloxProperties.number(properties, 'CurveSize0'),
                RobloxProperties.number(properties, 'CurveSize1'),
            );
            const points: RobloxBeamPoint[] = [];
            const distances: number[] = [0];
            let total: number = 0;
            for (let index: number = 0; index <= segments; index++) {
                const point: RobloxBeamPoint = path.point(
                    index / segments,
                    view,
                    properties['FaceCamera'] === true,
                );
                const previous: RobloxBeamPoint | undefined = points[index - 1];
                if (previous !== undefined) {
                    total += Math.hypot(
                        point.center.x - previous.center.x,
                        point.center.y - previous.center.y,
                        point.center.z - previous.center.z,
                    );
                    distances.push(total);
                }
                points.push(point);
            }
            if (total < 1e-10) {
                continue;
            }
            const width0: number = RobloxProperties.number(properties, 'Width0');
            const width1: number = RobloxProperties.number(properties, 'Width1');
            const modifier: number =
                1 - RobloxProperties.number(properties, 'LocalTransparencyModifier');
            const influence: number = RobloxProperties.number(properties, 'LightInfluence');
            const gain: number =
                RobloxProperties.number(properties, 'Brightness') * (1 - influence) + influence;
            const length: number = RobloxProperties.number(properties, 'TextureLength');
            const scale: number =
                RobloxProperties.enum(properties, 'TextureMode') === 0
                    ? length / total
                    : 1 / length;
            const phase: number = storage.motion.phase(time);
            let offset: number = 0;
            for (let segment: number = 0; segment < segments; segment++) {
                for (const [step, side] of [
                    [0, 1],
                    [0, -1],
                    [1, -1],
                    [0, 1],
                    [1, -1],
                    [1, 1],
                ] as const) {
                    const index: number = segment + step;
                    const point: RobloxBeamPoint | undefined = points[index];
                    if (point === undefined) {
                        throw new Error('Missing sampled Beam path');
                    }
                    const t: number = index / segments;
                    const half: number = ((width0 + (width1 - width0) * t) * side) / 2;
                    const color: RobloxColor3 = RobloxSceneRuntime.color(colors, t);
                    const alpha: number =
                        Math.max(
                            0,
                            Math.min(1, 1 - RobloxSceneRuntime.scalar(transparency, t, 0)),
                        ) * modifier;
                    storage.vertices[offset] = point.center.x + point.up.x * half;
                    storage.vertices[offset + 1] = point.center.y + point.up.y * half;
                    storage.vertices[offset + 2] = point.center.z + point.up.z * half;
                    storage.vertices[offset + 3] = color.r * gain;
                    storage.vertices[offset + 4] = color.g * gain;
                    storage.vertices[offset + 5] = color.b * gain;
                    storage.vertices[offset + 6] = alpha;
                    storage.vertices[offset + 7] = (distances[index] ?? 0) * scale + phase;
                    storage.vertices[offset + 8] = side === 1 ? 0 : 1;
                    offset += RobloxBeamGeometry.vertexFloats;
                }
            }
            const center: RobloxVector3 =
                points[Math.floor(segments / 2)]?.center ?? RobloxValues.vector3();
            frames.push({
                id: storage.node.id,
                vertices: storage.vertices,
                count: segments * 6,
                center,
                texture: typeof properties['Texture'] === 'string' ? properties['Texture'] : '',
                lightEmission: RobloxProperties.number(properties, 'LightEmission'),
                zOffset: RobloxProperties.number(properties, 'ZOffset'),
            });
        }
        return frames;
    }

    #attachment(
        reference: RobloxValue | undefined,
        active: ReadonlyMap<string, RobloxSceneNode>,
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
    ): RobloxCFrame | null {
        if (
            typeof reference !== 'object' ||
            reference.kind !== 'Instance' ||
            reference.id === null ||
            active.get(reference.id)?.className !== 'Attachment'
        ) {
            return null;
        }
        let node: RobloxSceneNode | undefined = active.get(reference.id);
        let frame: RobloxCFrame = RobloxValues.cframe();
        while (node !== undefined) {
            if (node.className === 'Attachment' || RobloxPartGeometry.isPart(node.className)) {
                const properties: Readonly<Record<string, RobloxValue>> | undefined = values.get(
                    node.id,
                );
                if (properties === undefined) {
                    return null;
                }
                frame = RobloxParticlePose.multiply(
                    RobloxProperties.cframe(properties, 'CFrame'),
                    frame,
                );
                if (node.className !== 'Attachment') {
                    break;
                }
            }
            node = node.parentId === null ? undefined : active.get(node.parentId);
        }
        return frame;
    }
}
