// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxValue, RobloxClass } from './RobloxSceneTypes';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxSceneSchema } from './RobloxSceneSchema';
import { RobloxHierarchyLuau } from './RobloxHierarchyLuau';
import { RobloxMeshPlayback, type RobloxMeshPlaybackPlan } from './RobloxMeshPlayback';

/** Generates the Studio playback adapter from the same validated scene as the preview. */
export class RobloxSceneLuau {
    /** Quotes text with decimal escapes, independent of JSON's incompatible Unicode escape rules. */
    public static quote(text: string): string {
        let result: string = '"';
        for (const character of text) {
            const code: number = character.codePointAt(0) ?? 0;
            result +=
                character === '"' || character === '\\'
                    ? '\\' + character
                    : code < 32 || code === 127
                      ? '\\' + String(code).padStart(3, '0')
                      : character;
        }
        return result + '"';
    }

    /** Encodes supported native values as Luau constructor expressions. */
    public static value(
        value: RobloxValue,
        property: string = '',
        className?: RobloxClass,
    ): string {
        if (typeof value === 'string') {
            return this.quote(value);
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        switch (value.kind) {
            case 'Vector2':
                return (
                    'Vector2.new(' +
                    (value.xUnbounded === true ? 'math.huge' : String(value.x)) +
                    ',' +
                    (value.yUnbounded === true ? 'math.huge' : String(value.y)) +
                    ')'
                );
            case 'Rect':
                return (
                    'Rect.new(' + [value.minX, value.minY, value.maxX, value.maxY].join(',') + ')'
                );
            case 'Vector3':
                return (
                    'Vector3.new(' +
                    String(value.x) +
                    ',' +
                    String(value.y) +
                    ',' +
                    String(value.z) +
                    ')'
                );
            case 'Color3':
                return (
                    'Color3.new(' +
                    String(value.r) +
                    ',' +
                    String(value.g) +
                    ',' +
                    String(value.b) +
                    ')'
                );
            case 'UDim':
                return 'UDim.new(' + String(value.scale) + ',' + String(value.offset) + ')';
            case 'UDim2':
                return (
                    'UDim2.new(' +
                    [value.xScale, value.xOffset, value.yScale, value.yOffset].join(',') +
                    ')'
                );
            case 'CFrame':
                return 'CFrame.new(' + value.components.join(',') + ')';
            case 'NumberRange':
                return 'NumberRange.new(' + String(value.min) + ',' + String(value.max) + ')';
            case 'NumberSequence':
                return (
                    'NumberSequence.new({' +
                    value.points
                        .map(
                            (point: import('./RobloxSceneTypes').RobloxNumberKeypoint): string =>
                                'NumberSequenceKeypoint.new(' +
                                String(point.time) +
                                ',' +
                                String(point.value) +
                                ',' +
                                String(point.envelope) +
                                ')',
                        )
                        .join(',') +
                    '})'
                );
            case 'ColorSequence':
                return (
                    'ColorSequence.new({' +
                    value.points
                        .map(
                            (point: import('./RobloxSceneTypes').RobloxColorKeypoint): string =>
                                'ColorSequenceKeypoint.new(' +
                                String(point.time) +
                                ',' +
                                this.value(point.color) +
                                ')',
                        )
                        .join(',') +
                    '})'
                );
            case 'Enum': {
                const families: readonly (string | undefined)[] =
                    className === undefined
                        ? Object.values(RobloxSceneSchema)
                              .map((schema): string | undefined => schema[property]?.enumFamily)
                              .filter((family): boolean => family !== undefined)
                        : [RobloxSceneSchema[className][property]?.enumFamily];
                const family: string | undefined = families[0];
                if (
                    family === undefined ||
                    families.some((candidate): boolean => candidate !== family)
                ) {
                    throw new Error('Missing or ambiguous enum family for property: ' + property);
                }
                return 'enum(' + this.quote(family) + ',' + String(value.value) + ')';
            }
        }
    }

    /** Produces a module with repeatable timelines, button triggers and disposal. */
    public static source(
        scene: RobloxScene,
        meshPlayback: RobloxMeshPlaybackPlan = RobloxMeshPlayback.plan(scene),
    ): string {
        const nodes: readonly import('./RobloxSceneTypes').RobloxSceneNode[] = [
            ...RobloxSceneHierarchy.catalog(scene).values(),
        ];
        const byId: ReadonlyMap<string, import('./RobloxSceneTypes').RobloxSceneNode> =
            RobloxSceneHierarchy.catalog(scene);
        const dynamic: boolean = (scene.hierarchy?.length ?? 0) > 0;
        const lines: string[] = [
            '-- Generated by Nexa. Importable native assets and this runtime share one validated scene.',
            'local TweenService = game:GetService("TweenService")',
            'local RunService = game:GetService("RunService")',
            'local function enum(family, value)',
            '  local item = Enum[family]:FromValue(value)',
            '  if item then return item end',
            '  error("Unknown enum " .. family)',
            'end',
            'local Runtime = {}',
            'function Runtime.mount(worldParent, guiParent)',
            ...(nodes.some(
                (node: import('./RobloxSceneTypes').RobloxSceneNode): boolean =>
                    node.className === 'ScreenGui',
            )
                ? ['  assert(guiParent, "Pass the local player PlayerGui as guiParent")']
                : []),
            '  local nodes, connections, tweens, playbackConnections = {}, {}, {}, {}',
            '  local generation = 0',
            '  local meshTemplates = script and script:FindFirstChild("NexaMeshTemplates")',
        ];
        for (const node of nodes) {
            const access: string = 'nodes[' + this.quote(node.id) + ']';
            lines.push(
                node.className === 'MeshPart'
                    ? '  ' +
                          access +
                          ' = assert(meshTemplates and meshTemplates:FindFirstChild(' +
                          this.quote(node.id) +
                          '), "Imported MeshPart template is required"):Clone()'
                    : '  ' + access + ' = Instance.new(' + this.quote(node.className) + ')',
                '  ' + access + '.Name = ' + this.quote(node.name),
            );
            for (const [property, value] of Object.entries(node.properties)) {
                if (RobloxSceneSchema[node.className][property]?.runtimeReadonly === true) {
                    continue;
                }
                lines.push(
                    '  ' +
                        access +
                        '[' +
                        this.quote(property) +
                        '] = ' +
                        this.value(value, property, node.className),
                );
            }
        }
        for (const node of scene.nodes) {
            lines.push(
                '  nodes[' +
                    this.quote(node.id) +
                    '].Parent = ' +
                    (node.className === 'ScreenGui'
                        ? 'guiParent'
                        : node.parentId === null
                          ? '(worldParent or workspace)'
                          : 'nodes[' + this.quote(node.parentId) + ']'),
            );
        }
        lines.push(
            '  local handle = { nodes = nodes }',
            '  function handle:play(trigger)',
            '    generation += 1',
            '    local current = generation',
            '    for _, connection in playbackConnections do connection:Disconnect() end',
            '    table.clear(playbackConnections)',
            '    local recordings = {}',
            '    for _, tween in tweens do tween:Cancel() end',
            '    table.clear(tweens)',
            ...RobloxHierarchyLuau.playback(scene),
        );
        for (const node of nodes) {
            if (meshPlayback.tracks.some((track): boolean => track.nodeId === node.id)) {
                lines.push(
                    '    nodes[' +
                        this.quote(node.id) +
                        ']:ApplyMesh(meshTemplates[' +
                        this.quote(node.id) +
                        '])',
                );
            }
            if (node.className === 'ParticleEmitter') {
                lines.push('    nodes[' + this.quote(node.id) + ']:Clear()');
            }
            for (const property of new Set(
                scene.events
                    .filter(
                        (event: import('./RobloxSceneTypes').RobloxSceneEvent): boolean =>
                            (event.kind === 'recording' || event.kind === 'tween') &&
                            event.nodeId === node.id,
                    )
                    .map((event: import('./RobloxSceneTypes').RobloxSceneEvent): string =>
                        event.kind === 'recording' || event.kind === 'tween' ? event.property : '',
                    ),
            )) {
                const value: RobloxValue | undefined = node.properties[property];
                if (
                    value !== undefined &&
                    RobloxSceneSchema[node.className][property]?.runtimeReadonly !== true
                ) {
                    lines.push(
                        '    nodes[' +
                            this.quote(node.id) +
                            '][' +
                            this.quote(property) +
                            '] = ' +
                            this.value(value, property, node.className),
                    );
                }
            }
        }
        for (const track of meshPlayback.tracks) {
            lines.push(
                '    if trigger == ' +
                    (track.trigger === null ? 'nil' : this.quote(track.trigger)) +
                    ' then',
                '      table.insert(recordings, {node=nodes[' +
                    this.quote(track.nodeId) +
                    '], mesh=true, cursor=1, samples={' +
                    track.samples
                        .map(
                            (sample): string =>
                                '{' +
                                String(sample.at) +
                                ',meshTemplates[' +
                                this.quote(sample.template) +
                                ']}',
                        )
                        .join(',') +
                    '}})',
                '    end',
            );
        }
        for (const event of scene.events) {
            if (RobloxMeshPlayback.geometry(event, byId.get(event.nodeId))) {
                continue;
            }
            if (event.kind === 'recording') {
                const samples: string = event.samples
                    .map(
                        (sample: import('./RobloxSceneTypes').RobloxPropertySample): string =>
                            '{' +
                            String(sample.at) +
                            ',' +
                            this.value(
                                sample.value,
                                event.property,
                                byId.get(event.nodeId)?.className,
                            ) +
                            '}',
                    )
                    .join(',');
                lines.push(
                    '    if trigger == ' +
                        (event.trigger === null ? 'nil' : this.quote(event.trigger)) +
                        ' then',
                    '      table.insert(recordings, {node=nodes[' +
                        this.quote(event.nodeId) +
                        '], property=' +
                        this.quote(event.property) +
                        ', cursor=1, samples={' +
                        samples +
                        '}})',
                    '    end',
                );
                continue;
            }
            lines.push(
                '    if trigger == ' +
                    (event.trigger === null ? 'nil' : this.quote(event.trigger)) +
                    ' then',
                '      task.delay(' + String(event.at) + ', function()',
                '        if generation ~= current then return end',
                ...(dynamic ? ['        advanceHierarchy(' + String(event.at) + ')'] : []),
            );
            if (event.kind === 'burst') {
                if (event.emission !== undefined) {
                    lines.push(
                        '        local savedProperties, savedFrames = {}, {}',
                        '        local emitter = nodes[' + this.quote(event.nodeId) + ']',
                        '        local savedParents = {{node=emitter, parent=emitter.Parent}}',
                    );
                    const first: import('./RobloxSceneTypes').RobloxEmissionFrame | undefined =
                        event.emission.frames[0];
                    if (first !== undefined) {
                        lines.push(
                            '        emitter.Parent = nodes[' + this.quote(first.nodeId) + ']',
                        );
                    }
                    for (let index: number = 0; index < event.emission.frames.length; index++) {
                        const frame: import('./RobloxSceneTypes').RobloxEmissionFrame | undefined =
                            event.emission.frames[index];
                        const next: import('./RobloxSceneTypes').RobloxEmissionFrame | undefined =
                            event.emission.frames[index + 1];
                        if (frame !== undefined && next !== undefined) {
                            const access: string = 'nodes[' + this.quote(frame.nodeId) + ']';
                            lines.push(
                                '        table.insert(savedParents, {node=' +
                                    access +
                                    ', parent=' +
                                    access +
                                    '.Parent})',
                                '        ' +
                                    access +
                                    '.Parent = nodes[' +
                                    this.quote(next.nodeId) +
                                    ']',
                            );
                        }
                    }
                    for (const [property, value] of Object.entries(event.emission.properties)) {
                        lines.push(
                            '        savedProperties[' +
                                this.quote(property) +
                                '] = emitter[' +
                                this.quote(property) +
                                ']',
                            '        emitter[' +
                                this.quote(property) +
                                '] = ' +
                                this.value(value, property, 'ParticleEmitter'),
                        );
                    }
                    for (const frame of event.emission.frames) {
                        const access: string = 'nodes[' + this.quote(frame.nodeId) + ']';
                        lines.push(
                            '        table.insert(savedFrames, {node=' +
                                access +
                                ', cframe=' +
                                access +
                                '.CFrame' +
                                (frame.size === null ? '' : ', size=' + access + '.Size') +
                                '})',
                            '        ' + access + '.CFrame = ' + this.value(frame.cframe),
                        );
                        if (frame.size !== null) {
                            lines.push('        ' + access + '.Size = ' + this.value(frame.size));
                        }
                    }
                }
                lines.push(
                    '        nodes[' +
                        this.quote(event.nodeId) +
                        ']:Emit(' +
                        String(event.count) +
                        ')',
                );
                if (event.emission !== undefined) {
                    lines.push(
                        '        for _, frame in savedFrames do frame.node.CFrame = frame.cframe; if frame.size then frame.node.Size = frame.size end end',
                        '        for property, value in savedProperties do emitter[property] = value end',
                        '        for index = #savedParents, 1, -1 do local saved=savedParents[index]; saved.node.Parent=saved.parent end',
                    );
                }
            } else if (event.kind === 'clear') {
                lines.push('        nodes[' + this.quote(event.nodeId) + ']:Clear()');
            } else {
                lines.push(
                    '        local tween = TweenService:Create(nodes[' +
                        this.quote(event.nodeId) +
                        '], TweenInfo.new(' +
                        String(event.duration) +
                        ', Enum.EasingStyle.Linear), { [' +
                        this.quote(event.property) +
                        '] = ' +
                        this.value(event.to, event.property, byId.get(event.nodeId)?.className) +
                        ' })',
                    '        table.insert(tweens, tween)',
                    '        tween:Play()',
                );
            }
            lines.push('      end)', '    end');
        }
        lines.push(
            dynamic
                ? '    if #recordings > 0 or #hierarchy > 0 then'
                : '    if #recordings > 0 then',
            '      local elapsed = 0',
            '      local function advance()',
            dynamic
                ? '        local pending = advanceHierarchy(elapsed)'
                : '        local pending = false',
            '        for _, track in recordings do',
            '          while track.samples[track.cursor] and track.samples[track.cursor][1] <= elapsed + 1e-9 do',
            '            if track.mesh then track.node:ApplyMesh(track.samples[track.cursor][2])',
            '            else track.node[track.property] = track.samples[track.cursor][2] end',
            '            track.cursor += 1',
            '          end',
            '          if track.samples[track.cursor] then pending = true end',
            '        end',
            '        return pending',
            '      end',
            '      if advance() then',
            '        local connection',
            '        connection = RunService.Heartbeat:Connect(function(delta)',
            '          if generation ~= current then connection:Disconnect(); return end',
            '          elapsed += delta',
            '          if not advance() then connection:Disconnect() end',
            '        end)',
            '        table.insert(playbackConnections, connection)',
            '      end',
            '    end',
        );
        lines.push(
            '  end',
            '  function handle:destroy()',
            '    generation += 1',
            '    for _, connection in connections do connection:Disconnect() end',
            '    for _, connection in playbackConnections do connection:Disconnect() end',
            '    for _, tween in tweens do tween:Cancel() end',
            '    for _, node in nodes do node:Destroy() end',
            '  end',
        );
        for (const id of new Set(
            scene.events.map(
                (event: import('./RobloxSceneTypes').RobloxSceneEvent): string | null =>
                    event.trigger,
            ),
        )) {
            if (id !== null) {
                lines.push(
                    '  table.insert(connections, nodes[' +
                        this.quote(id) +
                        '].Activated:Connect(function() handle:play(' +
                        this.quote(id) +
                        ') end))',
                );
            }
        }
        lines.push('  handle:play()', '  return handle', 'end', 'return Runtime');
        return lines.join('\n') + '\n';
    }
}
