// SPDX-License-Identifier: Apache-2.0
import type { RobloxSceneNode, RobloxValue } from './RobloxSceneTypes';

/** Pixel insets resolved against the current parent dimensions. */
export interface RobloxGuiInsets {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
}
/** Shared padding resolution for intrinsic sizing, child placement and text drawing. */
export class RobloxGuiPadding {
    /** Reads the first attached UIPadding using the current recorded properties. */
    public static resolve(
        children: readonly RobloxSceneNode[],
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
        width: number,
        height: number,
    ): RobloxGuiInsets {
        const node: RobloxSceneNode | undefined = children.find(
            (child: RobloxSceneNode): boolean => child.className === 'UIPadding',
        );
        const properties: Readonly<Record<string, RobloxValue>> | null =
            node === undefined ? null : (values.get(node.id) ?? node.properties);
        return {
            left: this.pixel(properties, 'PaddingLeft', width),
            top: this.pixel(properties, 'PaddingTop', height),
            right: this.pixel(properties, 'PaddingRight', width),
            bottom: this.pixel(properties, 'PaddingBottom', height),
        };
    }
    /** Converts one native UDim padding value into pixels. */
    public static pixel(
        properties: Readonly<Record<string, RobloxValue>> | null,
        key: string,
        size: number,
    ): number {
        if (properties === null) {
            return 0;
        }
        const value: RobloxValue | undefined = properties[key];
        if (typeof value !== 'object' || value.kind !== 'UDim') {
            throw new Error('Missing GUI ' + key);
        }
        return size * value.scale + value.offset;
    }
}
