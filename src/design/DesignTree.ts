// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    DesignTokenCategory,
    type DesignDocument,
    type DesignNode,
} from './DesignTypes.js';
import { DesignComponentTargets } from './DesignComponentTargets.js';

/** Explicit topology keeps layer edits, reusable components and prototype references coherent. */
export class DesignTree {
    /** Rejects orphans, cycles, duplicate placements and invalid component references. */
    public static validate(document: DesignDocument): void {
        const nodes: Map<string, DesignNode> = new Map();
        for (const node of document.nodes) {
            if (nodes.has(node.id)) {
                throw new Error('Duplicate design layer identity');
            }
            nodes.set(node.id, node);
        }
        const pages: Set<string> = new Set();
        const placed: Set<string> = new Set();
        const visiting: Set<string> = new Set();
        const visit: (id: string, parent: string | null, depth: number) => void = (
            id: string,
            parent: string | null,
            depth: number,
        ): void => {
            const node: DesignNode | undefined = nodes.get(id);
            if (node === undefined) {
                throw new Error('Referenced design layer is missing');
            }
            if (depth > 64 || visiting.has(id)) {
                throw new Error('Design layer hierarchy is cyclic or too deep');
            }
            if (placed.has(id) || node.parentId !== parent) {
                throw new Error('Design layer has conflicting parents');
            }
            placed.add(id);
            visiting.add(id);
            for (const child of node.children) {
                visit(child, id, depth + 1);
            }
            visiting.delete(id);
        };
        for (const page of document.pages) {
            if (pages.has(page.id) || nodes.has(page.id)) {
                throw new Error('Duplicate design page identity');
            }
            pages.add(page.id);
            for (const id of page.roots) {
                visit(id, null, 0);
            }
        }
        if (placed.size !== nodes.size) {
            throw new Error('Design contains orphan layers');
        }
        const tokens: Map<string, DesignTokenCategory> = new Map();
        for (const token of document.tokens) {
            if (tokens.has(token.id)) {
                throw new Error('Duplicate design token');
            }
            tokens.set(token.id, token.category);
        }
        for (const node of nodes.values()) {
            for (const paint of [
                ...node.style.fills,
                ...(node.style.stroke === null ? [] : [node.style.stroke.paint]),
            ]) {
                if (
                    paint.tokenId !== null &&
                    tokens.get(paint.tokenId) !== DesignTokenCategory.Color
                ) {
                    throw new Error('Paint requires an existing color token');
                }
            }
            if (node.componentId === null) {
                continue;
            }
            const component: DesignNode | undefined = nodes.get(node.componentId);
            if (component?.kind !== DesignKind.Component) {
                throw new Error('Instance component is missing or invalid');
            }
            const descendants: ReadonlySet<string> = DesignComponentTargets.ids(
                nodes,
                component.id,
            );
            const overridden: Set<string> = new Set();
            for (const override of node.overrides) {
                if (overridden.has(override.nodeId)) {
                    throw new Error('Duplicate instance override');
                }
                overridden.add(override.nodeId);
                if (
                    override.text !== null &&
                    nodes.get(override.nodeId)?.kind !== DesignKind.Text
                ) {
                    throw new Error('Text override requires a text layer');
                }
                for (const paint of [
                    ...(override.style?.fills ?? []),
                    ...(override.style?.stroke === null || override.style?.stroke === undefined
                        ? []
                        : [override.style.stroke.paint]),
                ]) {
                    if (
                        paint.tokenId !== null &&
                        tokens.get(paint.tokenId) !== DesignTokenCategory.Color
                    ) {
                        throw new Error('Override paint requires an existing color token');
                    }
                }
                if (!descendants.has(override.nodeId)) {
                    throw new Error('Instance override targets a layer outside its component');
                }
            }
        }
        const checked: Set<string> = new Set();
        const active: Set<string> = new Set();
        const references: (id: string, depth: number) => void = (
            id: string,
            depth: number,
        ): void => {
            if (active.has(id) || depth > 64) {
                throw new Error('Component reference is cyclic or too deep');
            }
            if (checked.has(id)) {
                return;
            }
            active.add(id);
            const node: DesignNode | undefined = nodes.get(id);
            if (node === undefined) {
                throw new Error('Component reference is missing');
            }
            for (const child of node.children) {
                references(child, depth + 1);
            }
            if (node.componentId !== null) {
                references(node.componentId, depth + 1);
            }
            active.delete(id);
            checked.add(id);
        };
        for (const node of nodes.values()) {
            references(node.id, 0);
        }
        const interactions: Set<string> = new Set();
        for (const interaction of document.interactions) {
            if (
                interactions.has(interaction.id) ||
                !nodes.has(interaction.nodeId) ||
                !nodes.has(interaction.targetId)
            ) {
                throw new Error('Invalid prototype interaction reference');
            }
            interactions.add(interaction.id);
        }
        const comments: Set<string> = new Set();
        for (const comment of document.comments) {
            if (
                comments.has(comment.id) ||
                (comment.nodeId !== null && !nodes.has(comment.nodeId))
            ) {
                throw new Error('Invalid design comment reference');
            }
            comments.add(comment.id);
        }
    }
}
