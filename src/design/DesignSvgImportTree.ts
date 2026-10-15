// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignPathGeometry } from './DesignPaths.js';
import type { DesignNode } from './DesignTypes.js';
import type { DesignSvgSourceBounds } from './DesignSvgImportGeometry.js';
import { DesignSvgTransforms, type DesignSvgMatrix } from './DesignSvgTransforms.js';

interface DesignSvgOriginalBounds {
    readonly bounds: DesignSvgSourceBounds;
    readonly matrix: DesignSvgMatrix;
}

/** Imported hierarchy is indexed once; normalizing nested groups does not scan unrelated layers. */
export class DesignSvgImportTree {
    #nodes: DesignNode[] = [];
    #indices: Map<string, number> = new Map();
    #excludedBounds: Set<string> = new Set();
    #geometry: Map<string, DesignPathGeometry> = new Map();
    #originalBounds: Map<string, DesignSvgOriginalBounds> = new Map();
    public get nodes(): readonly DesignNode[] {
        return this.#nodes;
    }
    public node(id: string): DesignNode {
        const node: DesignNode | undefined = this.#nodes[this.#indices.get(id) ?? -1];
        if (node === undefined) {
            throw new Error('Missing imported SVG layer.');
        }
        return node;
    }
    public sourceGeometry(id: string): DesignPathGeometry | undefined {
        return this.#geometry.get(id);
    }
    public recordGeometry(id: string, geometry: DesignPathGeometry): void {
        this.#geometry.set(id, geometry);
    }
    /** Object-unit effects use original tight bounds when undoing the same transform, avoiding float32 path drift. */
    public recordOriginalBounds(
        id: string,
        bounds: DesignSvgSourceBounds,
        matrix: DesignSvgMatrix,
    ): void {
        this.#originalBounds.set(id, { bounds, matrix });
    }
    public originalBounds(id: string, matrix: DesignSvgMatrix): DesignSvgSourceBounds | null {
        const original: DesignSvgOriginalBounds | undefined = this.#originalBounds.get(id);
        if (original === undefined) {
            return null;
        }
        const map: DesignSvgMatrix = DesignSvgTransforms.multiply(matrix, original.matrix);
        if (
            Math.max(Math.abs(map.a - 1), Math.abs(map.b), Math.abs(map.c), Math.abs(map.d - 1)) >
            1e-12
        ) {
            return null;
        }
        return { ...original.bounds, x: original.bounds.x + map.e, y: original.bounds.y + map.f };
    }
    public excludeBounds(id: string): void {
        this.#excludedBounds.add(id);
    }
    public contributesBounds(id: string): boolean {
        return !this.#excludedBounds.has(id);
    }
    public append(node: DesignNode): void {
        if (this.#nodes.length >= 10000) {
            throw new Error('SVG exceeds the imported layer budget.');
        }
        if (this.#indices.has(node.id)) {
            throw new Error('Duplicate imported SVG layer id.');
        }
        this.#indices.set(node.id, this.#nodes.length);
        this.#nodes.push(node);
    }
    public replace(id: string, edit: (node: DesignNode) => DesignNode): void {
        const index: number = this.#indices.get(id) ?? -1;
        const node: DesignNode | undefined = this.#nodes[index];
        if (node === undefined) {
            throw new Error('Missing imported SVG layer.');
        }
        this.#nodes[index] = edit(node);
    }
    public tighten(id: string): void {
        const parent: DesignNode | undefined = this.#nodes[this.#indices.get(id) ?? -1];
        if (parent === undefined || parent.children.length === 0) {
            return;
        }
        const children: readonly DesignNode[] = parent.children.map(
            (childId: string): DesignNode => {
                const child: DesignNode | undefined = this.#nodes[this.#indices.get(childId) ?? -1];
                if (child === undefined || child.parentId !== id) {
                    throw new Error('Missing imported SVG child.');
                }
                return child;
            },
        );
        const left: number = Math.min(...children.map((node: DesignNode): number => node.x));
        const top: number = Math.min(...children.map((node: DesignNode): number => node.y));
        const right: number = Math.max(
            ...children.map((node: DesignNode): number => node.x + node.width),
        );
        const bottom: number = Math.max(
            ...children.map((node: DesignNode): number => node.y + node.height),
        );
        this.replace(id, (node: DesignNode): DesignNode => ({
            ...node,
            x: left,
            y: top,
            width: Math.max(0.01, right - left),
            height: Math.max(0.01, bottom - top),
        }));
        for (const child of children) {
            this.replace(child.id, (node: DesignNode): DesignNode => ({
                ...node,
                x: node.x - left,
                y: node.y - top,
            }));
        }
    }
}
