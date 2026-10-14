// SPDX-License-Identifier: Apache-2.0
import type { RobloxScene, RobloxSceneNode, RobloxValue } from './RobloxSceneTypes';
import { RobloxProperties } from './RobloxSceneRuntime';
import {
    RobloxGuiBoxLayout,
    type RobloxGuiBox,
    type RobloxGuiSize,
    type RobloxGuiBoxGroup,
    type RobloxGuiSizeResolver,
} from './RobloxGuiBoxLayout';
import { RobloxGuiScroll, type RobloxGuiScrollGeometry } from './RobloxGuiScroll';
import { RobloxGuiAutoSize } from './RobloxGuiAutoSize';
import { RobloxGuiPadding, type RobloxGuiInsets } from './RobloxGuiPadding';
import { RobloxSceneHierarchy } from './RobloxSceneHierarchy';
import { RobloxGuiClasses } from './RobloxGuiClasses';
import { RobloxGuiText } from './RobloxGuiText';
import { RobloxGuiImages, type RobloxGuiImage } from './RobloxGuiImages';
import { RobloxGuiScale } from './RobloxGuiScale';
import { RobloxTextSelection, type RobloxTextSelectionGeometry } from './RobloxTextSelection';
import { RobloxTextHit } from './RobloxTextHit';

/** Affine local-pixel to viewport-pixel transform. */
export type RobloxGuiTransform = readonly [number, number, number, number, number, number];
/** Rectangular descendant clipping, independent of a parent's rounded background. */
export type RobloxGuiClip = readonly [number, number, number, number];
/** Resolved visual state; text and geometry use the same native layout observation. */
export interface RobloxGuiElement {
    /** Optional padded text rectangle in local pixels; absent means the whole control. */
    readonly textRect?: readonly [number, number, number, number];
    readonly id: string;
    readonly width: number;
    readonly height: number;
    readonly transform: RobloxGuiTransform;
    readonly clip: RobloxGuiClip;
    readonly background: readonly [number, number, number, number];
    readonly radius: number;
    readonly text: string;
    readonly textColor: readonly [number, number, number, number];
    readonly textSize: number;
    readonly textWrapped: boolean;
    readonly textX: number;
    readonly textY: number;
    readonly stroke: readonly [number, number, number, number];
    readonly strokeWidth: number;
    readonly strokeText: boolean;
    readonly image: RobloxGuiImage | null;
}
interface GuiParent {
    readonly width: number;
    readonly height: number;
    readonly transform: RobloxGuiTransform;
    readonly clip: RobloxGuiClip;
    readonly rotated: boolean;
}

