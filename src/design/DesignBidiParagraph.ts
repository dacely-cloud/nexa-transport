// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { analyze, type AnalyzeResult } from 'bidi-shaper';
import { DesignTextDirection, type DesignResolvedTextDirection } from './DesignTextDirection.js';
import { DesignUnicodeScripts } from './DesignUnicodeScripts.js';

interface Level {
    readonly level: number;
}
interface Point extends Level {
    readonly start: number;
    readonly end: number;
    readonly removed: boolean;
    readonly reset: boolean;
}
/** Logical source ranges are returned in visual run order; their characters are never reversed before shaping. */
export interface DesignBidiRun extends Level {
    readonly start: number;
    readonly end: number;
    readonly direction: DesignResolvedTextDirection;
}

/** Unicode paragraph levels are resolved once, then L1/L2 are applied independently to each wrapped line. */
export class DesignBidiParagraph {
    public readonly direction: DesignResolvedTextDirection;
    readonly #points: readonly Point[];

    /** X9 formatting does not split visible runs; joining controls remain in their shaping context. */
    public constructor(
        public readonly content: string,
        direction: DesignTextDirection = DesignTextDirection.Auto,
    ) {
        if (content.length > 100000) {
            throw new Error('Text exceeds the bidirectional layout budget.');
        }
        const analysis: AnalyzeResult = analyze(content, {
            direction,
            shape: false,
            mirror: false,
            paragraphs: 'single',
        });
        this.direction = analysis.direction;
        const points: Point[] = [];
        let offset: number = 0;
        let index: number = 0;
        for (const character of content) {
            const level: number | undefined = analysis.levels[index];
            const visual: number | undefined = analysis.logicalToVisual[index];
            if (level === undefined || visual === undefined) {
                throw new Error('Missing Unicode paragraph level.');
            }
            const removed: boolean =
                visual < 0 || DesignUnicodeScripts.removed(character.codePointAt(0) ?? -1);
            points.push({
                start: offset,
                end: offset + character.length,
                level,
                removed,
                reset:
                    removed ||
                    character.charCodeAt(0) === 0x0c ||
                    /[\u0020\u1680\u2000-\u200A\u2028\u205F\u2066-\u2069\u3000]/u.test(character),
            });
            offset += character.length;
            index++;
        }
        let adjacent: number = this.direction === DesignTextDirection.Rtl ? 1 : 0;
        for (let index: number = points.length - 1; index >= 0; index--) {
            const point: Point | undefined = points[index];
            if (point === undefined) {
                throw new Error('Missing Unicode source point.');
            }
            if (point.removed) {
                points[index] = { ...point, level: adjacent };
            } else {
                adjacent = point.level;
            }
        }
        this.#points = points;
    }

    /** Test and selection consumers receive UTF-16 source offsets, excluding X9 formatting removals. */
    public visualIndices(start: number = 0, end: number = this.content.length): readonly number[] {
        return DesignBidiParagraph.#reorder(
            this.#line(start, end).filter((point: Point): boolean => !point.removed),
        ).map((point: Point): number => point.start);
    }

    /** Runs retain source slices for rich styling and pass a concrete direction to the font shaper. */
    public runs(start: number, end: number): readonly DesignBidiRun[] {
        const runs: DesignBidiRun[] = [];
        for (const point of this.#line(start, end)) {
            const previous: DesignBidiRun | undefined = runs.at(-1);
            const level: number = point.removed ? (previous?.level ?? point.level) : point.level;
            if (previous !== undefined && previous.level === level) {
                runs[runs.length - 1] = { ...previous, end: point.end };
            } else {
                runs.push({
                    start: point.start,
                    end: point.end,
                    level,
                    direction: level % 2 === 1 ? DesignTextDirection.Rtl : DesignTextDirection.Ltr,
                });
            }
        }
        return DesignBidiParagraph.#reorder(runs);
    }

    /** Resolved source levels are detached; X9 positions are not meaningful for conformance comparisons. */
    public get levels(): readonly number[] {
        return this.#points.map((point: Point): number => point.level);
    }

    #line(start: number, end: number): readonly Point[] {
        if (
            !Number.isInteger(start) ||
            !Number.isInteger(end) ||
            start < 0 ||
            end < start ||
            end > this.content.length
        ) {
            throw new Error('Invalid bidirectional source range.');
        }
        let low: number = 0;
        let high: number = this.#points.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            const point: Point | undefined = this.#points[middle];
            if (point === undefined) {
                throw new Error('Missing indexed source point.');
            }
            if (point.start < start) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        const result: Point[] = [];
        if ((low > 0 && this.#points[low - 1]?.end !== start) || (low === 0 && start !== 0)) {
            throw new Error('A source range cannot split a Unicode character.');
        }
        for (let index: number = low; index < this.#points.length; index++) {
            const point: Point | undefined = this.#points[index];
            if (point === undefined || point.start >= end) {
                break;
            }
            if (point.end > end) {
                throw new Error('A source range cannot split a Unicode character.');
            }
            result.push(point);
        }
        const base: number = this.direction === DesignTextDirection.Rtl ? 1 : 0;
        for (let index: number = result.length - 1; index >= 0; index--) {
            const point: Point | undefined = result[index];
            if (point === undefined || !point.reset) {
                break;
            }
            result[index] = { ...point, level: base };
        }
        return result;
    }

    static #reorder<T extends Level>(source: readonly T[]): readonly T[] {
        const result: T[] = [...source];
        let maximum: number = 0;
        let minimumOdd: number = Infinity;
        for (const entry of result) {
            maximum = Math.max(maximum, entry.level);
            if (entry.level % 2 === 1) {
                minimumOdd = Math.min(minimumOdd, entry.level);
            }
        }
        for (let level: number = maximum; level >= minimumOdd; level--) {
            let start: number = 0;
            while (start < result.length) {
                if ((result[start]?.level ?? -1) < level) {
                    start++;
                    continue;
                }
                let stop: number = start + 1;
                while ((result[stop]?.level ?? -1) >= level) {
                    stop++;
                }
                for (
                    let left: number = start, right: number = stop - 1;
                    left < right;
                    left++, right--
                ) {
                    const a: T | undefined = result[left];
                    const b: T | undefined = result[right];
                    if (a === undefined || b === undefined) {
                        throw new Error('Missing Unicode reorder item.');
                    }
                    result[left] = b;
                    result[right] = a;
                }
                start = stop;
            }
        }
        return result;
    }
}
