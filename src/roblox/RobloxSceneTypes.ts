// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Native Roblox property encodings shared by the authoring, export and preview engines. */
export const RobloxValueKind = {
    Vector2: 'Vector2',
    Vector3: 'Vector3',
    Color3: 'Color3',
    UDim: 'UDim',
    UDim2: 'UDim2',
    NumberRange: 'NumberRange',
    NumberSequence: 'NumberSequence',
    ColorSequence: 'ColorSequence',
    CFrame: 'CFrame',
    Enum: 'Enum',
} as const;
/** Property discriminator. */
export type RobloxValueKind = (typeof RobloxValueKind)[keyof typeof RobloxValueKind];
/** Two component vector. */
export interface RobloxVector2 {
    readonly kind: 'Vector2';
    readonly x: number;
    readonly y: number;
}
/** Three component vector in studs. */
export interface RobloxVector3 {
    readonly kind: 'Vector3';
    readonly x: number;
    readonly y: number;
    readonly z: number;
}
/** Linear RGB color with components from zero to one. */
export interface RobloxColor3 {
    readonly kind: 'Color3';
    readonly r: number;
    readonly g: number;
    readonly b: number;
}
/** Scale and pixel offset. */
export interface RobloxUDim {
    readonly kind: 'UDim';
    readonly scale: number;
    readonly offset: number;
}
/** Scale and pixel offset on each axis. */
export interface RobloxUDim2 {
    readonly kind: 'UDim2';
    readonly xScale: number;
    readonly xOffset: number;
    readonly yScale: number;
    readonly yOffset: number;
}
/** Bounded native number range. */
export interface RobloxNumberRange {
    readonly kind: 'NumberRange';
    readonly min: number;
    readonly max: number;
}
/** Native scalar sequence keypoint. */
export interface RobloxNumberKeypoint {
    readonly time: number;
    readonly value: number;
    readonly envelope: number;
}
/** Native color sequence keypoint. */
export interface RobloxColorKeypoint {
    readonly time: number;
    readonly color: RobloxColor3;
}
/** Native scalar sequence over normalized particle age. */
export interface RobloxNumberSequence {
    readonly kind: 'NumberSequence';
    readonly points: readonly RobloxNumberKeypoint[];
}
/** Native RGB sequence over normalized particle age. */
export interface RobloxColorSequence {
    readonly kind: 'ColorSequence';
    readonly points: readonly RobloxColorKeypoint[];
}
/** Position and row-major orthonormal rotation matrix, matching native CFrame components. */
export interface RobloxCFrame {
    readonly kind: 'CFrame';
    readonly components: readonly [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
    ];
}
/** Native enum value; the property schema determines the enum family. */
export interface RobloxEnum {
    readonly kind: 'Enum';
    readonly value: number;
}
/** Supported native values. External inputs must pass RobloxSceneCodec. */
export type RobloxValue =
    | string
    | number
    | boolean
    | RobloxVector2
    | RobloxVector3
    | RobloxColor3
    | RobloxUDim
    | RobloxUDim2
    | RobloxNumberRange
    | RobloxNumberSequence
    | RobloxColorSequence
    | RobloxCFrame
    | RobloxEnum;
