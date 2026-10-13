// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxSceneNode } from './RobloxSceneTypes';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxGuiClasses } from './RobloxGuiClasses';

/** Explicit preview fidelity findings, also delivered to the authoring model. */
export class RobloxSceneDiagnostics {
    /** Reports current renderer limits without claiming Studio fidelity. */
    public static preview(scene: RobloxScene, native: boolean = false): readonly string[] {
        const nodes: readonly RobloxSceneNode[] = [...RobloxSceneHierarchy.catalog(scene).values()];
        const findings: string[] = [
            native
                ? 'Capture uses hardware Vulkan with approximated Roblox materials and lighting. Studio pixel fidelity has not been measured.'
                : 'Preview uses a WebGL approximation of Roblox lighting and materials. Studio pixel fidelity has not been measured.',
        ];
        if (
            nodes.some((node: RobloxSceneNode): boolean => RobloxGuiClasses.image(node.className))
        ) {
            findings.push(
                'ImageLabel and ImageButton display original image texels with sprite cropping, tint, transparency, Stretch/Fit/Crop/Tile/nine-slice layout and smooth or pixelated sampling. ImageButton logical activations execute native callbacks. Hover/pressed visual switching, EditableImage loading and Studio edge-pixel calibration remain unfinished.',
            );
        }
        if (
            nodes.some(
                (node: import('./RobloxSceneTypes').RobloxSceneNode): boolean =>
                    node.className === 'ParticleEmitter',
            )
        ) {
            const textures: string =
                scene.textures === undefined
                    ? 'Particle sprites sample Roblox’s shipped default resource texels. Additional rbxasset image paths require resource resolution; custom asset IDs require authenticated texture resolution.'
                    : 'Particle sprites sample original shipped or downloaded Roblox image texels from one lossless atlas.';
            findings.push(
                textures +
                    ' Missing texture bytes produce an error. Loop/OneShot/PingPong/Random flipbooks and custom grids use deterministic playback with optional linear frame crossfades. Current size, color, transparency, texture, LightEmission and Orientation apply to living particles. FacingCamera, FacingCameraWorldUp, VelocityParallel and VelocityPerpendicular share world-space quad axes, with finite zero-velocity fallback and two-sided rendering. Acceleration, signed exponential drag and TimeScale changes affect living particles; recorded observations are held exactly and authored force tweens use 60 Hz intervals. Box, Sphere, Cylinder and Disc shapes support volume/surface sampling, partial regions, inward/outward emission and all six NormalId axes. LockedToPart follows recorded parent translation/rotation even while paused; release preserves current position and velocity direction. Velocity inheritance, wind, native particle RNG and exact Studio lock/shape/pixel calibration remain unfinished.',
            );
        }
        const emitterIds: ReadonlySet<string> = new Set(
            nodes
                .filter(
                    (node: import('./RobloxSceneTypes').RobloxSceneNode): boolean =>
                        node.className === 'ParticleEmitter',
                )
                .map((node: import('./RobloxSceneTypes').RobloxSceneNode): string => node.id),
        );
        if (
            scene.events.some(
                (event: import('./RobloxSceneTypes').RobloxSceneEvent): boolean =>
                    event.kind === 'recording' &&
                    emitterIds.has(event.nodeId) &&
                    ![
                        'Rate',
                        'Enabled',
                        'Lifetime',
                        'Speed',
                        'Rotation',
                        'RotSpeed',
                        'SpreadAngle',
                        'EmissionDirection',
                        'Shape',
                        'ShapeStyle',
                        'ShapeInOut',
                        'ShapePartial',
                        'Acceleration',
                        'Drag',
                        'TimeScale',
                        'LockedToPart',
                        'Size',
                        'Color',
                        'Transparency',
                        'Texture',
                        'LightEmission',
                        'Orientation',
                        'FlipbookLayout',
                        'FlipbookMode',
                        'FlipbookFramerate',
                        'FlipbookStartRandom',
                        'FlipbookBlendFrames',
                        'FlipbookSizeX',
                        'FlipbookSizeY',
                    ].includes(event.property),
            )
        ) {
            findings.push(
                'Some observed emitter properties are preserved in Studio replay but are not evaluated by the preview. LightInfluence remains unfinished.',
            );
        }
        if (
            scene.nodes.some(
                (node: import('./RobloxSceneTypes').RobloxSceneNode): boolean =>
                    node.className === 'ScreenGui',
            )
        ) {
            findings.push(
                native
                    ? 'Native UI composes rounded backgrounds, strokes and glyphs on Vulkan using the original pinned Roblox LegacyArial Arimo face (or an explicit NEXA_ROBLOX_LEGACY_FONT override). OpenType pair/class kerning and AutomaticSize use measured font units. Other native fonts, complex shaping, insets, DPI and Studio pixels remain uncalibrated.'
                    : 'UI shares scale/offset, anchors, rotation, corner radii, clipping and AutomaticSize layout. New original-font scenes register the same pinned Roblox LegacyArial Arimo bytes as native rendering; old measurement scenes and host overrides retain browser Arial. Other font families, complex shaping, insets, DPI and Studio pixels remain uncalibrated.',
            );
        }
        if ((scene.inputs?.length ?? 0) > 0) {
            findings.push(
                'Input traces are observations from actual native callbacks. The viewer and Studio replay captured results; a live browser VM session and pointer hit testing remain unfinished.',
            );
        }
        if (
            scene.nodes.some(
                (node: import('./RobloxSceneTypes').RobloxSceneNode): boolean =>
                    node.className === 'UIListLayout',
            )
        ) {
            findings.push(
                'List layout supports rows/columns, Name/LayoutOrder sorting, alignment, wrapping and flex spacing. AutomaticSize uses natural list extents independently of alignment slack. UIFlexItem rules and native AbsoluteSize/AbsoluteContentSize observation remain unfinished; Studio flex pixels are not calibrated yet.',
            );
        }
        const textParents: ReadonlySet<string> = new Set(
            scene.nodes
                .filter((node: RobloxSceneNode): boolean =>
                    ['TextLabel', 'TextButton'].includes(node.className),
                )
                .map((node: RobloxSceneNode): string => node.id),
        );
        if (
            scene.nodes.some(
                (node: RobloxSceneNode): boolean =>
                    node.className === 'UIPadding' &&
                    node.parentId !== null &&
                    textParents.has(node.parentId),
            )
        ) {
            findings.push(
                'UIPadding applies to child layout, automatic sizing and the parent text rectangle. Studio padding pixels remain uncalibrated.',
            );
        }
        return Object.freeze(findings);
    }
}
