// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxSceneNode } from './RobloxSceneTypes';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';

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
            nodes.some(
                (node: import('./RobloxSceneTypes').RobloxSceneNode): boolean =>
                    node.className === 'ParticleEmitter',
            )
        ) {
            findings.push(
                'Particle sprites sample Roblox’s shipped default resource texels. rbxassetid textures still use a procedural substitute until asset resolution is implemented. Flipbook timing and native particle RNG remain unfinished.',
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
                    ].includes(event.property),
            )
        ) {
            findings.push(
                'Emitter recordings update Rate/Enabled, birth inputs and emission poses. Changes to live appearance and forces are preserved in recorded tracks and Studio replay but remain unfinished in the preview.',
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
                    ? 'Native UI composes rounded backgrounds, strokes and glyphs on Vulkan using an installed Arial-compatible TTF (or NEXA_ROBLOX_LEGACY_FONT). Complex text shaping, all native fonts, insets, automatic sizing, DPI and Studio pixels are not calibrated yet.'
                    : 'UI shares native scale/offset, anchors, rotation, corner radii and clipping layout, but uses browser text metrics. Native fonts, inset behavior, automatic sizing, DPI and Studio pixel fidelity are not calibrated yet.',
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
                'List layout supports rows/columns, Name/LayoutOrder sorting, alignment, wrapping and flex spacing. AutomaticSize, UIFlexItem rules and native AbsoluteContentSize observation remain unfinished; Studio flex pixels are not calibrated yet.',
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
                'UIPadding currently changes child GUI layout. Padding applied to the parent text itself remains unfinished.',
            );
        }
        return Object.freeze(findings);
    }
}
