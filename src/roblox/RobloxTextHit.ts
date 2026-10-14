// SPDX-License-Identifier: Apache-2.0

import { RobloxTextLineLayout, type RobloxMeasuredTextLine } from './RobloxTextLines';
import type { RobloxTextMetrics } from './RobloxTextMetrics';
import { RobloxTextAlignment, type RobloxTextLayoutInput } from './RobloxTextAlignment';

/** A pointer is expressed in the same control-local pixels as measured editing paint. */
export interface RobloxTextHitInput extends RobloxTextLayoutInput {
    readonly x: number;
    readonly y: number;
}

/** Returns one-based UTF-8 cursor positions without DOM text measurement or substring rescans. */
export class RobloxTextHit {
    public static position(metrics: RobloxTextMetrics, input: RobloxTextHitInput): number {
        if (!Number.isFinite(input.x) || !Number.isFinite(input.y)) {
            throw new Error('Invalid text hit layout');
        }
        RobloxTextAlignment.validate(input);
        const lines: readonly RobloxMeasuredTextLine[] = RobloxTextLineLayout.layout(
            metrics,
            input.text,
            input.size,
            input.wrapped ? input.rect[2] : null,
        );
        const height: number = RobloxTextAlignment.height(metrics, input.size);
        const top: number = RobloxTextAlignment.top(input, height, lines.length);
        const index: number =
            height === 0
                ? 0
                : Math.min(lines.length - 1, Math.max(0, Math.floor((input.y - top) / height)));
        const line: RobloxMeasuredTextLine | undefined = lines[index];
        if (line === undefined) {
            throw new Error('Missing text hit line');
        }
        const left: number = RobloxTextAlignment.left(input, line.width);
        let nearest: number = line.startByte;
        let distance: number = Infinity;
        for (const boundary of line.boundaries) {
            const candidate: number = Math.abs(input.x - left - boundary.x);
            if (candidate <= distance) {
                nearest = boundary.byte;
                distance = candidate;
            }
        }
        return nearest + 1;
    }
}
