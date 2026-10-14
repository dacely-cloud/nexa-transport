// SPDX-License-Identifier: Apache-2.0

import {
    RobloxTextLineLayout,
    type RobloxMeasuredTextLine,
    type RobloxTextBoundary,
} from './RobloxTextLines';
import type { RobloxTextMetrics } from './RobloxTextMetrics';
import { RobloxTextAlignment, type RobloxTextLayoutInput } from './RobloxTextAlignment';

/** Text editing offsets remain one-based UTF-8 bytes; geometry stays in control-local pixels. */
export interface RobloxTextSelectionInput extends RobloxTextLayoutInput {
    readonly cursor: number;
    readonly selectionStart: number;
}
export interface RobloxTextInsertionPoint {
    readonly x: number;
    readonly y: number;
    readonly height: number;
}
export interface RobloxTextSelectionRect extends RobloxTextInsertionPoint {
    readonly width: number;
}
export interface RobloxTextSelectionGeometry {
    readonly insertion: RobloxTextInsertionPoint | null;
    readonly selection: readonly RobloxTextSelectionRect[];
}

/** Measured glyph advances, paragraph spacing and text alignment define editing geometry. */
export class RobloxTextSelection {
    public static resolve(
        metrics: RobloxTextMetrics,
        input: RobloxTextSelectionInput,
    ): RobloxTextSelectionGeometry {
        if (input.cursor === -1) {
            return { insertion: null, selection: [] };
        }
        RobloxTextAlignment.validate(input);
        const bytes: number = new TextEncoder().encode(input.text).length;
        for (const position of [input.cursor, input.selectionStart]) {
            if (position === -1) {
                continue;
            }
            if (!Number.isSafeInteger(position) || position < 1 || position > bytes + 1) {
                throw new Error('Invalid text selection byte position');
            }
        }
        const lines: readonly RobloxMeasuredTextLine[] = RobloxTextLineLayout.layout(
            metrics,
            input.text,
            input.size,
            input.wrapped ? input.rect[2] : null,
        );
        const height: number = RobloxTextAlignment.height(metrics, input.size);
        const top: number = RobloxTextAlignment.top(input, height, lines.length);
        const cursor: number = input.cursor - 1;
        const anchor: number = input.selectionStart === -1 ? cursor : input.selectionStart - 1;
        const valid: Set<number> = new Set<number>(
            lines.flatMap((line: RobloxMeasuredTextLine): readonly number[] =>
                line.boundaries.map((boundary: RobloxTextBoundary): number => boundary.byte),
            ),
        );
        for (let index: number = 0; index < lines.length - 1; index++) {
            const current: RobloxMeasuredTextLine | undefined = lines[index];
            const next: RobloxMeasuredTextLine | undefined = lines[index + 1];
            if (current === undefined || next === undefined) {
                throw new Error('Missing text selection line');
            }
            for (let byte: number = current.endByte; byte < next.startByte; byte++) {
                valid.add(byte);
            }
        }
        if (!valid.has(cursor) || !valid.has(anchor)) {
            throw new Error('Text selection splits a UTF-8 character');
        }
        let insertion: RobloxTextInsertionPoint | null = null;
        const selection: RobloxTextSelectionRect[] = [];
        for (let index: number = 0; index < lines.length; index++) {
            const line: RobloxMeasuredTextLine | undefined = lines[index];
            if (line === undefined) {
                throw new Error('Missing text selection line');
            }
            const left: number = RobloxTextAlignment.left(input, line.width);
            const y: number = top + Math.fround(index * height);
            const next: RobloxMeasuredTextLine | undefined = lines[index + 1];
            if (
                (cursor >= line.startByte && cursor <= line.endByte) ||
                (cursor > line.endByte && next !== undefined && cursor < next.startByte)
            ) {
                const boundary: RobloxTextBoundary | undefined = line.boundaries.find(
                    (point: RobloxTextBoundary): boolean =>
                        point.byte === Math.min(cursor, line.endByte),
                );
                if (boundary !== undefined) {
                    insertion = { x: left + boundary.x, y, height };
                }
            }
            const start: number = Math.max(Math.min(cursor, anchor), line.startByte);
            const end: number = Math.min(Math.max(cursor, anchor), line.endByte);
            if (end > start) {
                const a: RobloxTextBoundary | undefined = line.boundaries.find(
                    (point: RobloxTextBoundary): boolean => point.byte === start,
                );
                const b: RobloxTextBoundary | undefined = line.boundaries.find(
                    (point: RobloxTextBoundary): boolean => point.byte === end,
                );
                if (a === undefined || b === undefined) {
                    throw new Error('Missing text selection boundary');
                }
                selection.push({ x: left + a.x, y, height, width: Math.max(0, b.x - a.x) });
            }
        }
        return { insertion, selection };
    }
}
