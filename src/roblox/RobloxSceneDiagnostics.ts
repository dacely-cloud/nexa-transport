// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene } from './RobloxSceneTypes';

/** Explicit preview fidelity findings, also delivered to the authoring model. */
export class RobloxSceneDiagnostics {
    /** Reports current renderer limits without claiming Studio fidelity. */
    public static preview(scene: RobloxScene, native: boolean = false): readonly string[] {
        const findings: string[] = [
            native
                ? 'Capture uses hardware Vulkan with approximated Roblox materials and lighting. Studio pixel fidelity has not been measured.'
                : 'Preview uses a WebGL approximation of Roblox lighting and materials. Studio pixel fidelity has not been measured.',
        ];
        if (
            scene.nodes.some(
                (node: import('./RobloxSceneTypes').RobloxSceneNode): boolean =>
                    node.className === 'ParticleEmitter',
            )
        ) {
            findings.push(
                'Particles use a procedural sprite in preview. Native textures are preserved in the model; texture resolution, flipbooks and native particle RNG are not emulated yet.',
            );
        }
        const emitterIds: ReadonlySet<string> = new Set(
            scene.nodes
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
        return Object.freeze(findings);
    }
}
