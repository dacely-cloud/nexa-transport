// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxClass, RobloxValue, RobloxValueKind } from './RobloxSceneTypes';

/** Official native Enum.Material values retained in previews and Studio exports. */
export const RobloxMaterial = {
    Plastic: 256,
    SmoothPlastic: 272,
    Neon: 288,
    Wood: 512,
    WoodPlanks: 528,
    Marble: 784,
    Basalt: 788,
    Slate: 800,
    CrackedLava: 804,
    Concrete: 816,
    Limestone: 820,
    Granite: 832,
    Pavement: 836,
    Brick: 848,
    Pebble: 864,
    Cobblestone: 880,
    Rock: 896,
    Sandstone: 912,
    CorrodedMetal: 1040,
    DiamondPlate: 1056,
    Foil: 1072,
    Metal: 1088,
    Grass: 1280,
    LeafyGrass: 1284,
    Sand: 1296,
    Fabric: 1312,
    Snow: 1328,
    Mud: 1344,
    Ground: 1360,
    Asphalt: 1376,
    Salt: 1392,
    Ice: 1536,
    Glacier: 1552,
    Glass: 1568,
    ForceField: 1584,
    Air: 1792,
    Water: 2048,
    Cardboard: 2304,
    Carpet: 2305,
    CeramicTiles: 2306,
    ClayRoofTiles: 2307,
    RoofShingles: 2308,
    Leather: 2309,
    Plaster: 2310,
    Rubber: 2311,
} as const;

/** Portable native property validation metadata. */
export interface RobloxPropertySpec {
    /** Permits explicit positive-infinity flags only on bound vectors such as MaxSize. */
    readonly unbounded?: boolean;
    readonly default: RobloxValue;
    readonly type: RobloxValueKind | 'number' | 'boolean' | 'string';
    readonly min?: number;
    readonly max?: number;
    readonly enumValues?: readonly number[];
    /** Exact Roblox enum family; property names are not enum family names. */
    readonly enumFamily?: string;
    readonly xmlName?: string;
    readonly xmlType?: string;
    readonly tween?: boolean;
}
/** Constructors for fully explicit portable native datatypes. */
export class RobloxValues {
    /** Three component position or direction. */
    public static vector3(
        x: number = 0,
        y: number = 0,
        z: number = 0,
    ): import('./RobloxSceneTypes').RobloxVector3 {
        return { kind: 'Vector3', x, y, z };
    }
    /** RGB color. */
    public static color(
        r: number = 1,
        g: number = 1,
        b: number = 1,
    ): import('./RobloxSceneTypes').RobloxColor3 {
        return { kind: 'Color3', r, g, b };
    }
    /** Constant scalar sequence. */
    public static sequence(value: number): import('./RobloxSceneTypes').RobloxNumberSequence {
        return {
            kind: 'NumberSequence',
            points: [
                { time: 0, value, envelope: 0 },
                { time: 1, value, envelope: 0 },
            ],
        };
    }
    /** Scale and offset rectangle. */
    public static udim2(
        xScale: number = 0,
        xOffset: number = 0,
        yScale: number = 0,
        yOffset: number = 0,
    ): import('./RobloxSceneTypes').RobloxUDim2 {
        return { kind: 'UDim2', xScale, xOffset, yScale, yOffset };
    }
    /** Identity rotation with translation. */
    public static cframe(
        x: number = 0,
        y: number = 0,
        z: number = 0,
    ): import('./RobloxSceneTypes').RobloxCFrame {
        return { kind: 'CFrame', components: [x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1] };
    }
}

