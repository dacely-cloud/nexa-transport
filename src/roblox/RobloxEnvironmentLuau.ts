// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene } from './RobloxSceneTypes';
import { RobloxSceneLuau } from './RobloxSceneLuau';

/** Studio environment replay is explicit because Workspace wind affects the whole place. */
export class RobloxEnvironmentLuau {
    /** Explains the place-wide decision at the delivered pack's Studio entry point. */
    public static instructions(scene: RobloxScene): string {
        return scene.environment === undefined
            ? ''
            : "Recorded Workspace wind is included. Runtime.mount(worldParent, guiParent, true) opts into replaying it for the whole place and restores the previous wind on destroy if nothing else changed it. Omit the third argument to keep the game's current wind. Coordinate simultaneous recorded-environment replays in Studio.\n";
    }
    /** Captures wind only when playback first writes it and yields ownership after an external edit. */
    public static setup(scene: RobloxScene): readonly string[] {
        if (scene.environment === undefined) {
            return [];
        }
        return [
            '  assert(applyEnvironment == nil or type(applyEnvironment) == "boolean", "applyEnvironment must be a boolean")',
            '  local windBefore, windWritten',
            '  local function applyWind(value)',
            '    if not applyEnvironment then return end',
            '    if windWritten ~= nil and workspace.GlobalWind ~= windWritten then applyEnvironment = false; return end',
            '    if windWritten == nil then windBefore = workspace.GlobalWind end',
            '    workspace.GlobalWind = value',
            '    windWritten = value',
            '  end',
            '  local function restoreWind()',
            '    if applyEnvironment and windWritten ~= nil and workspace.GlobalWind == windWritten then workspace.GlobalWind = windBefore end',
            '    windWritten = nil',
            '  end',
        ];
    }

    /** Wind observations join the existing Heartbeat track cursor and retain held values. */
    public static playback(scene: RobloxScene): readonly string[] {
        const wind: import('./RobloxEnvironment').RobloxEnvironmentState | undefined =
            scene.environment;
        const first: import('./RobloxEnvironment').RobloxWindSample | undefined = wind?.wind[0];
        if (wind === undefined || first === undefined) {
            return [];
        }
        return [
            '    if applyEnvironment then',
            '      applyWind(' + RobloxSceneLuau.value(first.value) + ')',
            '      table.insert(recordings, { environment = true, cursor = 2, samples = {',
            ...wind.wind.map(
                (sample): string =>
                    '        {' +
                    String(sample.at) +
                    ', ' +
                    RobloxSceneLuau.value(sample.value) +
                    '},',
            ),
            '      } })',
            '    end',
        ];
    }
}
