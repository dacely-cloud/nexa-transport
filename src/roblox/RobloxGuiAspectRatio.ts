// SPDX-License-Identifier: Apache-2.0

import type { RobloxSceneNode, RobloxValue } from './RobloxSceneTypes';
import type { RobloxGuiSize } from './RobloxGuiBoxLayout';
import { RobloxProperties } from './RobloxSceneRuntime';

/** Current canonical aspect constraint properties for one native GUI observation. */
export interface RobloxGuiAspectConstraint {
    readonly ratio: number;
    readonly type: number;
    readonly axis: number;
}
/** Resolves aspect constraints before anchoring and after layout growth. */
export class RobloxGuiAspectRatio {
    /** Reads the first attached constraint using recorded properties at the current time. */
    public static read(
        children: readonly RobloxSceneNode[],
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
    ): RobloxGuiAspectConstraint | null {
        const node: RobloxSceneNode | undefined = children.find(
            (child: RobloxSceneNode): boolean => child.className === 'UIAspectRatioConstraint',
        );
        if (node === undefined) {
            return null;
        }
        const properties: Readonly<Record<string, RobloxValue>> =
            values.get(node.id) ?? node.properties;
        const ratio: number = Math.fround(RobloxProperties.number(properties, 'AspectRatio'));
        if (!Number.isFinite(ratio) || ratio <= 0) {
            throw new Error('GUI aspect ratio must be a positive finite native float');
        }
        return {
            ratio,
            type: RobloxProperties.enum(properties, 'AspectType'),
            axis: RobloxProperties.enum(properties, 'DominantAxis'),
        };
    }
    /** Fits the authored box or derives the secondary axis within the parent capacity. */
    public static apply(
        size: RobloxGuiSize,
        capacity: RobloxGuiSize,
        constraint: RobloxGuiAspectConstraint | null,
    ): RobloxGuiSize {
        if (constraint === null) {
            return size;
        }
        const width: number = Math.fround(size.width);
        const height: number = Math.fround(size.height);
        const ratio: number = constraint.ratio;
        if (constraint.type === 0) {
            const fitted: number = Math.min(width, Math.fround(height * ratio));
            return { width: fitted, height: Math.fround(fitted / ratio) };
        }
        if (constraint.axis === 0) {
            const fitted: number = Math.min(
                width,
                Math.fround(capacity.width),
                Math.fround(Math.fround(capacity.height) * ratio),
            );
            return { width: fitted, height: Math.fround(fitted / ratio) };
        }
        const fitted: number = Math.min(
            height,
            Math.fround(capacity.height),
            Math.fround(Math.fround(capacity.width) / ratio),
        );
        return { width: Math.fround(fitted * ratio), height: fitted };
    }
}