const n: (value: number, min?: number, max?: number, xmlType?: string) => RobloxPropertySpec = (
    value: number,
    min: number = -100000,
    max: number = 100000,
    xmlType: string = 'float',
): RobloxPropertySpec => ({ type: 'number', default: value, min, max, xmlType, tween: true });
const b: (value: boolean) => RobloxPropertySpec = (value: boolean): RobloxPropertySpec => ({
    type: 'boolean',
    default: value,
});
const s: (value: string) => RobloxPropertySpec = (value: string): RobloxPropertySpec => ({
    type: 'string',
    default: value,
});
const v: (
    value: Exclude<RobloxValue, string | number | boolean>,
    tween?: boolean,
) => RobloxPropertySpec = (
    value: Exclude<RobloxValue, string | number | boolean>,
    tween: boolean = false,
): RobloxPropertySpec => ({ type: value.kind, default: value, tween });
const e: (value: number, values: readonly number[], family: string) => RobloxPropertySpec = (
    value: number,
    values: readonly number[],
    family: string,
): RobloxPropertySpec => ({
    enumFamily: family,
    type: 'Enum',
    default: { kind: 'Enum', value },
    enumValues: values,
});
const gui: Readonly<Record<string, RobloxPropertySpec>> = {
    AutomaticSize: e(0, [0, 1, 2, 3], 'AutomaticSize'),
    Position: v(RobloxValues.udim2(), true),
    Size: v(RobloxValues.udim2(0, 100, 0, 100), true),
    AnchorPoint: v({ kind: 'Vector2', x: 0, y: 0 }, true),
    BackgroundColor3: v(RobloxValues.color(), true),
    BackgroundTransparency: n(0, 0, 1),
    BorderSizePixel: n(0, 0, 32, 'int'),
    Visible: b(true),
    ClipsDescendants: b(false),
    Rotation: n(0, -36000, 36000),
    ZIndex: n(1, 1, 10000, 'int'),
    LayoutOrder: { ...n(0, -2147483648, 2147483647, 'int'), tween: false },
};
const text: Readonly<Record<string, RobloxPropertySpec>> = {
    ...gui,
    Text: s(''),
    TextColor3: v(RobloxValues.color(0, 0, 0), true),
    TextTransparency: n(0, 0, 1),
    TextSize: n(20, 1, 100),
    TextWrapped: b(false),
    TextXAlignment: e(2, [0, 1, 2], 'TextXAlignment'),
    TextYAlignment: e(1, [0, 1, 2], 'TextYAlignment'),
    Font: e(0, [0], 'Font'),
};

const part: Readonly<Record<string, RobloxPropertySpec>> = {
    CFrame: v(RobloxValues.cframe(), true),
    Size: v(RobloxValues.vector3(4, 1.2, 2), true),
    Color: {
        ...v(RobloxValues.color(0.64, 0.64, 0.64), true),
        xmlName: 'Color3uint8',
        xmlType: 'Color3uint8',
    },
    Transparency: n(0, 0, 1),
    Anchored: b(true),
    CanCollide: b(false),
    CastShadow: b(true),
    Material: e(RobloxMaterial.Plastic, Object.values(RobloxMaterial), 'Material'),
};

const image: Readonly<Record<string, RobloxPropertySpec>> = {
    ...gui,
    Image: { ...s(''), xmlType: 'ContentId' },
    ImageColor3: v(RobloxValues.color(), true),
    ImageTransparency: n(0, 0, 1),
    ImageRectOffset: v({ kind: 'Vector2', x: 0, y: 0 }, true),
    ImageRectSize: v({ kind: 'Vector2', x: 0, y: 0 }, true),
    ScaleType: e(0, [0, 1, 2, 3, 4], 'ScaleType'),
    ResampleMode: e(0, [0, 1], 'ResamplerMode'),
    SliceCenter: v({ kind: 'Rect', minX: 0, minY: 0, maxX: 0, maxY: 0 }),
    SliceScale: n(1, 0, 100),
    TileSize: v(RobloxValues.udim2(1, 0, 1, 0), true),
};

/** One property registry supplies validation, normalization and native XML serialization. */
export const RobloxSceneSchema: Readonly<
    Record<RobloxClass, Readonly<Record<string, RobloxPropertySpec>>>
