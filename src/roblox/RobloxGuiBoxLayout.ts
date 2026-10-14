// SPDX-License-Identifier: Apache-2.0

import { RobloxProperties } from './RobloxSceneRuntime';
import { RobloxGuiClasses } from './RobloxGuiClasses';
import { RobloxGuiPadding, type RobloxGuiInsets } from './RobloxGuiPadding';
import { RobloxGuiSizeConstraint, type RobloxGuiSizeLimits } from './RobloxGuiSizeConstraint';
import type { RobloxSceneNode, RobloxValue, RobloxUDim2 } from './RobloxSceneTypes';

/** A resolved GUI rectangle before its inherited affine transform. */
export interface RobloxGuiBox {
    readonly limits?: RobloxGuiSizeLimits;
    readonly node: RobloxSceneNode;
    readonly width: number;
    readonly height: number;
    readonly x: number;
    readonly y: number;
    readonly rotation: number;
}
/** Intrinsic GUI dimensions before placement and transforms. */
export interface RobloxGuiSize {
    readonly limits?: RobloxGuiSizeLimits;
    readonly width: number;
    readonly height: number;
}
/** Placement plus natural content extents, before list alignment or flex fill. */
export interface RobloxGuiBoxGroup {
    readonly boxes: ReadonlyMap<string, RobloxGuiBox>;
    readonly content: RobloxGuiSize;
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
}
/** Resolves an authored minimum against intrinsic content and the parent capacity. */
export type RobloxGuiSizeResolver = (
    node: RobloxSceneNode,
    minimum: RobloxGuiSize,
    capacity: RobloxGuiSize,
) => RobloxGuiSize;
interface ListItem {
    readonly box: RobloxGuiBox;
    readonly main: number;
    readonly cross: number;
}
interface ListLine {
    readonly items: ListItem[];
    main: number;
    cross: number;
}
interface Distribution {
    readonly start: number;
    readonly gap: number;
    readonly growth: number;
}

