// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignText, DesignTextRun } from './DesignTypes.js';
import type { DesignTextStyleChanges } from './DesignOperationTypes.js';
import { DesignTextStyleChangesCodec } from './DesignTextStyleChangesCodec.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignValues as V } from './DesignValues.js';

/** Range styles split only affected intervals, retain source text and coalesce equal adjacent styles. */
export class DesignTextStyles {
    /** Offsets are UTF-16 code units with an exclusive end and cannot split a surrogate pair. */
    public static apply(
        text: DesignText,
        start: number,
        end: number,
        changes: DesignTextStyleChanges,
        color: string | null = null,
    ): DesignText {
        V.number(start, 0, text.content.length, true);
        V.number(end, 0, text.content.length, true);
        if (
            start >= end ||
            !text.content.slice(0, start).isWellFormed() ||
            !text.content.slice(0, end).isWellFormed()
        ) {
            throw new Error('Choose a nonempty text range at Unicode-safe boundaries.');
        }
        const patch: DesignTextStyleChanges = DesignTextStyleChangesCodec.parse(changes);
        const boundaries: number[] = [
            ...new Set([
                0,
                text.content.length,
                start,
                end,
                ...text.runs.flatMap((run: DesignTextRun): readonly number[] => [
                    run.start,
                    run.end,
                ]),
            ]),
        ].sort((a: number, b: number): number => a - b);
        const result: DesignTextRun[] = [];
        let cursor: number = 0;
        let changed: boolean = false;
        for (let index: number = 0; index < boundaries.length - 1; index++) {
            const left: number | undefined = boundaries[index];
            const right: number | undefined = boundaries[index + 1];
            if (left === undefined || right === undefined || left === right) {
                continue;
            }
            while (cursor < text.runs.length && (text.runs[cursor]?.end ?? 0) <= left) {
                cursor++;
            }
            const candidate: DesignTextRun | undefined = text.runs[cursor];
            const saved: DesignTextRun | undefined =
                candidate !== undefined && candidate.start <= left && candidate.end >= right
                    ? candidate
                    : undefined;
            if (left < start || right > end) {
                if (saved !== undefined) {
                    this.#append(result, { ...saved, start: left, end: right });
                }
                continue;
            }
            const previous: DesignTextRun = saved ?? this.base(text, color, left, right);
            const faceChanged: boolean =
                (patch.family !== undefined && patch.family !== previous.family) ||
                (patch.italic !== undefined && patch.italic !== previous.italic);
            const next: DesignTextRun = {
                ...previous,
                ...patch,
                ...(faceChanged && patch.font === undefined ? { font: null } : {}),
                start: left,
                end: right,
            };
            if (!this.same(previous, next)) {
                changed = true;
            }
            this.#append(result, next);
        }
        if (!changed) {
            return text;
        }
        if (result.length > 1024) {
            throw new Error('This format exceeds the rich-text range limit.');
        }
        return DesignStyleCodec.text({ ...text, runs: result });
    }
    /** Base gaps inherit a compatible saved binding instead of introducing another font identity. */
    public static base(
        text: DesignText,
        color: string | null = null,
        start: number = 0,
        end: number = text.content.length,
    ): DesignTextRun {
        return {
            start,
            end,
            family: text.family,
            size: text.size,
            weight: text.weight,
            italic: text.italic,
            color: color === null ? null : V.color(color),
            underline: false,
        };
    }
    /** Selection controls can distinguish mixed values without pretending the first range covers the entire selection. */
    public static ranges(
        text: DesignText,
        start: number,
        end: number,
        color: string | null = null,
    ): readonly DesignTextRun[] {
        const result: DesignTextRun[] = [];
        let cursor: number = start;
        for (const run of text.runs) {
            if (run.end <= start || run.start >= end) {
                continue;
            }
            if (run.start > cursor) {
                result.push(this.base(text, color, cursor, Math.min(run.start, end)));
            }
            result.push({ ...run, start: Math.max(start, run.start), end: Math.min(end, run.end) });
            cursor = Math.min(end, run.end);
        }
        if (cursor < end) {
            result.push(this.base(text, color, cursor, end));
        }
        return result;
    }
    /** Font omission, an explicit unbound face and an exact private binding remain distinct. */
    public static same(left: DesignTextRun, right: DesignTextRun): boolean {
        return (
            left.family === right.family &&
            left.size === right.size &&
            left.weight === right.weight &&
            left.italic === right.italic &&
            left.color === right.color &&
            left.underline === right.underline &&
            left.font?.id === right.font?.id &&
            left.font?.sha256 === right.font?.sha256 &&
            (left.font === null) === (right.font === null)
        );
    }
    static #append(result: DesignTextRun[], run: DesignTextRun): void {
        const previous: DesignTextRun | undefined = result.at(-1);
        if (previous !== undefined && previous.end === run.start && this.same(previous, run)) {
            result[result.length - 1] = { ...previous, end: run.end };
        } else {
            result.push(run);
        }
    }
}
