// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RobloxValues } from './RobloxSceneSchema';
import { RobloxSceneCodec } from './RobloxSceneCodec';
import type { RobloxScene } from './RobloxSceneTypes';

/** Editable examples exercise one shared artifact through both native export and interactive preview. */
export class RobloxSceneExamples {
    /** A layered cyan impact with a responsive control that triggers an orange variation. */
    public static impact(): RobloxScene {
        return RobloxSceneCodec.decode({
            format: 'nexa.roblox.scene', version: 1, name: 'Pulse impact', duration: 4, seed: 41841,
            camera: { position: RobloxValues.vector3(14, 10, 18), target: RobloxValues.vector3(0, 2, 0), fieldOfView: 55 },
            nodes: [
                { id: 'ground', className: 'Part', name: 'Ground', parentId: null, properties: { CFrame: RobloxValues.cframe(0, -0.3, 0), Size: RobloxValues.vector3(24, 0.5, 24), Color: RobloxValues.color(0.04, 0.065, 0.09) } },
                { id: 'core', className: 'Part', name: 'Core flash', parentId: null, properties: { CFrame: RobloxValues.cframe(0, 2, 0), Size: RobloxValues.vector3(0.8, 0.8, 0.8), Color: RobloxValues.color(0.25, 0.9, 1), Shape: { kind: 'Enum', value: 0 }, Material: { kind: 'Enum', value: 288 } } },
                { id: 'origin', className: 'Attachment', name: 'Impact origin', parentId: 'core', properties: {} },
                { id: 'sparks', className: 'ParticleEmitter', name: 'Cyan sparks', parentId: 'origin', properties: { Enabled: false, Rate: 0, Lifetime: { kind: 'NumberRange', min: 0.6, max: 1.8 }, Speed: { kind: 'NumberRange', min: 5, max: 15 }, SpreadAngle: { kind: 'Vector2', x: 180, y: 180 }, Acceleration: RobloxValues.vector3(0, -8, 0), Drag: 1, LightEmission: 0.8, Color: { kind: 'ColorSequence', points: [{ time: 0, color: RobloxValues.color(0.5, 1, 1) }, { time: 1, color: RobloxValues.color(0.02, 0.25, 1) }] }, Size: { kind: 'NumberSequence', points: [{ time: 0, value: 0.45, envelope: 0.1 }, { time: 1, value: 0, envelope: 0 }] }, Transparency: { kind: 'NumberSequence', points: [{ time: 0, value: 0, envelope: 0 }, { time: 0.7, value: 0.2, envelope: 0 }, { time: 1, value: 1, envelope: 0 }] } } },
                { id: 'ui', className: 'ScreenGui', name: 'Impact controls', parentId: null, properties: {} },
                { id: 'card', className: 'Frame', name: 'Control panel', parentId: 'ui', properties: { Position: RobloxValues.udim2(0, 24, 1, -24), Size: RobloxValues.udim2(0, 300, 0, 102), AnchorPoint: { kind: 'Vector2', x: 0, y: 1 }, BackgroundColor3: RobloxValues.color(0.035, 0.055, 0.09), BackgroundTransparency: 0.1 } },
                { id: 'corner', className: 'UICorner', name: 'Round corners', parentId: 'card', properties: {} },
                { id: 'title', className: 'TextLabel', name: 'Effect title', parentId: 'card', properties: { Position: RobloxValues.udim2(0, 16, 0, 8), Size: RobloxValues.udim2(1, -32, 0, 30), BackgroundTransparency: 1, Text: 'PULSE IMPACT', TextColor3: RobloxValues.color(0.75, 0.9, 1), TextSize: 18, TextXAlignment: { kind: 'Enum', value: 0 } } },
                { id: 'replay', className: 'TextButton', name: 'Replay attack', parentId: 'card', properties: { Position: RobloxValues.udim2(0, 16, 0, 48), Size: RobloxValues.udim2(1, -32, 0, 38), BackgroundColor3: RobloxValues.color(0.03, 0.35, 0.5), Text: 'TRIGGER ATTACK', TextColor3: RobloxValues.color(0.8, 1, 1), TextSize: 16 } },
                { id: 'buttonCorner', className: 'UICorner', name: 'Button corners', parentId: 'replay', properties: { CornerRadius: { kind: 'UDim', scale: 0, offset: 4 } } },
            ],
            events: [
                { kind: 'burst', nodeId: 'sparks', at: 0, count: 180, trigger: null },
                { kind: 'tween', nodeId: 'core', at: 0, duration: 0.7, property: 'Size', to: RobloxValues.vector3(5, 5, 5), trigger: null },
                { kind: 'tween', nodeId: 'core', at: 0, duration: 0.9, property: 'Transparency', to: 1, trigger: null },
                { kind: 'burst', nodeId: 'sparks', at: 0, count: 300, trigger: 'replay' },
                { kind: 'tween', nodeId: 'core', at: 0, duration: 1, property: 'Size', to: RobloxValues.vector3(8, 8, 8), trigger: 'replay' },
                { kind: 'tween', nodeId: 'core', at: 0, duration: 1.2, property: 'Transparency', to: 1, trigger: 'replay' },
                { kind: 'tween', nodeId: 'replay', at: 0, duration: 0.4, property: 'BackgroundColor3', to: RobloxValues.color(0.15, 0.7, 0.8), trigger: 'replay' },
            ],
        });
    }
}
