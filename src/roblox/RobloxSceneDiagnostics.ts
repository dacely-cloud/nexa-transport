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
        if (nodes.some((node: RobloxSceneNode): boolean => node.className === 'MeshPart')) {
            findings.push(
                'Imported MeshParts use original FileMesh positions, normals, vertex colors and highest-quality indexed topology. Original MeshSize stays fixed while Size and CFrame animate. TextureID resolves original image texels; mesh UVs wrap within their own atlas rectangle after fragment interpolation. DoubleSided controls reverse faces. Replay clones imported templates instead of assigning read-only MeshId/MeshSize. Missing mesh or texture bytes fail explicitly. Renderer checks do not certify Studio pixel parity. Native AssetService mesh creation, mesh collision fidelity, adaptive LOD selection, bones/skinning, facial animation, exact materials and Studio pixel calibration remain unfinished.',
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
                    ' Missing texture bytes produce an error. Loop/OneShot/PingPong/Random flipbooks and custom grids use deterministic playback with optional linear frame crossfades. Current size, color, transparency, texture, LightEmission, unlit Brightness and Orientation apply to living particles. Brightness scales RGB before texture/opacity compositing when LightInfluence is zero; environment-lit particle illumination remains unfinished. FacingCamera, FacingCameraWorldUp, VelocityParallel and VelocityPerpendicular share world-space quad axes, with finite zero-velocity fallback and two-sided rendering. Acceleration, signed exponential drag and TimeScale changes affect living particles; recorded observations are held exactly and authored force tweens use 60 Hz intervals. Box, Sphere, Cylinder and Disc shapes support volume/surface sampling, partial regions, inward/outward emission and all six NormalId axes. LockedToPart follows recorded parent translation/rotation even while paused; release preserves current position and velocity direction. WindAffectsDrag follows held Workspace.GlobalWind observations with positive drag. Native particle RNG and exact Studio wind/lock/shape/pixel calibration remain unfinished.',
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
                        'WindAffectsDrag',
                        'TimeScale',
                        'LockedToPart',
                        'Size',
                        'Squash',
                        'Color',
                        'Transparency',
                        'LocalTransparencyModifier',
                        'Texture',
                        'Brightness',
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
                'Input traces preserve actual native callbacks. Offline scenes and Studio packs replay captured results; live Chat panels dispatch logical inputs and mouse/touch gestures to retained VMs with scoped native coordinate picking and pointer capture. Studio event-order calibration remains unfinished.',
            );
        }
        if (
            scene.nodes.some(
                (node: import('./RobloxSceneTypes').RobloxSceneNode): boolean =>
                    node.className === 'UIListLayout',
            )
        ) {
            findings.push(
                'List layout supports rows/columns, Name/LayoutOrder sorting, alignment, wrapping and flex spacing. AutomaticSize uses natural list extents independently of alignment slack. Native AbsoluteSize and AbsoluteContentSize observations use the actual hierarchy. UIFlexItem rules and Studio flex pixels remain uncalibrated.',
            );
        }
        if (nodes.some((node: RobloxSceneNode): boolean => node.className === 'UIScale')) {
            findings.push(
                'UIScale projects inherited dimensions, fractional offsets, text, padding and visual modifiers without changing authored properties. Recorded scale changes reflow descendants and native derived-property signals. Multiple-scale priority and combined scale/aspect/automatic/flex behavior require Studio measurements; pixel fidelity remains unmeasured.',
            );
        }
        if (nodes.some((node: RobloxSceneNode): boolean => node.className === 'UISizeConstraint')) {
            findings.push(
                'UISizeConstraint clamps authored, automatic and flex dimensions independently on each axis. Native unbounded defaults survive JSON, Luau and Studio XML export. Recorded limit changes reflow siblings. Multiple-constraint priority, flex slack redistribution and Studio constraint pixels remain uncalibrated.',
            );
        }
        if (
            nodes.some(
                (node: RobloxSceneNode): boolean => node.className === 'UIAspectRatioConstraint',
            )
        ) {
            findings.push(
                'UIAspectRatioConstraint fits the authored box or derives its secondary axis within parent capacity, before anchors and after flex sizing. Ratio changes invalidate native geometry. Conflicting size constraints, multiple-constraint priority and Studio aspect/automatic/flex pixels remain uncalibrated.',
            );
        }
        const textParents: ReadonlySet<string> = new Set(
            scene.nodes
                .filter((node: RobloxSceneNode): boolean =>
                    ['TextLabel', 'TextButton', 'TextBox'].includes(node.className),
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
