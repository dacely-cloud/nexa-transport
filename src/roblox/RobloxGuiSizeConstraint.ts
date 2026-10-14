// SPDX-License-Identifier: Apache-2.0
import type { RobloxSceneNode, RobloxValue, RobloxVector2 } from './RobloxSceneTypes';
import type { RobloxGuiSize } from './RobloxGuiBoxLayout';

/** Native minimum/maximum dimensions applied after authored, automatic and flex sizing. */
export interface RobloxGuiSizeLimits {
    readonly minimum: RobloxGuiSize;
    readonly maximum: RobloxGuiSize;
}
/** Resolves size limits without clamping or replacing native infinity in delivered artifacts. */
export class RobloxGuiSizeConstraint {
    /** Reads the first attached constraint with current recorded values. */
    public static limits(
        children: readonly RobloxSceneNode[],
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
    ): RobloxGuiSizeLimits | null {
        const node: RobloxSceneNode | undefined = children.find(
            (child: RobloxSceneNode): boolean => child.className === 'UISizeConstraint',
        );
        if (node === undefined) {
            return null;
        }
        const properties: Readonly<Record<string, RobloxValue>> =
            values.get(node.id) ?? node.properties;
        const minimum: RobloxVector2 = this.#vector(properties['MinSize']);
        const maximum: RobloxVector2 = this.#vector(properties['MaxSize']);
        const maxWidth: number = maximum.xUnbounded === true ? Infinity : maximum.x;
        const maxHeight: number = maximum.yUnbounded === true ? Infinity : maximum.y;
        if (
            minimum.x < 0 ||
            minimum.y < 0 ||
            minimum.xUnbounded === true ||
            minimum.yUnbounded === true ||
            maxWidth < minimum.x ||
            maxHeight < minimum.y
        ) {
            throw new Error('GUI minimum size must not exceed maximum size');
        }
        return {
            minimum: { width: minimum.x, height: minimum.y },
            maximum: { width: maxWidth, height: maxHeight },
        };
    }
    /** Applies limits independently on both axes; constraint bounds override authored/layout dimensions. */
    public static apply(size: RobloxGuiSize, limits: RobloxGuiSizeLimits | null): RobloxGuiSize {
        return limits === null
            ? size
            : {
                  width: Math.max(limits.minimum.width, Math.min(limits.maximum.width, size.width)),
                  height: Math.max(
                      limits.minimum.height,
                      Math.min(limits.maximum.height, size.height),
                  ),
              };
    }
    static #vector(value: RobloxValue | undefined): RobloxVector2 {
        if (typeof value !== 'object' || value.kind !== 'Vector2') {
            throw new Error('Missing native GUI size limit');
        }
        return value;
    }
}
