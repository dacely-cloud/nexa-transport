// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignCodec } from './DesignCodec.js';
import type { DesignTokenOperation } from './DesignOperationTypes.js';
import type {
    DesignDocument,
    DesignToken,
    DesignNode,
    DesignPaint,
    DesignStyle,
    DesignOverride,
} from './DesignTypes.js';

/** Single-token edits preserve linked artwork and detach deleted colors at their last resolved value. */
export class DesignTokenEdits {
    /** Document validation after the whole transaction catches any remaining invalid references. */
    public static apply(document: DesignDocument, operation: DesignTokenOperation): DesignDocument {
        const before: DesignToken | undefined = document.tokens.find(
            (token: DesignToken): boolean => token.id === operation.id,
        );
        if (operation.changes === null) {
            if (before === undefined) {
                throw new Error('Design token not found: ' + operation.id);
            }
            return {
                ...document,
                tokens: document.tokens.filter(
                    (token: DesignToken): boolean => token.id !== operation.id,
                ),
                nodes: document.nodes.map((node: DesignNode): DesignNode =>
                    this.#detach(node, before),
                ),
            };
        }
        if (
            before === undefined &&
            (operation.changes.name === undefined ||
                operation.changes.category === undefined ||
                operation.changes.value === undefined)
        ) {
            throw new Error('A new token requires name, category and value.');
        }
        const token: DesignToken = DesignCodec.token({
            ...before,
            id: operation.id,
            ...operation.changes,
        });
        return {
            ...document,
            tokens:
                before === undefined
                    ? [...document.tokens, token]
                    : document.tokens.map((entry: DesignToken): DesignToken =>
                          entry.id === token.id ? token : entry,
                      ),
        };
    }
    /** Counts authored paint links, including instance overrides, without expanding instance artwork. */
    public static references(document: DesignDocument, id: string): number {
        return this.counts(document).get(id) ?? 0;
    }
    /** A palette computes every link count in one pass instead of rescanning the scene per row. */
    public static counts(document: DesignDocument): ReadonlyMap<string, number> {
        const counts: Map<string, number> = new Map();
        const inspect: (paint: DesignPaint) => void = (paint: DesignPaint): void => {
            if (paint.tokenId !== null) {
                counts.set(paint.tokenId, (counts.get(paint.tokenId) ?? 0) + 1);
            }
        };
        const style: (value: DesignStyle) => void = (value: DesignStyle): void => {
            for (const paint of value.fills) {
                inspect(paint);
            }
            if (value.stroke !== null) {
                inspect(value.stroke.paint);
            }
        };
        for (const node of document.nodes) {
            style(node.style);
            for (const override of node.overrides) {
                if (override.style !== null) {
                    style(override.style);
                }
            }
        }
        return counts;
    }
    static #detach(node: DesignNode, token: DesignToken): DesignNode {
        const style: DesignStyle = this.#style(node.style, token);
        let changed: boolean = style !== node.style;
        const overrides: readonly DesignOverride[] = node.overrides.map(
            (override: DesignOverride): DesignOverride => {
                if (override.style === null) {
                    return override;
                }
                const next: DesignStyle = this.#style(override.style, token);
                if (next === override.style) {
                    return override;
                }
                changed = true;
                return { ...override, style: next };
            },
        );
        return changed ? { ...node, style, overrides } : node;
    }
    static #style(style: DesignStyle, token: DesignToken): DesignStyle {
        let changed: boolean = false;
        const detach: (paint: DesignPaint) => DesignPaint = (paint: DesignPaint): DesignPaint => {
            if (paint.tokenId !== token.id) {
                return paint;
            }
            changed = true;
            return { ...paint, tokenId: null, color: token.value };
        };
        const fills: readonly DesignPaint[] = style.fills.map(detach);
        const stroke: DesignStyle['stroke'] =
            style.stroke === null ? null : { ...style.stroke, paint: detach(style.stroke.paint) };
        return changed ? { ...style, fills, stroke } : style;
    }
}
