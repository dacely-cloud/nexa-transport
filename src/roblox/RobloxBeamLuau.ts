// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RobloxBeamMotion, type RobloxBeamSpeedInterval } from './RobloxBeamMotion';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxSceneLuau } from './RobloxSceneLuau';
import type { RobloxScene, RobloxSceneEvent, RobloxSceneNode } from './RobloxSceneTypes';

/** Applies private UV origins with real SetTextureOffset calls while preserving native automatic scrolling. */
export class RobloxBeamLuau {
    /** Corrections run after property observations so a newly assigned texture can receive its phase. */
    public static playback(scene: RobloxScene): readonly string[] {
        const nodes: readonly RobloxSceneNode[] = [
            ...RobloxSceneHierarchy.catalog(scene).values(),
        ].filter((node): boolean => node.className === 'Beam');
        if (nodes.length === 0) {
            return [];
        }
        const births: Map<string, number> = new Map();
        for (const delta of scene.hierarchy ?? []) {
            for (const node of delta.created) {
                births.set(node.id, delta.at);
            }
        }
        const lines: string[] = ['    local beamClocks = {}'];
        for (const node of nodes) {
            const events: readonly RobloxSceneEvent[] = scene.events.filter(
                (event): boolean =>
                    event.nodeId === node.id &&
                    (event.kind === 'recording' || event.kind === 'tween') &&
                    (event.property === 'TextureSpeed' || event.property === 'Texture'),
            );
            const birth: number = births.get(node.id) ?? 0;
            if (events.length === 0) {
                lines.push(this.#clock(scene, node, birth, undefined));
                continue;
            }
            const triggers: ReadonlySet<string | null> = new Set([
                null,
                ...events.map((event): string | null => event.trigger),
            ]);
            let first: boolean = true;
            for (const trigger of triggers) {
                lines.push(
                    '    ' +
                        (first ? 'if' : 'elseif') +
                        ' trigger == ' +
                        (trigger === null ? 'nil' : RobloxSceneLuau.quote(trigger)) +
                        ' then',
                );
                lines.push(this.#clock(scene, node, birth, trigger));
                first = false;
            }
            lines.push('    else', this.#clock(scene, node, birth, undefined), '    end');
        }
        lines.push(
            '    local function beamDistance(rates, time)',
            '      local low, high = 1, #rates + 1',
            '      while low < high do',
            '        local middle = math.floor((low + high) / 2)',
            '        if rates[middle] and rates[middle][1] <= time then low = middle + 1 else high = middle end',
            '      end',
            '      local rate = rates[low - 1]',
            '      if not rate then return 0, 0 end',
            '      local age = math.clamp(time - rate[1], 0, rate[2] - rate[1])',
            '      return rate[5] + rate[3] * age + rate[4] * age * age / 2, time < rate[2] and rate[4] or 0',
            '    end',
            '    local function advanceBeams(time)',
            '      local pending = false',
            '      for _, clock in beamClocks do',
            '        local changed = false',
            '        while clock.anchors[clock.cursor] and clock.anchors[clock.cursor][1] <= time + 1e-9 do',
            '          clock.cursor += 1; changed = true',
            '        end',
            '        local anchor = clock.anchors[clock.cursor - 1]',
            '        if anchor then',
            '          local distance, slope = beamDistance(clock.rates, time)',
            '          if changed or slope ~= 0 then',
            '            local origin = beamDistance(clock.rates, anchor[1])',
            '            clock.node:SetTextureOffset(anchor[2] - distance + origin)',
            '          end',
            '          if slope ~= 0 then pending = true end',
            '        end',
            '        if clock.anchors[clock.cursor] then pending = true end',
            '      end',
            '      return pending',
            '    end',
        );
        return lines;
    }

    static #clock(
        scene: RobloxScene,
        node: RobloxSceneNode,
        birth: number,
        trigger: string | null | undefined,
    ): string {
        const motion: RobloxBeamMotion = new RobloxBeamMotion(node, birth, scene, trigger);
        const times: Set<number> = new Set([
            birth,
            ...motion.anchors.map((sample): number => sample.at),
        ]);
        for (const event of scene.events) {
            if (
                (event.kind !== 'recording' && event.kind !== 'tween') ||
                event.nodeId !== node.id ||
                event.trigger !== trigger ||
                (event.property !== 'TextureSpeed' && event.property !== 'Texture')
            ) {
                continue;
            }
            if (event.kind === 'recording') {
                for (const sample of event.samples) {
                    if (sample.at >= birth) {
                        times.add(sample.at);
                    }
                }
            } else {
                times.add(event.at);
                times.add(event.at + event.duration);
            }
        }
        const anchors: string = [...times]
            .sort((a: number, b: number): number => a - b)
            .map(
                (at: number): string =>
                    '{' + String(at) + ',' + String(((motion.phase(at) % 1) + 1) % 1) + '}',
            )
            .join(',');
        const rates: string = motion.intervals
            .map(
                (interval: RobloxBeamSpeedInterval): string =>
                    '{' +
                    [
                        interval.at,
                        interval.until,
                        interval.rate,
                        interval.slope,
                        interval.distance,
                    ].join(',') +
                    '}',
            )
            .join(',');
        return (
            '      table.insert(beamClocks, {node=nodes[' +
            RobloxSceneLuau.quote(node.id) +
            '], cursor=1, anchors={' +
            anchors +
            '}, rates={' +
            rates +
            '}})'
        );
    }
}