> = {
    Folder: {},
    Model: {},
    WorldModel: {},
    Part: { ...part, Shape: e(1, [0, 1, 2, 3, 4], 'PartType') },
    WedgePart: part,
    CornerWedgePart: { ...part, Size: v(RobloxValues.vector3(2, 2, 2), true) },
    Attachment: { CFrame: v(RobloxValues.cframe(), true) },
    ParticleEmitter: {
        Enabled: b(true),
        Rate: n(20, 0, 1000),
        Lifetime: { ...v({ kind: 'NumberRange', min: 1, max: 1 }), min: 0, max: 20 },
        Speed: { ...v({ kind: 'NumberRange', min: 5, max: 5 }), min: -1000, max: 1000 },
        Acceleration: v(RobloxValues.vector3(), true),
        Drag: n(0, -100, 100),
        TimeScale: n(1, 0, 1),
        Shape: e(0, [0, 1, 2, 3], 'ParticleEmitterShape'),
        ShapeStyle: e(0, [0, 1], 'ParticleEmitterShapeStyle'),
        ShapeInOut: e(0, [0, 1, 2], 'ParticleEmitterShapeInOut'),
        ShapePartial: n(1, 0, 1),
        SpreadAngle: v({ kind: 'Vector2', x: 0, y: 0 }),
        Size: { ...v(RobloxValues.sequence(1)), min: 0, max: 1000 },
        Transparency: { ...v(RobloxValues.sequence(0)), min: 0, max: 1 },
        Color: v({
            kind: 'ColorSequence',
            points: [
                { time: 0, color: RobloxValues.color() },
                { time: 1, color: RobloxValues.color() },
            ],
        }),
        Rotation: { ...v({ kind: 'NumberRange', min: 0, max: 0 }), min: -36000, max: 36000 },
        RotSpeed: { ...v({ kind: 'NumberRange', min: 0, max: 0 }), min: -36000, max: 36000 },
        LightEmission: n(0, 0, 1),
        LightInfluence: n(0, 0, 1),
        Texture: { ...s('rbxasset://textures/particles/sparkles_main.dds'), xmlType: 'ContentId' },
        EmissionDirection: e(1, [0, 1, 2, 3, 4, 5], 'NormalId'),
        LockedToPart: b(false),
        Orientation: e(0, [0, 1, 2, 3], 'ParticleOrientation'),
        FlipbookLayout: e(0, [0, 1, 2, 3, 4], 'ParticleFlipbookLayout'),
        FlipbookMode: e(0, [0, 1, 2, 3], 'ParticleFlipbookMode'),
        FlipbookFramerate: { ...v({ kind: 'NumberRange', min: 1, max: 1 }), min: 0, max: 30 },
        FlipbookBlendFrames: b(true),
        FlipbookStartRandom: b(false),
        FlipbookSizeX: n(1, 1, 16, 'int'),
        FlipbookSizeY: n(1, 1, 16, 'int'),
    },
    ScreenGui: {
        Enabled: b(true),
        IgnoreGuiInset: b(true),
        ResetOnSpawn: b(false),
        DisplayOrder: n(0, 0, 10000, 'int'),
        ZIndexBehavior: e(1, [0, 1], 'ZIndexBehavior'),
    },
    Frame: gui,
    TextLabel: text,
    TextButton: { ...text, AutoButtonColor: b(false), Active: b(true), Interactable: b(true) },
    ImageLabel: image,
    ImageButton: {
        ...image,
        AutoButtonColor: b(false),
        Active: b(true),
        Interactable: b(true),
        HoverImage: { ...s(''), xmlType: 'ContentId' },
        PressedImage: { ...s(''), xmlType: 'ContentId' },
    },
    UICorner: { CornerRadius: v({ kind: 'UDim', scale: 0, offset: 8 }) },
    UIPadding: {
        PaddingLeft: v({ kind: 'UDim', scale: 0, offset: 0 }, true),
        PaddingRight: v({ kind: 'UDim', scale: 0, offset: 0 }, true),
        PaddingTop: v({ kind: 'UDim', scale: 0, offset: 0 }, true),
        PaddingBottom: v({ kind: 'UDim', scale: 0, offset: 0 }, true),
    },
    UIAspectRatioConstraint: {
        AspectRatio: n(1, 1.401298464324817e-45, 3.4028234663852886e38),
        AspectType: e(0, [0, 1], 'AspectType'),
        DominantAxis: e(0, [0, 1], 'DominantAxis'),
    },
    UISizeConstraint: {
        MinSize: { ...v({ kind: 'Vector2', x: 0, y: 0 }, true), min: 0, max: 16384 },
        MaxSize: {
            ...v({ kind: 'Vector2', x: 0, y: 0, xUnbounded: true, yUnbounded: true }, true),
            min: 0,
            max: 16384,
            unbounded: true,
        },
    },
    UIListLayout: {
        FillDirection: e(1, [0, 1], 'FillDirection'),
        SortOrder: e(0, [0, 2], 'SortOrder'),
        HorizontalAlignment: e(1, [0, 1, 2], 'HorizontalAlignment'),
        VerticalAlignment: e(1, [0, 1, 2], 'VerticalAlignment'),
        Padding: v({ kind: 'UDim', scale: 0, offset: 0 }, true),
        HorizontalFlex: e(0, [0, 1, 2, 3, 4], 'UIFlexAlignment'),
        VerticalFlex: e(0, [0, 1, 2, 3, 4], 'UIFlexAlignment'),
        ItemLineAlignment: e(0, [0, 1, 2, 3, 4], 'ItemLineAlignment'),
        Wraps: b(false),
    },
    UIStroke: {
        Color: v(RobloxValues.color(0, 0, 0), true),
        Thickness: n(1, 0, 32),
        Transparency: n(0, 0, 1),
        Enabled: b(true),
        ApplyStrokeMode: e(0, [0, 1], 'ApplyStrokeMode'),
    },
};
