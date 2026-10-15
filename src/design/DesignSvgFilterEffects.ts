// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignFailure, DesignFailureReason } from './DesignFailure.js';
import type { DesignSvgImportStyles } from './DesignSvgImportStyles.js';
import type { DesignSvgMatrix } from './DesignSvgTransforms.js';
import type { DesignShadow } from './DesignTypes.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgColors } from './DesignSvgColors.js';
import { DesignSvgImportAppearance } from './DesignSvgImportAppearance.js';

/** Native effects preserve representable SVG filter operations without storing inert markup. */
export interface DesignSvgFilterEffectsResult {
    readonly blur: number;
    readonly shadows: readonly DesignShadow[];
}

/** Scalar native blur is exact only when the transformed Gaussian has equal orthogonal axes. */
export class DesignSvgFilterEffects {
    public static parse(
        filter: DesignSvgElement,
        styles: DesignSvgImportStyles,
        matrix: DesignSvgMatrix,
    ): DesignSvgFilterEffectsResult {
        try {
            return this.#parse(filter, styles, matrix);
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
    static #parse(
        filter: DesignSvgElement,
        styles: DesignSvgImportStyles,
        matrix: DesignSvgMatrix,
    ): DesignSvgFilterEffectsResult {
        const primitives: readonly DesignSvgElement[] = filter.children.filter(
            (child): child is DesignSvgElement =>
                typeof child !== 'string' && !['title', 'desc', 'metadata'].includes(child.name),
        );
        if (primitives.length !== 1) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter graphs require further native effect conversion.',
            );
        }
        const primitive: DesignSvgElement | undefined = primitives[0];
        if (
            primitive === undefined ||
            !['feGaussianBlur', 'feDropShadow'].includes(primitive.name)
        ) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'Unsupported SVG filter primitive.',
            );
        }
        const allowed: ReadonlySet<string> = new Set([
            'id',
            'class',
            'style',
            'in',
            'result',
            'stdDeviation',
            'color-interpolation-filters',
            ...(primitive.name === 'feDropShadow'
                ? ['dx', 'dy', 'flood-color', 'flood-opacity', 'color']
                : []),
        ]);
        for (const name of Object.keys(primitive.attributes)) {
            if (!allowed.has(name)) {
                throw new DesignFailure(
                    DesignFailureReason.Invalid,
                    'Unsupported SVG filter primitive attribute ' + name + '.',
                );
            }
        }
        if (
            primitive.children.some(
                (child): boolean => typeof child !== 'string' || child.trim() !== '',
            )
        ) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter animation or nested content is unsupported.',
            );
        }
        if (
            primitive.attributes['in'] !== undefined &&
            primitive.attributes['in'] !== 'SourceGraphic'
        ) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter inputs require further native effect conversion.',
            );
        }
        const style: Readonly<Record<string, string>> = styles.definition(primitive);
        if ((style['color-interpolation-filters'] ?? 'linearRGB') !== 'sRGB') {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG linearRGB filter math requires native color-space support.',
            );
        }
        const sigma: readonly number[] = DesignSvgNumbers.list(
            primitive.attributes['stdDeviation'] ?? (primitive.name === 'feDropShadow' ? '2' : '0'),
            2,
        );
        if (sigma.length === 0 || sigma.some((value: number): boolean => value < 0)) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter deviation must be nonnegative.',
            );
        }
        const xSigma: number = sigma[0] ?? 0;
        const ySigma: number = sigma[1] ?? xSigma;
        const x: number = Math.hypot(matrix.a, matrix.b) * xSigma;
        const y: number = Math.hypot(matrix.c, matrix.d) * ySigma;
        if (
            Math.abs(x - y) > 1e-8 * Math.max(1, x, y) ||
            Math.abs((matrix.a * matrix.c + matrix.b * matrix.d) * xSigma * ySigma) >
                1e-8 * Math.max(1, x * y)
        ) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG anisotropic filter blur requires native affine effect support.',
            );
        }
        const blur: number = x * 2;
        if (blur > 1000) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter blur exceeds the native effect range.',
            );
        }
        if (primitive.name === 'feGaussianBlur') {
            return { blur, shadows: [] };
        }
        const dx: number = this.#offset(primitive.attributes['dx'] ?? '2');
        const dy: number = this.#offset(primitive.attributes['dy'] ?? '2');
        const shadowX: number = matrix.a * dx + matrix.c * dy;
        const shadowY: number = matrix.b * dx + matrix.d * dy;
        if (Math.max(Math.abs(shadowX), Math.abs(shadowY)) > 1000) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG shadow offset exceeds the native effect range.',
            );
        }
        const color: string = DesignSvgColors.parse(
            style['flood-color'] ?? '#000000',
            style['color'],
        );
        const alpha: number = color.length === 9 ? parseInt(color.slice(7), 16) / 255 : 1;
        const opacity: number = DesignSvgImportAppearance.opacity(style['flood-opacity']);
        const combined: string =
            color.slice(0, 7) +
            Math.round(alpha * opacity * 255)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase();
        return {
            blur: 0,
            shadows: [{ x: shadowX, y: shadowY, blur, spread: 0, color: combined, inner: false }],
        };
    }
    static #offset(source: string): number {
        const values: readonly number[] = DesignSvgNumbers.list(source, 1);
        const value: number | undefined = values[0];
        if (value === undefined) {
            throw new DesignFailure(DesignFailureReason.Invalid, 'SVG shadow offset is missing.');
        }
        return value;
    }
}
