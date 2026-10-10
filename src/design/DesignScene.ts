// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

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
        ) => void = (
            sourceId: string,
            id: string,
            parentId: string | null,
            instanceId: string | null,
            overrides: readonly DesignOverride[],
            depth: number,
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
            const edited: DesignNode = this.#override(original, override);
            if (edited.kind === DesignKind.Instance) {
                const component: DesignNode | undefined =
                    edited.componentId === null ? undefined : source.get(edited.componentId);
                if (component?.kind !== DesignKind.Component) {
                    throw new Error('Instance has no component definition');
                }
                const rootOverride: DesignOverride | undefined = edited.overrides.find(
                    (entry: DesignOverride): boolean => entry.nodeId === component.id,
                );
                const template: DesignNode = this.#override(component, rootOverride);
                const children: readonly string[] = template.children.map(
                    (child: string): string =>
                        `${id.startsWith('@') ? id : '@' + encodeURIComponent(id)}/${encodeURIComponent(child)}`,
                );
                nodes.push({
                    ...template,
                    id,
                    sourceId,
                    instanceId: id,
                    parentId,
                    children,
                    kind: DesignKind.Frame,
                    name: edited.name,
                    x: edited.x,
                    y: edited.y,
                    width: edited.width,
                    height: edited.height,
                    rotation: edited.rotation,
                    placement: edited.placement,
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
                        id,
                        edited.overrides,
                        depth + 1,
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
                    style: this.#style(edited.style, tokens),
                });
                for (let index: number = 0; index < edited.children.length; index++) {
                    const child: string | undefined = edited.children[index];
                    const childId: string | undefined = children[index];
                    if (child === undefined || childId === undefined) {
                        throw new Error('Invalid scene children');
                    }
                    expand(child, childId, id, instanceId, overrides, depth + 1);
                }
            }
        };
        for (const root of page.roots) {
            expand(root, root, null, null, [], 0);
        }
        return { page, nodes };
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
