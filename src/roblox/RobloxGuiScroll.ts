// SPDX-License-Identifier: Apache-2.0

import { RobloxProperties } from './RobloxSceneRuntime';
import type { RobloxValue } from './RobloxSceneTypes';
import type { RobloxGuiSize } from './RobloxGuiBoxLayout';

/** Canvas geometry in viewport pixels, separate from scrollbar painting and input routing. */
export interface RobloxGuiScrollGeometry {
    readonly canvas: RobloxGuiSize;
    readonly window: RobloxGuiSize;
    readonly space: RobloxGuiSize;
    readonly x: number;
    readonly y: number;
    readonly originX: number;
}

/** Resolves authored canvas dimensions and current gutters using the native layout contract. */
export class RobloxGuiScroll {
    /** Resolves one observation without retaining offsets between seeks or viewport changes. */
    public static resolve(
        properties: Readonly<Record<string, RobloxValue>>,
        size: RobloxGuiSize,
        content: RobloxGuiSize,
    ): RobloxGuiScrollGeometry {
        const dimension: RobloxValue | undefined = properties['CanvasSize'];
        const position: RobloxValue | undefined = properties['CanvasPosition'];
        if (
            typeof dimension !== 'object' ||
            dimension.kind !== 'UDim2' ||
            typeof position !== 'object' ||
            position.kind !== 'Vector2'
        ) {
            throw new Error('Missing scrolling canvas dimensions or position');
        }
        const automatic: number = RobloxProperties.enum(properties, 'AutomaticCanvasSize');
        const authoredWidth: number = Math.max(
            0,
            size.width * dimension.xScale + dimension.xOffset,
        );
        const authoredHeight: number = Math.max(
            0,
            size.height * dimension.yScale + dimension.yOffset,
        );
        const canvas: RobloxGuiSize = {
            width:
                automatic === 1 || automatic === 3
                    ? Math.max(authoredWidth, content.width)
                    : authoredWidth,
            height:
                automatic === 2 || automatic === 3
                    ? Math.max(authoredHeight, content.height)
                    : authoredHeight,
        };
        const thickness: number = RobloxProperties.number(properties, 'ScrollBarThickness');
        if (
            ![canvas.width, canvas.height, thickness, position.x, position.y].every(Number.isFinite)
        ) {
            throw new Error('Scrolling canvas geometry must remain finite');
        }
        const direction: number = RobloxProperties.enum(properties, 'ScrollingDirection');
        const enabled: boolean = properties['ScrollingEnabled'] === true;
        const verticalInset: number = RobloxProperties.enum(properties, 'VerticalScrollBarInset');
        const horizontalInset: number = RobloxProperties.enum(
            properties,
            'HorizontalScrollBarInset',
        );
        let window: RobloxGuiSize = size;
        let space: RobloxGuiSize = size;
        let originX: number = 0;
        for (let iteration: number = 0; iteration < 4; iteration++) {
            const vertical: boolean =
                enabled &&
                (direction === 2 || direction === 4) &&
                thickness > 0 &&
                canvas.height > window.height;
            const horizontal: boolean =
                enabled &&
                (direction === 1 || direction === 4) &&
                thickness > 0 &&
                canvas.width > window.width;
            const insetX: number =
                verticalInset === 2 || (verticalInset === 1 && vertical) ? thickness : 0;
            const insetY: number =
                horizontalInset === 2 || (horizontalInset === 1 && horizontal) ? thickness : 0;
            space = {
                width: Math.max(0, size.width - insetX),
                height: Math.max(0, size.height - insetY),
            };
            originX =
                RobloxProperties.enum(properties, 'VerticalScrollBarPosition') === 1
                    ? Math.min(insetX, size.width)
                    : 0;
            const next: RobloxGuiSize = {
                width: Math.max(0, size.width - (vertical ? thickness : 0)),
                height: Math.max(0, size.height - (horizontal ? thickness : 0)),
            };
            if (next.width === window.width && next.height === window.height) {
                break;
            }
            window = next;
        }
        return {
            canvas,
            window,
            space,
            originX,
            x: Math.min(Math.max(0, position.x), Math.max(0, canvas.width - window.width)),
            y: Math.min(Math.max(0, position.y), Math.max(0, canvas.height - window.height)),
        };
    }
}
