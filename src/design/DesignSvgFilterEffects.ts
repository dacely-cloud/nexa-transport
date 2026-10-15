// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignFailure, DesignFailureReason } from './DesignFailure.js';
import type { DesignSvgImportStyles } from './DesignSvgImportStyles.js';
import type { DesignSvgMatrix, DesignSvgPoint } from './DesignSvgTransforms.js';
import type { DesignShadow } from './DesignTypes.js';
import { DesignSvgFilterValues as Values } from './DesignSvgFilterValues.js';
import { DesignSvgShadowGraph } from './DesignSvgShadowGraph.js';

/** Native effects preserve representable SVG operations without storing inert markup. */
export interface DesignSvgFilterEffectsResult {
    readonly blur: number;
    readonly shadows: readonly DesignShadow[];
    readonly graph: boolean;
}

/** Single primitives and matching shadow graphs share the same validated kernel and color values. */
export class DesignSvgFilterEffects {
    public static parse(
        filter: DesignSvgElement,
        styles: DesignSvgImportStyles,
        matrix: DesignSvgMatrix,
    ): DesignSvgFilterEffectsResult {
        try {
            const primitives: readonly DesignSvgElement[] = filter.children.filter(
                (child): child is DesignSvgElement =>
                    typeof child !== 'string' &&
                    !['title', 'desc', 'metadata'].includes(child.name),
            );
            const primitive: DesignSvgElement | undefined = primitives[0];
            if (
                primitives.length !== 1 ||
                primitive === undefined ||
                !['feGaussianBlur', 'feDropShadow'].includes(primitive.name)
            ) {
                return new DesignSvgShadowGraph(primitives, styles, matrix).parse();
            }
            const style: Readonly<Record<string, string>> = styles.definition(primitive);
            Values.validate(primitive, style, [
                'in',
                'stdDeviation',
                ...(primitive.name === 'feDropShadow'
                    ? ['dx', 'dy', 'flood-color', 'flood-opacity', 'color']
                    : []),
            ]);
            if (
                primitive.attributes['in'] !== undefined &&
                primitive.attributes['in'] !== 'SourceGraphic'
            ) {
                throw new DesignFailure(
                    DesignFailureReason.Invalid,
                    'SVG filter inputs require further native effect conversion.',
                );
            }
            const blur: number =
                Values.scalar(
                    primitive.attributes['stdDeviation'] ??
                        (primitive.name === 'feDropShadow' ? '2' : '0'),
                    matrix,
                ) * 2;
            if (primitive.name === 'feGaussianBlur') {
                return { blur, shadows: [], graph: false };
            }
            const shift: DesignSvgPoint = Values.offset(primitive, matrix, 2);
            return {
                blur: 0,
                shadows: [{ ...shift, blur, spread: 0, color: Values.color(style), inner: false }],
                graph: false,
            };
        } catch (error: unknown) {
            if (error instanceof DesignFailure) {
                throw error;
            }
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                error instanceof Error ? error.message : 'Invalid SVG filter parameters.',
            );
        }
    }
}
