// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxSceneNode, RobloxHierarchyNode } from './RobloxSceneTypes';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxSceneLuau } from './RobloxSceneLuau';

/** Emits bounded topology playback while keeping instances available for repeat playback. */
export class RobloxHierarchyLuau {
    /** Restores initial membership and builds the chronological hierarchy cursor. */
    public static playback(scene: RobloxScene): readonly string[] {
        if ((scene.hierarchy?.length ?? 0) === 0) {
            return [];
        }
        const catalog: ReadonlyMap<string, RobloxSceneNode> = RobloxSceneHierarchy.catalog(scene);
        const lines: string[] = [];
        for (const node of catalog.values()) {
            lines.push('    nodes[' + RobloxSceneLuau.quote(node.id) + '].Parent = nil');
            lines.push(
                '    nodes[' +
                    RobloxSceneLuau.quote(node.id) +
                    '].Name = ' +
                    RobloxSceneLuau.quote(node.name),
            );
        }
        for (const node of scene.nodes) {
            lines.push(this.#parent(node, catalog));
        }
        lines.push('    local hierarchy = {');
        for (const delta of scene.hierarchy ?? []) {
            lines.push('      {' + String(delta.at) + ', function()');
            for (const node of [...delta.created, ...delta.changed]) {
                lines.push(
                    '    nodes[' +
                        RobloxSceneLuau.quote(node.id) +
                        '].Name = ' +
                        RobloxSceneLuau.quote(node.name),
                );
                lines.push(this.#parent(node, catalog));
            }
            for (const id of delta.removed) {
                lines.push('    nodes[' + RobloxSceneLuau.quote(id) + '].Parent = nil');
            }
            lines.push('      end' + (delta.afterFrame === true ? ',true' : '') + '},');
        }
        lines.push(
            '    }',
            '    local hierarchyCursor = 1',
            '    local function advanceHierarchy(elapsed)',
            '      while hierarchy[hierarchyCursor] and hierarchy[hierarchyCursor][1] <= elapsed + 1e-9 do',
            '        local delta = hierarchy[hierarchyCursor]',
            '        if delta[3] and math.abs(delta[1] - elapsed) <= 1e-9 then',
            '          task.defer(function() if generation == current then delta[2]() end end)',
            '        else delta[2]() end',
            '        hierarchyCursor += 1',
            '      end',
            '      return hierarchy[hierarchyCursor] ~= nil',
            '    end',
            '    advanceHierarchy(0)',
        );
        return lines;
    }
    static #parent(
        node: RobloxHierarchyNode,
        catalog: ReadonlyMap<string, RobloxSceneNode>,
    ): string {
        return (
            '    nodes[' +
            RobloxSceneLuau.quote(node.id) +
            '].Parent = ' +
            (catalog.get(node.id)?.className === 'ScreenGui'
                ? 'guiParent'
                : node.parentId === null
                  ? '(worldParent or workspace)'
                  : 'nodes[' + RobloxSceneLuau.quote(node.parentId) + ']')
        );
    }
}
