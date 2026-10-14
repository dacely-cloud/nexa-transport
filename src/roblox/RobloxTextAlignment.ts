// SPDX-License-Identifier: Apache-2.0
import type { RobloxTextMetrics } from './RobloxTextMetrics';

/** Shared local text box used by cursor paint and pointer placement. */
export interface RobloxTextLayoutInput {
    readonly text: string;
    readonly size: number;
    readonly wrapped: boolean;
    readonly rect: readonly [number, number, number, number];
    readonly alignX: number;
    readonly alignY: number;
}

/** Alignment uses the renderer's float line height and each wrapped line's measured width. */
export class RobloxTextAlignment {
    public static validate(input: RobloxTextLayoutInput): void {
        if (
            !input.rect.every(
                (value: number): boolean => Number.isFinite(value) && Math.abs(value) <= 16384,
            ) ||
            input.rect[2] < 0 ||
            input.rect[3] < 0 ||
            !Number.isInteger(input.alignX) ||
            input.alignX < 0 ||
            input.alignX > 2 ||
            !Number.isInteger(input.alignY) ||
            input.alignY < 0 ||
            input.alignY > 2
        ) {
            throw new Error('Invalid text layout');
        }
    }
    public static height(metrics: RobloxTextMetrics, size: number): number {
        const scale: number = Math.fround(Math.fround(size) / metrics.unitsPerEm);
        return Math.fround(metrics.lineHeight * scale);
    }
    public static top(input: RobloxTextLayoutInput, height: number, lines: number): number {
        const total: number = Math.fround(height * lines);
        return (
            input.rect[1] +
            (input.alignY === 0
                ? 0
                : input.alignY === 2
                  ? input.rect[3] - total
                  : (input.rect[3] - total) / 2)
        );
    }
    public static left(input: RobloxTextLayoutInput, width: number): number {
        return (
            input.rect[0] +
            (input.alignX === 0
                ? 0
                : input.alignX === 1
                  ? input.rect[2] - width
                  : (input.rect[2] - width) / 2)
        );
    }
}
