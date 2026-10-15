// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgMatrix, DesignSvgPoint } from './DesignSvgTransforms.js';
import { DesignFailure, DesignFailureReason } from './DesignFailure.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgColors } from './DesignSvgColors.js';
import { DesignSvgImportAppearance } from './DesignSvgImportAppearance.js';

/** Shared primitive decoding retains color alpha and exact transformed kernel requirements. */
export class DesignSvgFilterValues {
    public static validate(
        element: DesignSvgElement,
        style: Readonly<Record<string, string>>,
        attributes: readonly string[],
        children: boolean = false,
    ): void {
        const allowed: ReadonlySet<string> = new Set([
            'id',
            'class',
            'style',
            'result',
            'color-interpolation-filters',
            ...attributes,
        ]);
        for (const name of Object.keys(element.attributes)) {
            if (!allowed.has(name)) {
                throw new DesignFailure(
                    DesignFailureReason.Invalid,
                    'Unsupported SVG filter primitive attribute ' + name + '.',
                );
            }
        }
        if (
            !children &&
            element.children.some(
                (child): boolean => typeof child !== 'string' || child.trim() !== '',
            )
        ) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter animation or nested content is unsupported.',
            );
        }
        if ((style['color-interpolation-filters'] ?? 'linearRGB') !== 'sRGB') {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG linearRGB filter math requires native color-space support.',
            );
        }
    }
    public static scalar(source: string, matrix: DesignSvgMatrix, maximum: number = 500): number {
        const values: readonly number[] = DesignSvgNumbers.list(source, 2);
        if (values.length === 0 || values.some((value: number): boolean => value < 0)) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter deviation must be nonnegative.',
            );
        }
        const xValue: number = values[0] ?? 0;
        const yValue: number = values[1] ?? xValue;
        const x: number = Math.hypot(matrix.a, matrix.b) * xValue;
        const y: number = Math.hypot(matrix.c, matrix.d) * yValue;
        if (
            Math.abs(x - y) > 1e-8 * Math.max(1, x, y) ||
            Math.abs((matrix.a * matrix.c + matrix.b * matrix.d) * xValue * yValue) >
                1e-8 * Math.max(1, x * y)
        ) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG anisotropic filter blur requires native affine effect support.',
            );
        }
        if (x > maximum) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG filter kernel exceeds the native effect range.',
            );
        }
        return x;
    }
    public static offset(
        element: DesignSvgElement,
        matrix: DesignSvgMatrix,
        fallback: number = 0,
    ): DesignSvgPoint {
        const x: number = this.number(element.attributes['dx'] ?? String(fallback));
        const y: number = this.number(element.attributes['dy'] ?? String(fallback));
        const result: DesignSvgPoint = {
            x: matrix.a * x + matrix.c * y,
            y: matrix.b * x + matrix.d * y,
        };
        if (Math.max(Math.abs(result.x), Math.abs(result.y)) > 1000) {
            throw new DesignFailure(
                DesignFailureReason.Invalid,
                'SVG shadow offset exceeds the native effect range.',
            );
        }
        return result;
    }
    public static color(style: Readonly<Record<string, string>>): string {
        const color: string = DesignSvgColors.parse(
            style['flood-color'] ?? '#000000',
            style['color'],
        );
        const alpha: number = color.length === 9 ? parseInt(color.slice(7), 16) / 255 : 1;
        const opacity: number = DesignSvgImportAppearance.opacity(style['flood-opacity']);
        if (opacity === 1) {
            return color;
        }
        return (
            color.slice(0, 7) +
            Math.round(alpha * opacity * 255)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase()
        );
    }
    public static number(source: string): number {
        const values: readonly number[] = DesignSvgNumbers.list(source, 1);
        const value: number | undefined = values[0];
        if (value === undefined) {
            throw new DesignFailure(DesignFailureReason.Invalid, 'SVG filter value is missing.');
        }
        return value;
    }
}
