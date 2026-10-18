// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxValue } from './RobloxSceneTypes';
import { RobloxSceneLuau } from './RobloxSceneLuau';
import type { RobloxLightingSample } from './RobloxLighting';

/** Place-wide lighting playback is opt-in and relinquishes ownership after an external edit. */
export class RobloxLightingLuau {
    /** Restore only properties still owned by this replay, never a later game's lighting edits. */
    public static setup(): readonly string[] {
        return [
            '  local lighting = game:GetService("Lighting")',
            '  local lightingBefore, lightingWritten = {}, {}',
            '  local lightingActive = applyEnvironment',
            '  local function applyLighting(value)',
            '    if not lightingActive then return end',
            '    for property, written in lightingWritten do',
            '      if lighting[property] ~= written then lightingActive = false; return end',
            '    end',
            '    for property, nextValue in value do',
            '      if lightingBefore[property] == nil then lightingBefore[property] = lighting[property] end',
            '      lighting[property] = nextValue',
            '      lightingWritten[property] = lighting[property]',
            '    end',
            '  end',
            '  local function restoreLighting()',
            '    for property, written in lightingWritten do',
            '      if lighting[property] == written then lighting[property] = lightingBefore[property] end',
            '    end',
            '    table.clear(lightingWritten); table.clear(lightingBefore)',
            '  end',
        ];
    }

    /** Use the existing native timeline cursor without extra timers or duplicated render loops. */
    public static playback(scene: RobloxScene): readonly string[] {
        const samples: readonly RobloxLightingSample[] | undefined = scene.environment?.lighting;
        if (samples === undefined || samples.length === 0) {
            return [];
        }
        const value: (sample: RobloxLightingSample) => string = (
            sample: RobloxLightingSample,
        ): string =>
            '{' +
            Object.entries(sample.value)
                .map(
                    ([key, value]: [string, RobloxValue]): string =>
                        '[' +
                        RobloxSceneLuau.quote(key) +
                        ']=' +
                        RobloxSceneLuau.value(value, key, 'Lighting'),
                )
                .join(',') +
            '}';
        const first: RobloxLightingSample | undefined = samples[0];
        if (first === undefined) {
            return [];
        }
        return [
            '    if applyEnvironment then',
            '      applyLighting(' + value(first) + ')',
            '      table.insert(recordings, { lighting = true, cursor = 2, samples = {',
            ...samples.map(
                (sample: RobloxLightingSample): string =>
                    '        {' + String(sample.at) + ',' + value(sample) + '},',
            ),
            '      } })',
            '    end',
        ];
    }
}
