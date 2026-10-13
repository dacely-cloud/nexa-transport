// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneInput } from './RobloxSceneInput';
import { RobloxPartGeometry } from './RobloxPartGeometry';
import { RobloxSceneTextures, type RobloxSceneTextureAtlas } from './RobloxSceneTextures';
import { RobloxSceneHierarchy, type RobloxHierarchyDecoded } from './RobloxSceneHierarchy';
import { RobloxSceneSchema, type RobloxPropertySpec } from './RobloxSceneSchema';
import {
    RobloxClass,
    type RobloxScene,
    type RobloxSceneNode,
    type RobloxSceneEvent,
    type RobloxValue,
    type RobloxNumberKeypoint,
    type RobloxColorKeypoint,
    type RobloxPropertySample,
    type RobloxEmissionSnapshot,
    type RobloxEmissionFrame,
    type RobloxHierarchyDelta,
} from './RobloxSceneTypes';

/** Strict bounded JSON trust boundary for portable Roblox scenes. */
export class RobloxSceneCodec {
    /** Maximum UTF-8 artifact size before parsing. */
    public static readonly maximumBytes: number = 4 * 1024 * 1024;

    /** Parses and normalizes a bounded artifact. */
    public static parse(json: string): RobloxScene {
        if (new TextEncoder().encode(json).byteLength > this.maximumBytes) {
            throw new Error('Roblox scene exceeds 4 MiB');
        }
        const raw: unknown = JSON.parse(json);
        return this.decode(raw);
    }