/** Resolves padding and row/column list layout independently of painting order. */
export class RobloxGuiBoxLayout {
    /** Calculates current rectangles from authored or recorded native properties. */
    public static evaluate(
        children: readonly RobloxSceneNode[],
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
        width: number,
        height: number,
        resolver?: RobloxGuiSizeResolver,
    ): ReadonlyMap<string, RobloxGuiBox> {
        return this.group(children, values, width, height, resolver).boxes;
    }
    /** Measures natural child/list extents while retaining resolved painting rectangles. */
    public static group(
        children: readonly RobloxSceneNode[],
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
        width: number,
        height: number,
        resolver?: RobloxGuiSizeResolver,
    ): RobloxGuiBoxGroup {
        const padding: RobloxGuiInsets = RobloxGuiPadding.resolve(children, values, width, height);
        const { left, top, right, bottom }: RobloxGuiInsets = padding;
        const availableWidth: number = Math.max(0, width - left - right);
        const availableHeight: number = Math.max(0, height - top - bottom);
        const boxes: Map<string, RobloxGuiBox> = new Map();
        for (const node of children) {
            if (!RobloxGuiClasses.objects.includes(node.className)) {
                continue;
            }
            const properties: Readonly<Record<string, RobloxValue>> =
                values.get(node.id) ?? node.properties;
            if (properties['Visible'] !== true) {
                continue;
            }
            const size: RobloxUDim2 = this.#dimension(properties, 'Size');
            const position: RobloxUDim2 = this.#dimension(properties, 'Position');
            const anchor: RobloxValue | undefined = properties['AnchorPoint'];
            if (typeof anchor !== 'object' || anchor.kind !== 'Vector2') {
                throw new Error('Missing GUI anchor');
            }
            const minimum: RobloxGuiSize = {
                width: Math.max(0, availableWidth * size.xScale + size.xOffset),
                height: Math.max(0, availableHeight * size.yScale + size.yOffset),
            };
            const resolved: RobloxGuiSize =
                resolver?.(node, minimum, { width: availableWidth, height: availableHeight }) ??
                minimum;
            const childWidth: number = resolved.width;
            const childHeight: number = resolved.height;
            boxes.set(node.id, {
                ...(resolved.limits === undefined ? {} : { limits: resolved.limits }),
                node,
                width: childWidth,
                height: childHeight,
                x:
                    left +
                    availableWidth * position.xScale +
                    position.xOffset -
                    childWidth * anchor.x,
                y:
                    top +
                    availableHeight * position.yScale +
                    position.yOffset -
                    childHeight * anchor.y,
                rotation: RobloxProperties.number(properties, 'Rotation'),
            });
        }
        const layout: RobloxSceneNode | undefined = children.find(
            (node: RobloxSceneNode): boolean => node.className === 'UIListLayout',
        );
        let content: RobloxGuiSize;
        if (layout !== undefined) {
            const natural: RobloxGuiSize = this.#list(
                boxes,
                values,
                values.get(layout.id) ?? layout.properties,
                left,
                top,
                availableWidth,
                availableHeight,
                width,
                height,
            );
            content = {
                width: left + right + natural.width,
                height: top + bottom + natural.height,
            };
        } else {
            let contentWidth: number = left;
            let contentHeight: number = top;
            for (const box of boxes.values()) {
                contentWidth = Math.max(contentWidth, box.x + box.width);
                contentHeight = Math.max(contentHeight, box.y + box.height);
            }
            content = { width: contentWidth + right, height: contentHeight + bottom };
        }
        return { boxes, content, left, top, right, bottom };
    }
    static #list(
        boxes: Map<string, RobloxGuiBox>,
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
        properties: Readonly<Record<string, RobloxValue>>,
        left: number,
        top: number,
        width: number,
        height: number,
        parentWidth: number,
        parentHeight: number,
    ): RobloxGuiSize {
        const horizontal: boolean = RobloxProperties.enum(properties, 'FillDirection') === 0;
        const mainSize: number = horizontal ? width : height;
        const crossSize: number = horizontal ? height : width;
        const gap: number = RobloxGuiPadding.pixel(
            properties,
            'Padding',
            horizontal ? parentWidth : parentHeight,
        );
        const mainFlex: number = RobloxProperties.enum(
            properties,
            horizontal ? 'HorizontalFlex' : 'VerticalFlex',
        );
        const crossFlex: number = RobloxProperties.enum(
            properties,
            horizontal ? 'VerticalFlex' : 'HorizontalFlex',
        );
        const mainAlignment: number = RobloxProperties.enum(
            properties,
            horizontal ? 'HorizontalAlignment' : 'VerticalAlignment',
        );
        const crossAlignment: number = RobloxProperties.enum(
            properties,
            horizontal ? 'VerticalAlignment' : 'HorizontalAlignment',
        );
        const order: number = RobloxProperties.enum(properties, 'SortOrder');
        const sorted: RobloxGuiBox[] = [...boxes.values()].sort(
            (a: RobloxGuiBox, b: RobloxGuiBox): number => {
                if (order === 0) {
                    return a.node.name < b.node.name ? -1 : a.node.name > b.node.name ? 1 : 0;
                }
                return (
                    RobloxProperties.number(
                        values.get(a.node.id) ?? a.node.properties,
                        'LayoutOrder',
                    ) -
                    RobloxProperties.number(
                        values.get(b.node.id) ?? b.node.properties,
                        'LayoutOrder',
                    )
                );
            },
        );
        const lines: ListLine[] = [];
        let line: ListLine = { items: [], main: 0, cross: 0 };
        for (const box of sorted) {
            const item: ListItem = {
                box,
                main: horizontal ? box.width : box.height,
                cross: horizontal ? box.height : box.width,
            };
            if (
                properties['Wraps'] === true &&
                line.items.length > 0 &&
                line.main + gap + item.main > mainSize
            ) {
                lines.push(line);
                line = { items: [], main: 0, cross: 0 };
            }
            if (line.items.length > 0) {
                line.main += gap;
            }
            line.items.push(item);
            line.main += item.main;
            line.cross = Math.max(line.cross, item.cross);
        }
        if (line.items.length > 0) {
            lines.push(line);
        }
        const usedCross: number = lines.reduce(
            (total: number, row: ListLine): number => total + row.cross,
            0,
        );
        const across: Distribution = this.#distribution(
            crossSize - usedCross,
            lines.length,
            crossFlex,
            crossAlignment,
        );
        let cross: number = across.start;
        for (const row of lines) {
            const extent: number = row.cross + across.growth;
            const along: Distribution = this.#distribution(
                mainSize - row.main,
                row.items.length,
                mainFlex,
                mainAlignment,
            );
            let main: number = along.start;
            for (const item of row.items) {
                const requestedMain: number = Math.max(0, item.main + along.growth);
                const itemAlignment: number = RobloxProperties.enum(
                    properties,
                    'ItemLineAlignment',
                );
                const requestedCross: number =
                    itemAlignment === 4 || crossFlex === 1 ? extent : item.cross;
                const constrained: RobloxGuiSize = RobloxGuiSizeConstraint.apply(
                    {
                        width: horizontal ? requestedMain : requestedCross,
                        height: horizontal ? requestedCross : requestedMain,
                    },
                    item.box.limits ?? null,
                );
                const itemMain: number = horizontal ? constrained.width : constrained.height;
                const itemCross: number = horizontal ? constrained.height : constrained.width;
                const alignment: number =
                    itemAlignment === 0
                        ? crossAlignment
                        : itemAlignment === 1
                          ? 1
                          : itemAlignment === 2
                            ? 0
                            : 2;
                const crossOffset: number = this.#aligned(extent - itemCross, alignment);
                boxes.set(item.box.node.id, {
                    ...(item.box.limits === undefined ? {} : { limits: item.box.limits }),
                    node: item.box.node,
                    width: horizontal ? itemMain : itemCross,
                    height: horizontal ? itemCross : itemMain,
                    x: left + (horizontal ? main : cross + crossOffset),
                    y: top + (horizontal ? cross + crossOffset : main),
                    rotation: 0,
                });
                main += itemMain + gap + along.gap;
            }
            cross += extent + across.gap;
        }
        const usedMain: number = lines.reduce(
            (maximum: number, row: ListLine): number => Math.max(maximum, row.main),
            0,
        );
        return {
            width: horizontal ? usedMain : usedCross,
            height: horizontal ? usedCross : usedMain,
        };
    }
    static #distribution(
        space: number,
        count: number,
        flex: number,
        alignment: number,
    ): Distribution {
        if (count === 0) {
            return { start: 0, gap: 0, growth: 0 };
        }
        const free: number = Math.max(0, space);
        switch (flex) {
            case 1:
                return { start: 0, gap: 0, growth: free / count };
            case 2:
                return { start: free / (2 * count), gap: free / count, growth: 0 };
            case 3:
                return { start: 0, gap: count > 1 ? free / (count - 1) : 0, growth: 0 };
            case 4:
                return { start: free / (count + 1), gap: free / (count + 1), growth: 0 };
            default:
                return { start: this.#aligned(space, alignment), gap: 0, growth: 0 };
        }
    }
    static #aligned(space: number, alignment: number): number {
        return alignment === 0 ? space / 2 : alignment === 2 ? space : 0;
    }
    static #dimension(properties: Readonly<Record<string, RobloxValue>>, key: string): RobloxUDim2 {
        const value: RobloxValue | undefined = properties[key];
        if (typeof value !== 'object' || value.kind !== 'UDim2') {
            throw new Error('Missing GUI ' + key);
        }
        return value;
    }
}
