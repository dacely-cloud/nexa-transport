// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { RobloxScene, RobloxSceneNode, RobloxValue } from './RobloxSceneTypes';
import { RobloxSceneSchema, type RobloxPropertySpec } from './RobloxSceneSchema';
import { RobloxSceneLuau } from './RobloxSceneLuau';

/** Native XML serialization, using the rbx-dom version 4 format. */
export class RobloxSceneXml {
    /** Escapes every externally supplied string including instance and property names. */
    public static escape(text: string): string {
        return text
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&apos;');
    }

    /** Creates an importable folder with native instances and a mount/play/destroy ModuleScript. */
    public static model(scene: RobloxScene): string {
        const children: Map<string | null, RobloxSceneNode[]> = new Map<
            string | null,
            RobloxSceneNode[]
        >();
        for (const node of scene.nodes) {
            const siblings: RobloxSceneNode[] = children.get(node.parentId) ?? [];
            siblings.push(node);
            children.set(node.parentId, siblings);
        }
        const item: (node: RobloxSceneNode) => string = (node: RobloxSceneNode): string => {
            const properties: string = Object.entries(node.properties)
                .map(([name, value]: [string, RobloxValue]): string =>
                    this.property(name, value, RobloxSceneSchema[node.className][name]),
                )
                .join('');
            return (
                '<Item class="' +
                node.className +
                '" referent="RBX_' +
                node.id +
                '"><Properties><string name="Name">' +
                this.escape(node.name) +
                '</string>' +
                properties +
                '</Properties>' +
                (children.get(node.id) ?? []).map(item).join('') +
                '</Item>'
            );
        };
        const module: string =
            '<Item class="ModuleScript" referent="RBX_Runtime"><Properties><string name="Name">NexaRuntime</string><ProtectedString name="Source">' +
            this.escape(RobloxSceneLuau.source(scene)) +
            '</ProtectedString></Properties></Item>';
        return (
            '<roblox version="4"><Meta name="ExplicitAutoJoints">true</Meta><External>null</External><External>nil</External><Item class="Folder" referent="RBX_Pack"><Properties><string name="Name">' +
            this.escape(scene.name) +
            '</string></Properties>' +
            (children.get(null) ?? []).map(item).join('') +
            module +
            '</Item></roblox>'
        );
    }

    /** Serializes one native property with its class-specific disk name and datatype. */
    public static property(name: string, value: RobloxValue, spec?: RobloxPropertySpec): string {
        const diskName: string = spec?.xmlName ?? name;
        let type: string =
            spec?.xmlType ??
            (typeof value === 'number'
                ? 'float'
                : typeof value === 'boolean'
                  ? 'bool'
                  : typeof value === 'string'
                    ? 'string'
                    : value.kind);
        let content: string = '';
        if (typeof value === 'number' || typeof value === 'boolean') content = String(value);
        else if (typeof value === 'string')
            content =
                type === 'Content' || type === 'ContentId'
                    ? '<url>' + this.escape(value) + '</url>'
                    : this.escape(value);
        else
            switch (value.kind) {
                case 'Vector2':
                    content = '<X>' + value.x + '</X><Y>' + value.y + '</Y>';
                    break;
                case 'Vector3':
                    content = '<X>' + value.x + '</X><Y>' + value.y + '</Y><Z>' + value.z + '</Z>';
                    break;
                case 'Color3':
                    content =
                        type === 'Color3uint8'
                            ? String(
                                  (0xff000000 |
                                      (Math.round(value.r * 255) << 16) |
                                      (Math.round(value.g * 255) << 8) |
                                      Math.round(value.b * 255)) >>>
                                      0,
                              )
                            : '<R>' + value.r + '</R><G>' + value.g + '</G><B>' + value.b + '</B>';
                    break;
                case 'UDim':
                    content = '<S>' + value.scale + '</S><O>' + value.offset + '</O>';
                    break;
                case 'UDim2':
                    content =
                        '<XS>' +
                        value.xScale +
                        '</XS><XO>' +
                        value.xOffset +
                        '</XO><YS>' +
                        value.yScale +
                        '</YS><YO>' +
                        value.yOffset +
                        '</YO>';
                    break;
                case 'NumberRange':
                    content = value.min + ' ' + value.max;
                    break;
                case 'NumberSequence':
                    content =
                        value.points
                            .map(
                                (
                                    point: import('./RobloxSceneTypes').RobloxNumberKeypoint,
                                ): string => point.time + ' ' + point.value + ' ' + point.envelope,
                            )
                            .join(' ') + ' ';
                    break;
                case 'ColorSequence':
                    content =
                        value.points
                            .map(
                                (point: import('./RobloxSceneTypes').RobloxColorKeypoint): string =>
                                    point.time +
                                    ' ' +
                                    point.color.r +
                                    ' ' +
                                    point.color.g +
                                    ' ' +
                                    point.color.b +
                                    ' 0',
                            )
                            .join(' ') + ' ';
                    break;
                case 'Enum':
                    type = 'token';
                    content = String(value.value);
                    break;
                case 'CFrame':
                    type = 'CoordinateFrame';
                    content = [
                        'X',
                        'Y',
                        'Z',
                        'R00',
                        'R01',
                        'R02',
                        'R10',
                        'R11',
                        'R12',
                        'R20',
                        'R21',
                        'R22',
                    ]
                        .map(
                            (key: string, index: number): string =>
                                '<' + key + '>' + (value.components[index] ?? 0) + '</' + key + '>',
                        )
                        .join('');
                    break;
            }
        return '<' + type + ' name="' + this.escape(diskName) + '">' + content + '</' + type + '>';
    }
}