/** Deterministic viewport layout for the classes supported by the current projection. */
export class RobloxGuiLayout {
    /** Maps a viewport pointer to the closest native UTF-8 boundary in actual TextBox text. */
    public textPosition(
        element: RobloxGuiElement,
        properties: Readonly<Record<string, RobloxValue>>,
        x: number,
        y: number,
    ): number {
        const metrics: import('./RobloxTextMetrics').RobloxTextMetrics | undefined =
            this.#scene.textMetrics;
        if (metrics === undefined) {
            throw new Error('TextBox hit testing requires the actual native font metrics');
        }
        const [a, b, c, d, tx, ty]: RobloxGuiTransform = element.transform;
        const determinant: number = a * d - b * c;
        if (!Number.isFinite(determinant) || determinant === 0) {
            throw new Error('TextBox transform cannot be inverted');
        }
        const text: RobloxValue | undefined = properties['Text'];
        return RobloxTextHit.position(metrics, {
            text: typeof text === 'string' ? text : '',
            size: element.textSize,
            wrapped: element.textWrapped,
            rect: element.textRect ?? [0, 0, element.width, element.height],
            alignX: element.textX,
            alignY: element.textY,
            x: ((x - tx) * d - (y - ty) * c) / determinant,
            y: ((y - ty) * a - (x - tx) * b) / determinant,
        });
    }
    /** Resolves native TextBox byte positions against this scene's measured font and padded text rectangle. */
    public selection(
        element: RobloxGuiElement,
        properties: Readonly<Record<string, RobloxValue>>,
    ): RobloxTextSelectionGeometry {
        const cursor: RobloxValue | undefined = properties['CursorPosition'];
        if (typeof cursor !== 'number' || cursor < 1) {
            return { insertion: null, selection: [] };
        }
        const metrics: import('./RobloxTextMetrics').RobloxTextMetrics | undefined =
            this.#scene.textMetrics;
        if (metrics === undefined) {
            throw new Error('TextBox selection requires the actual native font metrics');
        }
        const text: RobloxValue | undefined = properties['Text'];
        const anchor: RobloxValue | undefined = properties['SelectionStart'];
        return RobloxTextSelection.resolve(metrics, {
            text: typeof text === 'string' ? text : '',
            size: element.textSize,
            wrapped: element.textWrapped,
            rect: element.textRect ?? [0, 0, element.width, element.height],
            alignX: element.textX,
            alignY: element.textY,
            cursor,
            selectionStart: typeof anchor === 'number' ? anchor : -1,
        });
    }
    readonly #scene: RobloxScene;
    readonly #children: ReadonlyMap<string | null, readonly RobloxSceneNode[]>;
    readonly #nodes: ReadonlyMap<string, RobloxSceneNode>;
    readonly #order: ReadonlyMap<string, number>;
    readonly #screens: readonly RobloxSceneNode[];
    readonly #source: RobloxScene | null;
    #imagePatches: number = 0;
    #sizing: RobloxGuiAutoSize | null = null;
    #projected: RobloxGuiLayout | null = null;
    #projectedNodes: readonly RobloxSceneNode[] | null = null;
    public constructor(scene: RobloxScene, projectedNodes?: readonly RobloxSceneNode[]) {
        this.#scene = scene;
        this.#source = projectedNodes === undefined ? scene : null;
        const nodes: readonly RobloxSceneNode[] = projectedNodes ?? scene.nodes;
        const children: Map<string | null, RobloxSceneNode[]> = new Map();
        for (const node of nodes) {
            const siblings: RobloxSceneNode[] = children.get(node.parentId) ?? [];
            siblings.push(node);
            children.set(node.parentId, siblings);
        }
        this.#children = children;
        this.#nodes = new Map(
            nodes.map((node: RobloxSceneNode): readonly [string, RobloxSceneNode] => [
                node.id,
                node,
            ]),
        );
        this.#screens = nodes.filter(
            (node: RobloxSceneNode): boolean => node.className === 'ScreenGui',
        );
        const order: Map<string, number> = new Map();
        const visit: (node: RobloxSceneNode) => void = (node: RobloxSceneNode): void => {
            order.set(node.id, order.size);
            for (const child of children.get(node.id) ?? []) {
                visit(child);
            }
        };
        for (const screen of this.#screens) {
            visit(screen);
        }
        this.#order = order;
    }
    public evaluate(
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
        width: number,
        height: number,
        time: number = 0,
    ): readonly RobloxGuiElement[] {
        if (this.#source !== null && (this.#source.hierarchy?.length ?? 0) > 0) {
            const nodes: readonly RobloxSceneNode[] = RobloxSceneHierarchy.nodes(
                this.#source,
                time,
            );
            if (nodes !== this.#projectedNodes || this.#projected === null) {
                this.#projectedNodes = nodes;
                this.#projected = new RobloxGuiLayout(this.#source, nodes);
            }
            return this.#projected.evaluate(values, width, height);
        }
        values = RobloxGuiScale.project(this.#children, values);
        const result: RobloxGuiElement[] = [];
        this.#sizing = new RobloxGuiAutoSize(this.#children, values, this.#scene.textMetrics);
        this.#imagePatches = 0;
        const screens: RobloxSceneNode[] = [...this.#screens].sort(
            (a: RobloxSceneNode, b: RobloxSceneNode): number =>
                RobloxProperties.number(values.get(a.id) ?? a.properties, 'DisplayOrder') -
                RobloxProperties.number(values.get(b.id) ?? b.properties, 'DisplayOrder'),
        );
        for (const screen of screens) {
            const properties: Readonly<Record<string, RobloxValue>> =
                values.get(screen.id) ?? screen.properties;
            if (properties['Enabled'] !== true) {
                continue;
            }
            const parent: GuiParent = {
                width,
                height,
                transform: [1, 0, 0, 1, 0, 0],
                clip: [0, 0, width, height],
                rotated: false,
            };
            const layer: RobloxGuiElement[] = [];
            this.#renderChildren(screen.id, parent, values, layer, width, height);
            if (RobloxProperties.enum(properties, 'ZIndexBehavior') === 0) {
                layer.sort(
                    (a: RobloxGuiElement, b: RobloxGuiElement): number =>
                        this.#zIndex(a.id, values) - this.#zIndex(b.id, values) ||
                        (this.#order.get(a.id) ?? 0) - (this.#order.get(b.id) ?? 0),
                );
            }
            result.push(...layer);
        }
        return result;
    }
    #zIndex(
        id: string,
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
    ): number {
        const node: RobloxSceneNode | undefined = this.#nodes.get(id);
        if (node === undefined) {
            throw new Error('Missing GUI node ' + id);
        }
        return RobloxProperties.number(values.get(id) ?? node.properties, 'ZIndex');
    }
    #siblings(
        id: string,
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
    ): readonly RobloxSceneNode[] {
        return [...(this.#children.get(id) ?? [])]
            .filter((node: RobloxSceneNode): boolean =>
                RobloxGuiClasses.objects.includes(node.className),
            )
            .sort(
                (a: RobloxSceneNode, b: RobloxSceneNode): number =>
                    RobloxProperties.number(values.get(a.id) ?? a.properties, 'ZIndex') -
                    RobloxProperties.number(values.get(b.id) ?? b.properties, 'ZIndex'),
            );
    }
    #renderChildren(
        id: string,
        parent: GuiParent,
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
        result: RobloxGuiElement[],
        viewportWidth: number,
        viewportHeight: number,
    ): void {
        const resolver: RobloxGuiSizeResolver = (
            node: RobloxSceneNode,
            minimum: RobloxGuiSize,
            capacity: RobloxGuiSize,
        ): RobloxGuiSize => {
            if (this.#sizing === null) {
                throw new Error('Missing automatic GUI sizing observation');
            }
            return this.#sizing.resolve(node, minimum, capacity);
        };
        const children: readonly RobloxSceneNode[] = this.#children.get(id) ?? [];
        let group: RobloxGuiBoxGroup = RobloxGuiBoxLayout.group(
            children,
            values,
            parent.width,
            parent.height,
            resolver,
        );
        const owner: RobloxSceneNode | undefined = this.#nodes.get(id);
        if (owner?.className === 'ScrollingFrame') {
            const properties: Readonly<Record<string, RobloxValue>> =
                values.get(id) ?? owner.properties;
            const size: RobloxGuiSize = { width: parent.width, height: parent.height };
            let scroll: RobloxGuiScrollGeometry = RobloxGuiScroll.resolve(
                properties,
                size,
                group.content,
            );
            for (let iteration: number = 0; iteration < 16; iteration++) {
                const previous: RobloxGuiSize = scroll.space;
                group = RobloxGuiBoxLayout.group(
                    children,
                    values,
                    previous.width,
                    previous.height,
                    resolver,
                );
                scroll = RobloxGuiScroll.resolve(properties, size, group.content);
                if (
                    previous.width === scroll.space.width &&
                    previous.height === scroll.space.height
                ) {
                    break;
                }
            }
            const clip: RobloxGuiClip =
                properties['ClipsDescendants'] === true && !parent.rotated
                    ? this.#intersect(parent.clip, [
                          parent.transform[4] + scroll.originX,
                          parent.transform[5],
                          parent.transform[4] + scroll.originX + scroll.space.width,
                          parent.transform[5] + scroll.space.height,
                      ])
                    : parent.clip;
            parent = {
                ...parent,
                width: scroll.space.width,
                height: scroll.space.height,
                clip,
                transform: this.#multiply(parent.transform, [
                    1,
                    0,
                    0,
                    1,
                    scroll.originX - scroll.x,
                    -scroll.y,
                ]),
            };
        }
        const boxes: ReadonlyMap<string, RobloxGuiBox> = group.boxes;
        for (const node of this.#siblings(id, values)) {
            const box: RobloxGuiBox | undefined = boxes.get(node.id);
            if (box !== undefined) {
                this.#render(box, parent, values, result, viewportWidth, viewportHeight);
            }
        }
    }
    #render(
        box: RobloxGuiBox,
        parent: GuiParent,
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
        result: RobloxGuiElement[],
        viewportWidth: number,
        viewportHeight: number,
    ): void {
        const node: RobloxSceneNode = box.node;
        const properties: Readonly<Record<string, RobloxValue>> =
            values.get(node.id) ?? node.properties;
        if (properties['Visible'] !== true) {
            return;
        }
        const width: number = box.width;
        const height: number = box.height;
        const x: number = box.x;
        const y: number = box.y;
        const angle: number = (box.rotation * Math.PI) / 180;
        const c: number = Math.cos(angle);
        const s: number = Math.sin(angle);
        const transform: RobloxGuiTransform = this.#multiply(parent.transform, [
            c,
            s,
            -s,
            c,
            x + width / 2 - (c * width) / 2 + (s * height) / 2,
            y + height / 2 - (s * width) / 2 - (c * height) / 2,
        ]);
        const rotated: boolean = parent.rotated || angle !== 0;
        const clip: RobloxGuiClip = rotated ? [0, 0, viewportWidth, viewportHeight] : parent.clip;
        const modifiers: readonly RobloxSceneNode[] = this.#children.get(node.id) ?? [];
        const padding: RobloxGuiInsets = RobloxGuiPadding.resolve(modifiers, values, width, height);
        const corner: RobloxSceneNode | undefined = modifiers.find(
            (child: RobloxSceneNode): boolean => child.className === 'UICorner',
        );
        const radius: RobloxValue | undefined =
            corner === undefined
                ? undefined
                : (values.get(corner.id) ?? corner.properties)['CornerRadius'];
        const rounding: number =
            typeof radius === 'object' && radius.kind === 'UDim'
                ? Math.max(
                      0,
                      Math.min(
                          Math.min(width, height) / 2,
                          Math.min(width, height) * radius.scale + radius.offset,
                      ),
                  )
                : 0;
        const strokeNode: RobloxSceneNode | undefined = modifiers.find(
            (child: RobloxSceneNode): boolean => child.className === 'UIStroke',
        );
        const strokeProperties: Readonly<Record<string, RobloxValue>> | null =
            strokeNode === undefined ? null : (values.get(strokeNode.id) ?? strokeNode.properties);
        const strokeEnabled: boolean = strokeProperties?.['Enabled'] === true;
        const element: RobloxGuiElement = {
            ...(RobloxGuiClasses.text(node.className) &&
            modifiers.some((child: RobloxSceneNode): boolean => child.className === 'UIPadding')
                ? {
                      textRect: [
                          padding.left,
                          padding.top,
                          Math.max(0, width - padding.left - padding.right),
                          Math.max(0, height - padding.top - padding.bottom),
                      ] as const,
                  }
                : {}),
            id: node.id,
            width,
            height,
            transform,
            clip,
            background: this.#color(properties, 'BackgroundColor3', 'BackgroundTransparency'),
            radius: rounding,
            text: RobloxGuiText.content(node.className, properties),
            textColor: !RobloxGuiClasses.text(node.className)
                ? [0, 0, 0, 0]
                : this.#color(
                      properties,
                      RobloxGuiText.placeholder(node.className, properties)
                          ? 'PlaceholderColor3'
                          : 'TextColor3',
                      'TextTransparency',
                  ),
            textSize: !RobloxGuiClasses.text(node.className)
                ? 1
                : RobloxProperties.number(properties, 'TextSize'),
            textWrapped: properties['TextWrapped'] === true,
            textX: !RobloxGuiClasses.text(node.className)
                ? 2
                : RobloxProperties.enum(properties, 'TextXAlignment'),
            textY: !RobloxGuiClasses.text(node.className)
                ? 1
                : RobloxProperties.enum(properties, 'TextYAlignment'),
            stroke:
                strokeProperties !== null && strokeEnabled
                    ? this.#color(strokeProperties, 'Color', 'Transparency')
                    : [0, 0, 0, 0],
            strokeWidth:
                strokeProperties !== null && strokeEnabled
                    ? RobloxProperties.number(strokeProperties, 'Thickness')
                    : 0,
            strokeText:
                strokeProperties !== null &&
                RobloxGuiClasses.text(node.className) &&
                RobloxProperties.enum(strokeProperties, 'ApplyStrokeMode') === 0,
            image: RobloxGuiClasses.image(node.className)
                ? RobloxGuiImages.resolve(this.#scene, properties, width, height)
                : null,
        };
        if (width > 0 && height > 0) {
            this.#imagePatches += element.image?.quads.length ?? 0;
            if (this.#imagePatches > 8192) {
                throw new Error('GUI image scene exceeds 8192 patches');
            }
            result.push(element);
        }
        const descendantClip: RobloxGuiClip =
            properties['ClipsDescendants'] === true && !rotated
                ? this.#intersect(clip, [
                      transform[4],
                      transform[5],
                      transform[4] + width,
                      transform[5] + height,
                  ])
                : clip;
        const childParent: GuiParent = { width, height, transform, clip: descendantClip, rotated };
        this.#renderChildren(node.id, childParent, values, result, viewportWidth, viewportHeight);
    }
    #color(
        properties: Readonly<Record<string, RobloxValue>>,
        key: string,
        transparency: string,
    ): readonly [number, number, number, number] {
        const color: import('./RobloxSceneTypes').RobloxColor3 = RobloxProperties.color(
            properties,
            key,
        );
        return [color.r, color.g, color.b, 1 - RobloxProperties.number(properties, transparency)];
    }
    #intersect(a: RobloxGuiClip, b: RobloxGuiClip): RobloxGuiClip {
        return [
            Math.max(a[0], b[0]),
            Math.max(a[1], b[1]),
            Math.min(a[2], b[2]),
            Math.min(a[3], b[3]),
        ];
    }
    #multiply(a: RobloxGuiTransform, b: RobloxGuiTransform): RobloxGuiTransform {
        return [
            a[0] * b[0] + a[2] * b[1],
            a[1] * b[0] + a[3] * b[1],
            a[0] * b[2] + a[2] * b[3],
            a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5] + a[4],
            a[1] * b[4] + a[3] * b[5] + a[5],
        ];
    }
}
