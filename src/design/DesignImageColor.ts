// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignImageAdjustmentCodec } from './DesignImageAdjustmentCodec.js';
import {
    DesignImageAdjustmentField,
    type DesignImageAdjustments,
    type DesignImageColorTransform,
} from './DesignImageAdjustmentTypes.js';

/** Portable color math is shared by hardware image paints, glyph paints and SVG exports. */
export class DesignImageColor {
    /** The same sample count defines SVG table interpolation and GPU uniforms. */
    public static readonly toneSegments: number = 32;
    static readonly #cache: WeakMap<DesignImageAdjustments, DesignImageColorTransform> =
        new WeakMap();

    /** Neutral metadata leaves old paints on their original rendering path. */
    public static active(value: DesignImageAdjustments | null | undefined): boolean {
        return (
            value != null &&
            Object.values(DesignImageAdjustmentField).some(
                (field: DesignImageAdjustmentField): boolean => value[field] !== 0,
            )
        );
    }

    /** Exposure spans two stops each way; contrast/saturation range from zero to twice their neutral gain. */
    public static transform(
        value: DesignImageAdjustments | null | undefined,
    ): DesignImageColorTransform {
        const adjustments: DesignImageAdjustments = value ?? DesignImageAdjustmentCodec.neutral;
        const cached: DesignImageColorTransform | undefined = this.#cache.get(adjustments);
        if (cached !== undefined) {
            return cached;
        }
        const gain: number = Math.pow(2, adjustments.exposure * 2) * (1 + adjustments.contrast);
        const center: number = -adjustments.contrast / 2;
        const saturation: number = 1 + adjustments.saturation;
        const luma: readonly number[] = [0.2126, 0.7152, 0.0722];
        const offset: readonly number[] = [
            center + 0.12 * adjustments.temperature + 0.06 * adjustments.tint,
            center - 0.12 * adjustments.tint,
            center - 0.12 * adjustments.temperature + 0.06 * adjustments.tint,
        ];
        const matrix: number[] = [];
        for (let row: number = 0; row < 3; row += 1) {
            let shift: number = 0;
            for (let column: number = 0; column < 3; column += 1) {
                const coefficient: number =
                    (row === column ? saturation : 0) + (1 - saturation) * (luma[column] ?? 0);
                matrix.push(coefficient * gain);
                shift += coefficient * (offset[column] ?? 0);
            }
            matrix.push(0, shift);
        }
        matrix.push(0, 0, 0, 1, 0);
        const tones: number[] = Array.from(
            { length: this.toneSegments + 1 },
            (_value: unknown, index: number): number => {
                const channel: number = index / this.toneSegments;
                return Math.max(
                    0,
                    Math.min(
                        1,
                        channel +
                            0.4 * adjustments.shadows * (1 - channel) ** 2 +
                            0.4 * adjustments.highlights * channel ** 2,
                    ),
                );
            },
        );
        const result: DesignImageColorTransform = Object.freeze({
            matrix: Object.freeze(matrix),
            tones: Object.freeze(tones),
        });
        if (Object.isFrozen(adjustments)) {
            this.#cache.set(adjustments, result);
        }
        return result;
    }

    /** Self-contained numeric SVG primitives apply in sRGB and preserve the original alpha channel. */
    public static svg(transform: DesignImageColorTransform): string {
        const table: string = transform.tones.join(' ');
        return `<feColorMatrix type="matrix" values="${transform.matrix.join(' ')}"/><feComponentTransfer><feFuncR type="table" tableValues="${table}"/><feFuncG type="table" tableValues="${table}"/><feFuncB type="table" tableValues="${table}"/><feFuncA type="identity"/></feComponentTransfer>`;
    }
}
