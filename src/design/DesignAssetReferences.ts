// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignDocument, DesignNode, DesignStyle, DesignPaint } from './DesignTypes.js';
import type { DesignChangeSet } from './DesignOperationTypes.js';

/** Finds image references in authored layers, component overrides and undo preimages. */
export class DesignAssetReferences {
    /** Current scene references are independent of visibility or the selected page. */
    public static document(document: DesignDocument): readonly string[] {
        return this.nodes(document.nodes);
    }
    /** Both sides stay usable throughout the retained undo lifetime. */
    public static changes(changes: DesignChangeSet): readonly string[] {
        const nodes: DesignNode[] = [];
        for (const change of changes.nodes) {
            if (change.before !== null) {
                nodes.push(change.before);
            }
            if (change.after !== null) {
                nodes.push(change.after);
            }
        }
        return this.nodes(nodes);
    }
    /** Repeated uses within one document consume one durable pin. */
    public static nodes(nodes: readonly DesignNode[]): readonly string[] {
        const ids: Set<string> = new Set();
        for (const node of nodes) {
            if (node.image !== null) {
                ids.add(node.image.assetId);
            }
            this.#style(node.style, ids);
            for (const override of node.overrides) {
                if (override.style !== null) {
                    this.#style(override.style, ids);
                }
            }
        }
        return [...ids].sort();
    }
    static #style(style: DesignStyle, ids: Set<string>): void {
        for (const paint of style.fills) {
            this.#paint(paint, ids);
        }
        if (style.stroke !== null) {
            this.#paint(style.stroke.paint, ids);
        }
    }
    static #paint(paint: DesignPaint, ids: Set<string>): void {
        if (paint.assetId !== null) {
            ids.add(paint.assetId);
        }
    }
}
