// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignTokenCategory,
    type DesignToken,
    type DesignNode,
    type DesignText,
} from './DesignTypes.js';
import type { DesignTypographyValues } from './DesignTypographyStyleTypes.js';
import { DesignTypographyMerge } from './DesignTypographyMerge.js';

/** Linked styles are materialized into complete layer typography without replacing their source bodies. */
export class DesignTypographyLinks {
    /** Missing or legacy untyped typography values cannot become a linked text style. */
    public static values(tokens: readonly DesignToken[], id: string): DesignTypographyValues {
        const token: DesignToken | undefined = tokens.find(
            (entry: DesignToken): boolean => entry.id === id,
        );
        if (token?.category !== DesignTokenCategory.Typography || token.typography === undefined) {
            throw new Error('Saved text style not found: ' + id);
        }
        return token.typography;
    }
    /** Each linked node retains local overrides and rich ranges while inheriting changed base values. */
    public static resolve(
        nodes: readonly DesignNode[],
        tokens: readonly DesignToken[],
    ): readonly DesignNode[] {
        const styles: ReadonlyMap<string, DesignTypographyValues> = new Map(
            tokens.flatMap((token: DesignToken): [string, DesignTypographyValues][] =>
                token.typography === undefined ? [] : [[token.id, token.typography]],
            ),
        );
        return nodes.map((node: DesignNode): DesignNode => {
            if (node.text?.typographyStyle == null) {
                return node;
            }
            const value: DesignTypographyValues | undefined = styles.get(
                node.text.typographyStyle.tokenId,
            );
            if (value === undefined) {
                throw new Error('Saved text style not found: ' + node.text.typographyStyle.tokenId);
            }
            const target: DesignTypographyValues = {
                ...value,
                ...node.text.typographyStyle.overrides,
            };
            const previous: DesignText = node.text;
            if (
                previous.family === target.family &&
                previous.size === target.size &&
                previous.weight === target.weight &&
                previous.italic === target.italic &&
                previous.lineHeight === target.lineHeight &&
                previous.letterSpacing === target.letterSpacing &&
                previous.align === target.align &&
                (previous.font?.id ?? null) === (target.font?.id ?? null) &&
                (previous.font?.sha256 ?? null) === (target.font?.sha256 ?? null)
            ) {
                return node;
            }
            const text: DesignText = DesignTypographyMerge.changes(previous, target);
            return { ...node, text };
        });
    }
}
