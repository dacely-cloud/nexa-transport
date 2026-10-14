// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RobloxGuiClasses } from './RobloxGuiClasses';
import { RobloxProperties } from './RobloxSceneRuntime';
import type { RobloxSceneNode, RobloxValue, RobloxUDim2 } from './RobloxSceneTypes';

/** Projects inherited GUI units without changing authored instances or serialized properties. */
export class RobloxGuiScale {
    /** Resolves current scale modifiers once per observation; each ScreenGui starts a new unit space. */
    public static project(
        children: ReadonlyMap<string | null, readonly RobloxSceneNode[]>,
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
    ): ReadonlyMap<string, Readonly<Record<string, RobloxValue>>> {
        if (
            ![...children.values()].some((nodes: readonly RobloxSceneNode[]): boolean =>
                nodes.some((node: RobloxSceneNode): boolean => node.className === 'UIScale'),
            )
        ) {
            return values;
        }
        const output: Map<string, Readonly<Record<string, RobloxValue>>> = new Map(values);
        const visit: (node: RobloxSceneNode, inherited: number) => void = (
            node: RobloxSceneNode,
            inherited: number,
        ): void => {
            const descendants: readonly RobloxSceneNode[] = children.get(node.id) ?? [];
            const modifier: RobloxSceneNode | undefined = descendants.find(
                (child: RobloxSceneNode): boolean => child.className === 'UIScale',
            );
            const local: number =
                modifier === undefined
                    ? 1
                    : Math.fround(
                          RobloxProperties.number(
                              values.get(modifier.id) ?? modifier.properties,
                              'Scale',
                          ),
                      );
            const scale: number = Math.fround(inherited * local);
            if (!Number.isFinite(local) || local < 0 || !Number.isFinite(scale) || scale < 0) {
                throw new Error('GUI scale must remain a nonnegative finite native float');
            }
            if (RobloxGuiClasses.objects.includes(node.className)) {
                output.set(
                    node.id,
                    this.#properties(
                        values.get(node.id) ?? node.properties,
                        scale,
                        inherited,
                        local,
                    ),
                );
            }
            for (const child of descendants) {
                if (RobloxGuiClasses.objects.includes(child.className)) {
                    visit(child, scale);
                } else if (child.className !== 'UIScale') {
                    output.set(
                        child.id,
                        this.#properties(values.get(child.id) ?? child.properties, scale, scale, 1),
                    );
                }
            }
        };
        for (const nodes of children.values()) {
            for (const node of nodes) {
                if (node.className === 'ScreenGui') {
                    visit(node, 1);
                }
            }
        }
        return output;
    }
    static #properties(
        authored: Readonly<Record<string, RobloxValue>>,
        scale: number,
        positionScale: number,
        local: number,
    ): Readonly<Record<string, RobloxValue>> {
        if (scale === 1 && positionScale === 1 && local === 1) {
            return authored;
        }
        const result: Record<string, RobloxValue> = { ...authored };
        for (const [name, value] of Object.entries(authored)) {
            if (
                typeof value === 'number' &&
                ['TextSize', 'Thickness', 'SliceScale'].includes(name)
            ) {
                result[name] = this.#scaled(value, scale);
            } else if (typeof value === 'object' && value.kind === 'UDim') {
                result[name] = { ...value, offset: this.#scaled(value.offset, scale) };
            } else if (typeof value === 'object' && value.kind === 'UDim2') {
                const factor: number = name === 'Position' ? positionScale : scale;
                const ratio: number = name === 'Size' ? local : 1;
                const dimension: RobloxUDim2 = {
                    ...value,
                    xScale: this.#scaled(value.xScale, ratio),
                    yScale: this.#scaled(value.yScale, ratio),
                    xOffset: this.#scaled(value.xOffset, factor),
                    yOffset: this.#scaled(value.yOffset, factor),
                };
                result[name] = dimension;
            } else if (
                typeof value === 'object' &&
                value.kind === 'Vector2' &&
                ['MinSize', 'MaxSize'].includes(name)
            ) {
                result[name] = {
                    ...value,
                    x: this.#scaled(value.x, scale),
                    y: this.#scaled(value.y, scale),
                };
            }
        }
        return result;
    }
    static #scaled(value: number, factor: number): number {
        const projected: number = Math.fround(value * factor);
        if (!Number.isFinite(projected)) {
            throw new Error('GUI scaled dimensions overflow native float units');
        }
        return projected;
    }
}