/** Explicit supported instance classes. */
export const RobloxClass = {
    Folder: 'Folder',
    Model: 'Model',
    WorldModel: 'WorldModel',
    Part: 'Part',
    WedgePart: 'WedgePart',
    CornerWedgePart: 'CornerWedgePart',
    Attachment: 'Attachment',
    ParticleEmitter: 'ParticleEmitter',
    ScreenGui: 'ScreenGui',
    Frame: 'Frame',
    TextLabel: 'TextLabel',
    TextButton: 'TextButton',
    UICorner: 'UICorner',
    UIStroke: 'UIStroke',
    UIListLayout: 'UIListLayout',
    UIPadding: 'UIPadding',
} as const;
/** Supported instance class. */
export type RobloxClass = (typeof RobloxClass)[keyof typeof RobloxClass];
/** Flat instance record with stable identity independent of Roblox Name. */
export interface RobloxSceneNode {
    readonly id: string;
    readonly className: RobloxClass;
    readonly name: string;
    readonly parentId: string | null;
    readonly properties: Readonly<Record<string, RobloxValue>>;
}
/** Deterministic preview camera, in studs. */
export interface RobloxSceneCamera {
    readonly position: RobloxVector3;
    readonly target: RobloxVector3;
    readonly fieldOfView: number;
}
/** Explicit emission command; null trigger means the main playback timeline. */
export interface RobloxBurst {
    readonly kind: 'burst';
    readonly nodeId: string;
    readonly at: number;
    readonly count: number;
    readonly trigger: string | null;
    readonly emission?: RobloxEmissionSnapshot;
}
/** Native ancestor pose and dimensions at the exact Emit call. */
export interface RobloxEmissionFrame {
    readonly nodeId: string;
    readonly cframe: RobloxCFrame;
    readonly size: RobloxVector3 | null;
}
/** Birth inputs that may differ from the values observed at the end of a frame. */
export interface RobloxEmissionSnapshot {
    readonly properties: Readonly<Record<string, RobloxValue>>;
    readonly frames: readonly RobloxEmissionFrame[];
}
/** Removes existing particles while preserving subsequent emission, including at the same time. */
export interface RobloxParticleClear {
    readonly kind: 'clear';
    readonly nodeId: string;
    readonly at: number;
    readonly trigger: string | null;
}
/** Linear native property animation, evaluated from the previous value on the same track. */
export interface RobloxTween {
    readonly kind: 'tween';
    readonly nodeId: string;
    readonly at: number;
    readonly duration: number;
    readonly property: string;
    readonly to: RobloxValue;
    readonly trigger: string | null;
}
/** Timeline operation. */
/** Native property observation at a simulation timestamp. */
export interface RobloxPropertySample {
    readonly at: number;
    readonly value: RobloxValue;
}
/** Step playback of real VM observations; values between observations are held. */
export interface RobloxRecording {
    readonly kind: 'recording';
    readonly nodeId: string;
    readonly at: 0;
    readonly trigger: string | null;
    readonly property: string;
    readonly samples: readonly RobloxPropertySample[];
}
/** Timeline operation. */
export type RobloxSceneEvent = RobloxBurst | RobloxParticleClear | RobloxTween | RobloxRecording;
/** Portable authoring artifact. Version 1 rejects unsupported properties rather than silently dropping them. */
export interface RobloxScene {
    readonly format: 'nexa.roblox.scene';
    readonly version: 1;
    readonly name: string;
    readonly duration: number;
    readonly seed: number;
    readonly camera: RobloxSceneCamera;
    readonly nodes: readonly RobloxSceneNode[];
    readonly events: readonly RobloxSceneEvent[];
    readonly inputs?: readonly RobloxInputObservation[];
}

/** Logical input events whose callbacks run in the native VM. Pointer hit testing is separate. */
export const RobloxInputEvent = {
    Activated: 'Activated',
    MouseButton1Click: 'MouseButton1Click',
} as const;
export type RobloxInputEvent = (typeof RobloxInputEvent)[keyof typeof RobloxInputEvent];
export const RobloxInputDevice = { Mouse: 'Mouse', Touch: 'Touch', Gamepad: 'Gamepad' } as const;
export type RobloxInputDevice = (typeof RobloxInputDevice)[keyof typeof RobloxInputDevice];
/** A recognized logical activation, relative to the native recording start. */
export interface RobloxInputRequest {
    readonly nodeId: string;
    readonly at: number;
    readonly event?: RobloxInputEvent;
    readonly device?: RobloxInputDevice;
    readonly x?: number;
    readonly y?: number;
    readonly clickCount?: number;
}
/** Native dispatch evidence; timestamps distinguish requested time from the fixed simulation frame. */
export interface RobloxInputObservation {
    readonly nodeId: string;
    readonly at: number;
    readonly requestedAt: number;
    readonly event: RobloxInputEvent;
    readonly device: RobloxInputDevice;
    readonly x: number;
    readonly y: number;
    readonly clickCount: number;
    readonly accepted: boolean;
}