    /** Validates structure, native values, topology and preview resource limits. */
    public static decode(raw: unknown): RobloxScene {
        const fields: Readonly<Record<string, unknown>> = this.record(
            raw,
            ['format', 'version', 'name', 'duration', 'seed', 'camera', 'nodes', 'events'],
            ['inputs', 'hierarchy', 'textures'],
        );
        if (fields['format'] !== 'nexa.roblox.scene' || fields['version'] !== 1) {
            throw new Error('Expected nexa.roblox.scene version 1');
        }
        const duration: number = this.number(fields['duration'], 0.01, 60);
        const camera: Readonly<Record<string, unknown>> = this.record(fields['camera'], [
            'position',
            'target',
            'fieldOfView',
        ]);
        const position: RobloxValue = this.value(camera['position'], {
            type: 'Vector3',
            default: false,
        });
        const target: RobloxValue = this.value(camera['target'], {
            type: 'Vector3',
            default: false,
        });
        if (
            typeof position !== 'object' ||
            position.kind !== 'Vector3' ||
            typeof target !== 'object' ||
            target.kind !== 'Vector3'
        ) {
            throw new Error('Invalid camera');
        }
        if (position.x === target.x && position.y === target.y && position.z === target.z) {
            throw new Error('Camera position must differ from target');
        }
        const nodes: readonly RobloxSceneNode[] = this.#array(fields['nodes'], 2048).map(
            (value: unknown): RobloxSceneNode => this.#node(value),
        );
        const initialById: ReadonlyMap<string, RobloxSceneNode> = new Map(
            nodes.map((node: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                node.id,
                node,
            ]),
        );
        if (nodes.length === 0 || initialById.size !== nodes.length) {
            throw new Error('Scene needs unique node identities');
        }
        for (const node of nodes) {
            this.#parent(node, initialById);
        }
        const hierarchy: RobloxHierarchyDecoded = RobloxSceneHierarchy.decode(
            fields['hierarchy'],
            nodes,
            duration,
        );
        const byId: ReadonlyMap<string, RobloxSceneNode> = hierarchy.catalog;
        const events: readonly RobloxSceneEvent[] = this.#array(fields['events'], 2048)
            .map((value: unknown): RobloxSceneEvent =>
                this.#event(value, duration, byId, nodes, hierarchy.deltas),
            )
            .sort((a: RobloxSceneEvent, b: RobloxSceneEvent): number => a.at - b.at);
        const endTimes: Map<string, number> = new Map<string, number>();
        let particles: number = 0;
        let samples: number = 0;
        for (const node of byId.values()) {
            if (node.className === RobloxClass.ParticleEmitter) {
                const rate: RobloxValue | undefined = node.properties['Rate'];
                let maximumRate: number = typeof rate === 'number' ? rate : 0;
                let enabled: boolean = node.properties['Enabled'] === true;
                for (const event of events) {
                    if (event.kind !== 'recording' || event.nodeId !== node.id) {
                        continue;
                    }
                    for (const sample of event.samples) {
                        if (event.property === 'Rate' && typeof sample.value === 'number') {
                            maximumRate = Math.max(maximumRate, sample.value);
                        }
                        if (event.property === 'Enabled' && sample.value === true) {
                            enabled = true;
                        }
                    }
                }
                if (enabled) {
                    particles += maximumRate * (hierarchy.activeSeconds.get(node.id) ?? 0);
                }
            }
        }
        for (const event of events) {
            if (event.kind === 'clear') {
                continue;
            }
            if (event.kind === 'burst') {
                particles += event.count;
                continue;
            }
            const key: string = JSON.stringify([event.trigger, event.nodeId, event.property]);
            if ((endTimes.get(key) ?? -1) > event.at) {
                throw new Error('Overlapping tweens on ' + event.nodeId + '.' + event.property);
            }
            endTimes.set(key, event.kind === 'recording' ? duration : event.at + event.duration);
            if (event.kind === 'recording') {
                samples += event.samples.length;
            }
        }
        if (samples > 65536) {
            throw new Error('Scene exceeds the 65536 recorded property sample budget');
        }
        if (particles > 20000) {
            throw new Error(
                'Scene exceeds the 20000 particle birth budget; reduce rates, bursts or duration',
            );
        }
        const textures: RobloxSceneTextureAtlas | undefined = RobloxSceneTextures.decode(
            fields['textures'],
        );
        return Object.freeze({
            format: 'nexa.roblox.scene',
            version: 1,
            name: this.text(fields['name'], 160),
            duration,
            seed: this.number(fields['seed'], 0, 4294967295, true),
            camera: Object.freeze({
                position,
                target,
                fieldOfView: this.number(camera['fieldOfView'], 1, 120),
            }),
            nodes: Object.freeze(nodes),
            events: Object.freeze(events),
            inputs: Object.freeze(RobloxSceneInput.observations(fields['inputs'], duration, byId)),
            ...(hierarchy.deltas.length === 0 ? {} : { hierarchy: hierarchy.deltas }),
            ...(textures === undefined ? {} : { textures }),
        });
    }

    /** Validates plain data properties before reading an external record. */
    public static record(
        raw: unknown,
        required: readonly string[],
        optional: readonly string[] = [],
    ): Readonly<Record<string, unknown>> {
        if (
            raw === null ||
            typeof raw !== 'object' ||
            Array.isArray(raw) ||
            (Object.getPrototypeOf(raw) !== Object.prototype && Object.getPrototypeOf(raw) !== null)
        ) {
            throw new Error('Expected plain Roblox data');
        }
        const fields: Readonly<Record<string, unknown>> = raw as Readonly<Record<string, unknown>>;
        for (const key of Reflect.ownKeys(fields)) {
            const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                fields,
                key,
            );
            if (
                typeof key !== 'string' ||
                (!required.includes(key) && !optional.includes(key)) ||
                descriptor?.get !== undefined ||
                descriptor?.set !== undefined
            ) {
                throw new Error('Unsupported Roblox field: ' + String(key));
            }
        }
        for (const key of required) {
            if (!Object.hasOwn(fields, key)) {
                throw new Error('Missing Roblox field: ' + key);
            }
        }
        return fields;
    }

    /** Normalizes an instance definition at its first recorded appearance. */
    public static node(raw: unknown): RobloxSceneNode {
        return this.#node(raw);
    }
    /** Validates membership, parent classes and cycles for one atomic graph state. */
    public static topology(nodes: readonly RobloxSceneNode[]): void {
        const byId: ReadonlyMap<string, RobloxSceneNode> = new Map(
            nodes.map((node: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                node.id,
                node,
            ]),
        );
        for (const node of nodes) {
            this.#parent(node, byId);
        }
    }
    /** Reads a bounded external list used by native hierarchy observations. */
    public static array(raw: unknown, limit: number): readonly unknown[] {
        return this.#array(raw, limit);
    }
    /** Validates an external instance identity. */
    public static identity(raw: unknown): string {
        return this.#id(raw);
    }

    /** Validates an intentionally bounded simulation coordinate. */
    public static number(
        raw: unknown,
        min: number = -100000,
        max: number = 100000,
        integer: boolean = false,
    ): number {
        if (
            typeof raw !== 'number' ||
            !Number.isFinite(raw) ||
            raw < min ||
            raw > max ||
            (integer && !Number.isInteger(raw))
        ) {
            throw new Error(
                'Invalid Roblox number, expected ' + String(min) + ' to ' + String(max),
            );
        }
        return raw;
    }

    /** Validates a well-formed XML-compatible string. */
    public static text(raw: unknown, limit: number = 4096, empty: boolean = false): string {
        if (
            typeof raw !== 'string' ||
            raw.length > limit ||
            !raw.isWellFormed() ||
            (!empty && raw.trim() === '')
        ) {
            throw new Error('Invalid Roblox text');
        }
        for (let index: number = 0; index < raw.length; index++) {
            const code: number = raw.charCodeAt(index);
            if (
                (code < 32 && code !== 9 && code !== 10 && code !== 13) ||
                code === 65534 ||
                code === 65535
            ) {
                throw new Error('Invalid Roblox text');
            }
        }
        return raw;
    }

    /** Validates a native property value against its class-specific schema. */
    public static value(raw: unknown, spec: RobloxPropertySpec): RobloxValue {
        const min: number = spec.min ?? -100000;
        const max: number = spec.max ?? 100000;
        if (spec.type === 'number') {
            return this.number(raw, min, max, spec.xmlType === 'int');
        }
        if (spec.type === 'string') {
            return this.text(raw, 4096, true);
        }
        if (spec.type === 'boolean') {
            if (typeof raw !== 'boolean') {
                throw new Error('Expected Roblox boolean');
            }
            return raw;
        }
        const keys: Readonly<Record<string, readonly string[]>> = {
            Vector2: ['x', 'y'],
            Vector3: ['x', 'y', 'z'],
            Color3: ['r', 'g', 'b'],
            UDim: ['scale', 'offset'],
            UDim2: ['xScale', 'xOffset', 'yScale', 'yOffset'],
            NumberRange: ['min', 'max'],
            NumberSequence: ['points'],
            ColorSequence: ['points'],
            CFrame: ['components'],
            Enum: ['value'],
        };
        const data: Readonly<Record<string, unknown>> = this.record(raw, [
            'kind',
            ...(keys[spec.type] ?? []),
        ]);
        if (data['kind'] !== spec.type) {
            throw new Error('Expected Roblox ' + spec.type);
        }
        switch (spec.type) {
            case 'Vector2':
                return Object.freeze({
                    kind: 'Vector2',
                    x: this.number(data['x']),
                    y: this.number(data['y']),
                });
            case 'Vector3':
                return Object.freeze({
                    kind: 'Vector3',
                    x: this.number(data['x']),
                    y: this.number(data['y']),
                    z: this.number(data['z']),
                });
            case 'Color3':
                return Object.freeze({
                    kind: 'Color3',
                    r: this.number(data['r'], 0, 1),
                    g: this.number(data['g'], 0, 1),
                    b: this.number(data['b'], 0, 1),
                });
            case 'UDim':
                return Object.freeze({
                    kind: 'UDim',
                    scale: this.number(data['scale'], -100, 100),
                    offset: this.number(data['offset'], -100000, 100000, true),
                });
            case 'UDim2':
                return Object.freeze({
                    kind: 'UDim2',
                    xScale: this.number(data['xScale'], -100, 100),
                    xOffset: this.number(data['xOffset'], -100000, 100000, true),
                    yScale: this.number(data['yScale'], -100, 100),
                    yOffset: this.number(data['yOffset'], -100000, 100000, true),
                });
            case 'Enum': {
                const value: number = this.number(data['value'], 0, 10000, true);
                if (!spec.enumValues?.includes(value)) {
                    throw new Error('Unsupported Roblox enum value: ' + String(value));
                }
                return Object.freeze({ kind: 'Enum', value });
            }
            case 'NumberRange': {
                const low: number = this.number(data['min'], min, max);
                const high: number = this.number(data['max'], low, max);
                return Object.freeze({ kind: 'NumberRange', min: low, max: high });
            }
            case 'NumberSequence': {
                const points: readonly RobloxNumberKeypoint[] = this.#array(data['points'], 20).map(
                    (rawPoint: unknown): RobloxNumberKeypoint => {
                        const point: Readonly<Record<string, unknown>> = this.record(rawPoint, [
                            'time',
                            'value',
                            'envelope',
                        ]);
                        return Object.freeze({
                            time: this.number(point['time'], 0, 1),
                            value: this.number(point['value'], min, max),
                            envelope: this.number(point['envelope'], 0, Math.max(0, max)),
                        });
                    },
                );
                this.#times(points);
                return Object.freeze({ kind: 'NumberSequence', points: Object.freeze(points) });
            }
            case 'ColorSequence': {
                const points: readonly RobloxColorKeypoint[] = this.#array(data['points'], 20).map(
                    (rawPoint: unknown): RobloxColorKeypoint => {
                        const point: Readonly<Record<string, unknown>> = this.record(rawPoint, [
                            'time',
                            'color',
                        ]);
                        const color: RobloxValue = this.value(point['color'], {
                            type: 'Color3',
                            default: false,
                        });
                        if (typeof color !== 'object' || color.kind !== 'Color3') {
                            throw new Error('Invalid sequence color');
                        }
                        return Object.freeze({ time: this.number(point['time'], 0, 1), color });
                    },
                );
                this.#times(points);
                return Object.freeze({ kind: 'ColorSequence', points: Object.freeze(points) });
            }
            case 'CFrame': {
                const c: readonly number[] = this.#array(data['components'], 12).map(
                    (component: unknown): number => this.number(component),
                );
                if (c.length !== 12) {
                    throw new Error('CFrame requires 12 components');
                }
                for (let row: number = 0; row < 3; row++) {
                    for (let other: number = row; other < 3; other++) {
                        let dot: number = 0;
                        for (let column: number = 0; column < 3; column++) {
                            dot +=
                                (c[3 + row * 3 + column] ?? 0) * (c[3 + other * 3 + column] ?? 0);
                        }
                        if (Math.abs(dot - (row === other ? 1 : 0)) > 0.0001) {
                            throw new Error('CFrame rotation must be orthonormal');
                        }
                    }
                }
                const determinant: number =
                    (c[3] ?? 0) * ((c[7] ?? 0) * (c[11] ?? 0) - (c[8] ?? 0) * (c[10] ?? 0)) -
                    (c[4] ?? 0) * ((c[6] ?? 0) * (c[11] ?? 0) - (c[8] ?? 0) * (c[9] ?? 0)) +
                    (c[5] ?? 0) * ((c[6] ?? 0) * (c[10] ?? 0) - (c[7] ?? 0) * (c[9] ?? 0));
                if (Math.abs(determinant - 1) > 0.0001) {
                    throw new Error('CFrame rotation must preserve handedness');
                }
                return Object.freeze({
                    kind: 'CFrame',
                    components: Object.freeze(
                        c,
                    ) as import('./RobloxSceneTypes').RobloxCFrame['components'],
                });
            }
        }
    }

    static #array(raw: unknown, limit: number): readonly unknown[] {
        if (!Array.isArray(raw) || raw.length > limit) {
            throw new Error('Invalid Roblox array or resource limit exceeded');
        }
        return raw as readonly unknown[];
    }

    static #times(points: readonly (RobloxNumberKeypoint | RobloxColorKeypoint)[]): void {
        if (points.length < 2 || points[0]?.time !== 0 || points.at(-1)?.time !== 1) {
            throw new Error('Sequences must start at 0 and end at 1');
        }
        for (let index: number = 1; index < points.length; index++) {
            if ((points[index]?.time ?? 0) <= (points[index - 1]?.time ?? 0)) {
                throw new Error('Sequence times must strictly increase');
            }
        }
    }

    static #id(raw: unknown): string {
        const id: string = this.text(raw, 64);
        if (!/^[A-Za-z][A-Za-z0-9_-]*$/u.test(id)) {
            throw new Error('Invalid Roblox identity');
        }
        return id;
    }

    static #node(raw: unknown): RobloxSceneNode {
        const data: Readonly<Record<string, unknown>> = this.record(raw, [
            'id',
            'className',
            'name',
            'parentId',
            'properties',
        ]);
        const className: string = this.text(data['className'], 64);
        if (!Object.hasOwn(RobloxSceneSchema, className)) {
            throw new Error('Unsupported Roblox class: ' + className);
        }
        const supported: RobloxClass = className as RobloxClass;
        const schema: Readonly<Record<string, RobloxPropertySpec>> = RobloxSceneSchema[supported];
        const supplied: Readonly<Record<string, unknown>> = this.record(
            data['properties'],
            [],
            Object.keys(schema),
        );
        const properties: Record<string, RobloxValue> = {};
        for (const [key, spec] of Object.entries(schema)) {
            try {
                properties[key] = this.value(
                    Object.hasOwn(supplied, key) ? supplied[key] : spec.default,
                    spec,
                );
            } catch (error: unknown) {
                throw new Error(
                    className +
                        '.' +
                        key +
                        ': ' +
                        (error instanceof Error ? error.message : 'Invalid value'),
                    { cause: error },
                );
            }
        }
        if (RobloxPartGeometry.isPart(supported)) {
            const size: RobloxValue | undefined = properties['Size'];
            if (
                typeof size !== 'object' ||
                size.kind !== 'Vector3' ||
                Math.min(size.x, size.y, size.z) < 0.001
            ) {
                throw new Error('Part.Size must be positive');
            }
        }
        if (supported === RobloxClass.ParticleEmitter) {
            const angle: RobloxValue | undefined = properties['SpreadAngle'];
            if (
                typeof angle !== 'object' ||
                angle.kind !== 'Vector2' ||
                Math.max(Math.abs(angle.x), Math.abs(angle.y)) > 180
            ) {
                throw new Error('SpreadAngle must be within -180 to 180');
            }
            const texture: RobloxValue | undefined = properties['Texture'];
            if (
                texture !== '' &&
                (typeof texture !== 'string' || !RobloxSceneTextures.assetUri(texture))
            ) {
                throw new Error(
                    'Texture must be empty, an rbxasset image path or an rbxassetid URI',
                );
            }
        }
        return Object.freeze({
            id: this.#id(data['id']),
            className: supported,
            name: this.text(data['name'], 160),
            parentId: data['parentId'] === null ? null : this.#id(data['parentId']),
            properties: Object.freeze(properties),
        });
    }

    static #parent(node: RobloxSceneNode, nodes: ReadonlyMap<string, RobloxSceneNode>): void {
        const parent: RobloxSceneNode | undefined =
            node.parentId === null ? undefined : nodes.get(node.parentId);
        if (node.parentId !== null && parent === undefined) {
            throw new Error('Missing parent for ' + node.id);
        }
        const allowed: Readonly<Record<RobloxClass, readonly RobloxClass[]>> = {
            Folder: ['Folder', 'Model', 'WorldModel', 'Part', 'WedgePart', 'CornerWedgePart'],
            Model: ['Folder', 'Model', 'WorldModel', 'Part', 'WedgePart', 'CornerWedgePart'],
            WorldModel: ['Folder', 'Model', 'WorldModel'],
            Part: ['Folder', 'Model', 'WorldModel', 'Part', 'WedgePart', 'CornerWedgePart'],
            WedgePart: ['Folder', 'Model', 'WorldModel', 'Part', 'WedgePart', 'CornerWedgePart'],
            CornerWedgePart: [
                'Folder',
                'Model',
                'WorldModel',
                'Part',
                'WedgePart',
                'CornerWedgePart',
            ],
            Attachment: ['Part', 'WedgePart', 'CornerWedgePart', 'Attachment'],
            ParticleEmitter: ['Part', 'WedgePart', 'CornerWedgePart', 'Attachment'],
            ScreenGui: ['Folder', 'Model', 'WorldModel'],
            Frame: ['ScreenGui', 'Frame', 'TextLabel', 'TextButton'],
            TextLabel: ['ScreenGui', 'Frame', 'TextLabel', 'TextButton'],
            TextButton: ['ScreenGui', 'Frame', 'TextLabel', 'TextButton'],
            UICorner: ['Frame', 'TextLabel', 'TextButton'],
            UIStroke: ['Frame', 'TextLabel', 'TextButton'],
            UIListLayout: ['Frame', 'TextLabel', 'TextButton'],
            UIPadding: ['Frame', 'TextLabel', 'TextButton'],
        };
        if (
            parent === undefined
                ? ![
                      'Folder',
                      'Model',
                      'WorldModel',
                      'Part',
                      'WedgePart',
                      'CornerWedgePart',
                      'ScreenGui',
                  ].includes(node.className)
                : !allowed[node.className].includes(parent.className)
        ) {
            throw new Error('Invalid parent class for ' + node.id);
        }
        const seen: Set<string> = new Set<string>([node.id]);
        let ancestor: RobloxSceneNode | undefined = parent;
        while (ancestor !== undefined) {
            if (seen.has(ancestor.id) || seen.size > 64) {
                throw new Error('Cyclic or excessively deep Roblox scene');
            }
            seen.add(ancestor.id);
            ancestor = ancestor.parentId === null ? undefined : nodes.get(ancestor.parentId);
        }
    }

    static #event(
        raw: unknown,
        duration: number,
        nodes: ReadonlyMap<string, RobloxSceneNode>,
        initial: readonly RobloxSceneNode[],
        hierarchy: readonly RobloxHierarchyDelta[],
    ): RobloxSceneEvent {
        const header: Readonly<Record<string, unknown>> = this.record(
            raw,
            ['kind', 'nodeId', 'at', 'trigger'],
            ['count', 'duration', 'property', 'to', 'samples', 'emission'],
        );
        const nodeId: string = this.#id(header['nodeId']);
        const node: RobloxSceneNode | undefined = nodes.get(nodeId);
        if (node === undefined) {
            throw new Error('Missing timeline target: ' + nodeId);
        }
        const at: number = this.number(header['at'], 0, duration);
        const trigger: string | null =
            header['trigger'] === null ? null : this.#id(header['trigger']);
        if (trigger !== null && nodes.get(trigger)?.className !== RobloxClass.TextButton) {
            throw new Error('Timeline trigger must be a TextButton');
        }
        if (header['kind'] === 'burst') {
            this.record(raw, ['kind', 'nodeId', 'at', 'trigger', 'count'], ['emission']);
            if (node.className !== RobloxClass.ParticleEmitter) {
                throw new Error('Burst target must be a ParticleEmitter');
            }
            return Object.freeze({
                kind: 'burst',
                nodeId,
                at,
                trigger,
                count: this.number(header['count'], 1, 20000, true),
                ...(header['emission'] === undefined
                    ? {}
                    : {
                          emission: this.#emission(
                              header['emission'],
                              node,
                              nodes,
                              RobloxSceneHierarchy.ancestors(initial, hierarchy, nodeId, at),
                          ),
                      }),
            });
        }
        if (header['kind'] === 'clear') {
            this.record(raw, ['kind', 'nodeId', 'at', 'trigger']);
            if (node.className !== RobloxClass.ParticleEmitter) {
                throw new Error('Clear target must be a ParticleEmitter');
            }
            return Object.freeze({ kind: 'clear', nodeId, at, trigger });
        }
        if (header['kind'] === 'recording') {
            this.record(raw, ['kind', 'nodeId', 'at', 'trigger', 'property', 'samples']);
            if (at !== 0) {
                throw new Error('Recorded property tracks must start at zero');
            }
            const property: string = this.text(header['property'], 64);
            const spec: RobloxPropertySpec | undefined =
                RobloxSceneSchema[node.className][property];
            if (spec === undefined) {
                throw new Error('Unsupported recorded property: ' + property);
            }
            let previous: number = -1;
            const samples: readonly RobloxPropertySample[] = this.#array(
                header['samples'],
                3601,
            ).map((raw: unknown): RobloxPropertySample => {
                const fields: Readonly<Record<string, unknown>> = this.record(raw, ['at', 'value']);
                const at: number = this.number(fields['at'], 0, duration);
                if (at <= previous) {
                    throw new Error('Recorded samples must have strictly increasing timestamps');
                }
                previous = at;
                return Object.freeze({ at, value: this.value(fields['value'], spec) });
            });
            if (samples.length === 0) {
                throw new Error('Recorded property track needs samples');
            }
            return Object.freeze({
                kind: 'recording',
                nodeId,
                at: 0,
                trigger,
                property,
                samples: Object.freeze(samples),
            });
        }
        if (header['kind'] !== 'tween') {
            throw new Error('Unsupported Roblox timeline event');
        }
        this.record(raw, ['kind', 'nodeId', 'at', 'trigger', 'duration', 'property', 'to']);
        const property: string = this.text(header['property'], 64);
        const spec: RobloxPropertySpec | undefined = RobloxSceneSchema[node.className][property];
        if (spec?.tween !== true || property === 'Rate' || property === 'CFrame') {
            throw new Error('Unsupported tween property: ' + property);
        }
        const seconds: number = this.number(header['duration'], 0.001, duration - at);
        return Object.freeze({
            kind: 'tween',
            nodeId,
            at,
            trigger,
            duration: seconds,
            property,
            to: this.value(header['to'], spec),
        });
    }

    static #emission(
        raw: unknown,
        node: RobloxSceneNode,
        nodes: ReadonlyMap<string, RobloxSceneNode>,
        candidates: readonly (readonly string[])[],
    ): RobloxEmissionSnapshot {
        const fields: Readonly<Record<string, unknown>> = this.record(raw, [
            'properties',
            'frames',
        ]);
        const properties: Readonly<Record<string, RobloxValue>> = this.#node({
            ...node,
            properties: fields['properties'],
        }).properties;
        const seen: Set<string> = new Set();
        const frames: readonly RobloxEmissionFrame[] = this.#array(fields['frames'], 64).map(
            (raw: unknown): RobloxEmissionFrame => {
                const frame: Readonly<Record<string, unknown>> = this.record(raw, [
                    'nodeId',
                    'cframe',
                    'size',
                ]);
                const nodeId: string = this.#id(frame['nodeId']);
                const ancestor: RobloxSceneNode | undefined = nodes.get(nodeId);
                if (
                    seen.has(nodeId) ||
                    ancestor === undefined ||
                    !['Attachment', 'Part', 'WedgePart', 'CornerWedgePart'].includes(
                        ancestor.className,
                    )
                ) {
                    throw new Error('Invalid emission ancestor');
                }
                seen.add(nodeId);
                const cframe: RobloxValue = this.value(frame['cframe'], {
                    type: 'CFrame',
                    default: false,
                });
                const size: RobloxValue | null =
                    frame['size'] === null
                        ? null
                        : this.value(frame['size'], { type: 'Vector3', default: false });
                if (
                    typeof cframe !== 'object' ||
                    cframe.kind !== 'CFrame' ||
                    (size !== null && (typeof size !== 'object' || size.kind !== 'Vector3'))
                ) {
                    throw new Error('Invalid emission pose');
                }
                if (
                    (RobloxPartGeometry.isPart(ancestor.className) &&
                        (size === null || Math.min(size.x, size.y, size.z) < 0.001)) ||
                    (ancestor.className === RobloxClass.Attachment && size !== null)
                ) {
                    throw new Error('Invalid emission dimensions');
                }
                return Object.freeze({ nodeId, cframe, size });
            },
        );
        if (
            !candidates.some(
                (chain: readonly string[]): boolean =>
                    chain.length === frames.length &&
                    chain.every(
                        (id: string, index: number): boolean => frames[index]?.nodeId === id,
                    ),
            )
        ) {
            throw new Error('Emission snapshot needs all ancestor poses');
        }
        return Object.freeze({ properties, frames: Object.freeze(frames) });
    }
}
