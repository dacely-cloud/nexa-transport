// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignNode } from './DesignTypes.js';

/** Imported hierarchy is indexed once; normalizing nested groups does not scan unrelated layers. */
export class DesignSvgImportTree {
    #nodes: DesignNode[] = [];
    #indices: Map<string, number> = new Map();
    public get nodes(): readonly DesignNode[] {
        return this.#nodes;
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
