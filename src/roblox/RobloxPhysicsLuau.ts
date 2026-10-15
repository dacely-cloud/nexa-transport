// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxSceneNode } from './RobloxSceneTypes';
import { RobloxPartGeometry } from './RobloxPartGeometry';

/** Visual playback owns clone poses while the stored native model retains authored physics. */
export class RobloxPhysicsLuau {
    /** Selects properties fixed by visual replay rather than by recorded authoring state. */
    public static controls(node: RobloxSceneNode | undefined, property: string): boolean {
        return (
            node !== undefined &&
            RobloxPartGeometry.isPart(node.className) &&
            (property === 'Anchored' || property === 'CanCollide' || property === 'CanTouch')
        );
    }

    /** Pins every replay part before it can enter a world, including future hierarchy members. */
    public static initialize(node: RobloxSceneNode, access: string): readonly string[] {
        return RobloxPartGeometry.isPart(node.className)
            ? [
                  '  ' + access + '.Anchored = true',
                  '  ' + access + '.CanCollide = false',
                  '  ' + access + '.CanTouch = false',
              ]
            : [];
    }

    /** Explains which asset retains game physics and which adapter displays captured motion. */
    public static instructions(): string {
        return "NexaRuntime mounts visual replay copies with anchored parts and collision/touch response disabled. This keeps captured poses stable under the place's gravity and contacts. The stored native model and NexaAuthor retain authored physics settings for live game use.\n";
    }
}
