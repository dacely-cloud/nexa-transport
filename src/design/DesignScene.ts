// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignScaleMetrics } from './DesignScaleMetrics.js';

import {
    DesignKind,
    type DesignDocument,
    type DesignNode,
    type DesignPage,
    type DesignOverride,
    type DesignPaint,
    type DesignToken,
    type DesignStyle,
} from './DesignTypes.js';

/** Render identity preserves both editable source and instance ownership. */
export interface DesignSceneNode extends DesignNode {
    readonly sourceId: string;
    readonly instanceId: string | null;
    /** Source boxes remain editable while only their owning Boolean silhouette is painted. */
    readonly booleanOwner?: string;
    /** Hidden source forests are painted only into their owning mask surface. */
    readonly maskOwner?: string;
}
/** A page-local expanded scene is disposable; component instances remain compact in storage. */
export interface DesignScenePage {
    readonly page: DesignPage;
    readonly nodes: readonly DesignSceneNode[];
}

/** Expands reusable components and resolves color tokens without changing authored layers. */
export class DesignScene {
    /** Materializes only the active page, with hard limits on recursive instance expansion. */
    public static page(document: DesignDocument, pageId: string): DesignScenePage {
        const page: DesignPage | undefined = document.pages.find(
            (entry: DesignPage): boolean => entry.id === pageId,
        );
        if (page === undefined) {
            throw new Error(`Page not found: ${pageId}`);
        }
        const source: ReadonlyMap<string, DesignNode> = new Map(
            document.nodes.map((node: DesignNode): [string, DesignNode] => [node.id, node]),
        );
        const tokens: ReadonlyMap<string, string> = new Map(
            document.tokens.map((token: DesignToken): [string, string] => [token.id, token.value]),
        );
        const nodes: DesignSceneNode[] = [];
        const expand: (
            sourceId: string,
            id: string,
            parentId: string | null,
            instanceId: string | null,
            overrides: readonly DesignOverride[],
            depth: number,
            scale: number,
        ) => void = (
            sourceId: string,
            id: string,
            parentId: string | null,
            instanceId: string | null,
            overrides: readonly DesignOverride[],
            depth: number,
            scale: number,
        ): void => {
            if (depth > 64 || nodes.length >= 20000) {
                throw new Error('Expanded page exceeds its layer or depth budget');
            }
            const original: DesignNode | undefined = source.get(sourceId);
            if (original === undefined) {
                throw new Error(`Layer not found: ${sourceId}`);
            }
            const override: DesignOverride | undefined = overrides.find(
                (entry: DesignOverride): boolean => entry.nodeId === sourceId,
            );
            const authored: DesignNode = this.#override(original, override);
            const edited: DesignNode = DesignScaleMetrics.node(authored, scale, false);
            if (edited.kind === DesignKind.Instance) {
                const component: DesignNode | undefined =
                    edited.componentId === null ? undefined : source.get(edited.componentId);
                if (component?.kind !== DesignKind.Component) {
                    throw new Error('Instance has no component definition');
                }
                const combined: readonly DesignOverride[] = this.#inherited(
                    edited.overrides,
                    overrides,
                );
                const rootOverride: DesignOverride | undefined = combined.find(
                    (entry: DesignOverride): boolean => entry.nodeId === component.id,
                );
                const contentScale: number = scale * (authored.contentScale ?? 1);
                const template: DesignNode = DesignScaleMetrics.node(
                    this.#override(this.#override(component, rootOverride), override),
                    contentScale,
                    false,
                );
                const ownerId: string = instanceId ?? id;
                const children: readonly string[] = template.children.map(
                    (child: string): string =>
                        `${id.startsWith('@') ? id : '@' + encodeURIComponent(id)}/${encodeURIComponent(child)}`,
                );
                nodes.push({
                    ...template,
                    id,
                    sourceId,
                    instanceId: ownerId,
                    parentId,
                    children,
                    kind: DesignKind.Frame,
                    name: edited.name,
                    x: edited.x,
                    y: edited.y,
                    width: edited.width,
                    height: edited.height,
                    rotation: edited.rotation,
                    placement:
                        contentScale === 1
                            ? edited.placement
                            : {
                                  ...edited.placement,
                                  contentReferenceWidth:
                                      (authored.placement.contentReferenceWidth ??
                                          component.width) * contentScale,
                                  contentReferenceHeight:
                                      (authored.placement.contentReferenceHeight ??
                                          component.height) * contentScale,
                              },
                    opacity: edited.opacity * template.opacity,
                    visible: edited.visible && template.visible,
                    locked: edited.locked,
                    style: this.#style(template.style, tokens),
                    componentId: null,
                    overrides: [],
                });
                for (const child of template.children) {
                    expand(
                        child,
                        `${id.startsWith('@') ? id : '@' + encodeURIComponent(id)}/${encodeURIComponent(child)}`,
                        id,
                        ownerId,
                        combined,
                        depth + 1,
                        contentScale,
                    );
                }
            } else {
                const children: readonly string[] = edited.children.map((child: string): string =>
                    instanceId === null
                        ? child
                        : `${id.startsWith('@') ? id : '@' + encodeURIComponent(id)}/${encodeURIComponent(child)}`,
                );
                nodes.push({
                    ...edited,
                    id,
                    sourceId,
                    instanceId,
                    parentId,
                    children,
                    ...(edited.mask === undefined
                        ? {}
                        : {
                              mask: {
                                  ...edited.mask,
                                  sourceId:
                                      edited.mask.sourceId === null
                                          ? null
                                          : (children[
                                                edited.children.indexOf(edited.mask.sourceId)
                                            ] ?? null),
                              },
                          }),
                    style: this.#style(edited.style, tokens),
                });
                for (let index: number = 0; index < edited.children.length; index++) {
                    const child: string | undefined = edited.children[index];
                    const childId: string | undefined = children[index];
                    if (child === undefined || childId === undefined) {
                        throw new Error('Invalid scene children');
                    }
                    expand(child, childId, id, instanceId, overrides, depth + 1, scale);
                }
            }
        };
        for (const root of page.roots) {
            expand(root, root, null, null, [], 0, 1);
        }
        const expanded: Map<string, DesignSceneNode> = new Map();
        for (let index: number = 0; index < nodes.length; index++) {
            const node: DesignSceneNode | undefined = nodes[index];
            if (node === undefined) {
                continue;
            }
            const parent: DesignSceneNode | undefined =
                node.parentId === null ? undefined : expanded.get(node.parentId);
            const owner: string | undefined =
                parent?.kind === DesignKind.Boolean ? parent.id : parent?.booleanOwner;
            const maskOwner: string | undefined =
                parent?.mask?.sourceId === node.id ? parent.id : parent?.maskOwner;
            const resolved: DesignSceneNode = {
                ...node,
                ...(owner === undefined ? {} : { booleanOwner: owner }),
                ...(maskOwner === undefined ? {} : { maskOwner }),
            };
            nodes[index] = resolved;
            expanded.set(node.id, resolved);
        }
        return { page, nodes };
    }
    /** Derived empty silhouettes and retained operands do not allocate paint, image or effect work. */
    public static paints(node: DesignSceneNode, maskOwner: string | null = null): boolean {
        return (
            (node.maskOwner ?? null) === maskOwner &&
            node.booleanOwner === undefined &&
            (node.kind !== DesignKind.Boolean || node.path.length > 0)
        );
    }
    static #override(node: DesignNode, override: DesignOverride | undefined): DesignNode {
        if (override === undefined) {
            return node;
        }
        return {
            ...node,
            name: override.name ?? node.name,
            visible: override.visible ?? node.visible,
            style: override.style ?? node.style,
            text:
                override.text === null || node.text === null
                    ? node.text
                    : { ...node.text, content: override.text, runs: [] },
        };
    }
    static #inherited(
        local: readonly DesignOverride[],
        inherited: readonly DesignOverride[],
    ): readonly DesignOverride[] {
        const values: Map<string, DesignOverride> = new Map(
            local.map((entry: DesignOverride): readonly [string, DesignOverride] => [
                entry.nodeId,
                entry,
            ]),
        );
        for (const entry of inherited) {
            const before: DesignOverride | undefined = values.get(entry.nodeId);
            values.set(entry.nodeId, {
                nodeId: entry.nodeId,
                name: entry.name ?? before?.name ?? null,
                text: entry.text ?? before?.text ?? null,
                style: entry.style ?? before?.style ?? null,
                visible: entry.visible ?? before?.visible ?? null,
            });
        }
        return [...values.values()];
    }
    static #style(style: DesignStyle, tokens: ReadonlyMap<string, string>): DesignStyle {
        const paint: (entry: DesignPaint) => DesignPaint = (entry: DesignPaint): DesignPaint =>
            entry.tokenId === null
                ? entry
                : { ...entry, color: tokens.get(entry.tokenId) ?? entry.color };
        return {
            ...style,
            fills: style.fills.map(paint),
            stroke:
                style.stroke === null
                    ? null
                    : { ...style.stroke, paint: paint(style.stroke.paint) },
        };
    }
}
