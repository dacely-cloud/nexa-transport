// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignShapedFace } from './DesignFontShaper.js';
import type { DesignResolvedTextDirection } from './DesignTextDirection.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import type { DesignFontGlyph, DesignGlyphBounds } from './DesignFontGlyphTypes.js';
import { DesignFontGraphemes, type DesignFontBoundary } from './DesignFontGraphemes.js';
import { DesignFontPlacement } from './DesignFontPlacement.js';

/** A prepared run belongs to one direction already resolved by the paragraph layout. */
export interface DesignFontRunStyle extends DesignTextSpanStyle {
    readonly direction: DesignResolvedTextDirection;
}

/** A logical source slice names a physical advance interval within the unchanged whole shaped run. */
export interface DesignFontSlice {
    readonly x: number;
    readonly width: number;
}
/** Only a source boundary inside a glyph cluster clips its ink; exterior overhang stays visible. */
export interface DesignFontPaintClip {
    readonly left: number | null;
    readonly right: number | null;
}
/** Paint geometry retains the original whole-run glyph identity without carrying its source text. */
export interface DesignFontPaintGlyph extends DesignFontGlyph {
    readonly clip?: DesignFontPaintClip;
}
/** A physical shaping cluster retains its original logical UTF-16 source interval. */
export interface DesignFontSourceCluster {
    readonly start: number;
    readonly end: number;
}
interface RunCluster {
    readonly start: number;
    readonly end: number;
    readonly x: number;
    width: number;
    bases: number;
    carets: readonly number[];
}

/** Prepared physical glyphs outlive paint changes while source boundaries retain their logical order. */
export class DesignFontRun {
    readonly #spans: readonly DesignShapedFace[];
    readonly #carets: ReadonlyMap<number, number>;
    readonly #offsets: readonly number[];
    /** Total typographic advance excludes the final inter-glyph tracking interval. */
    public readonly width: number;

    /** Engine-created runs retain only authorized physical faces; nothing here is a wire text projection. */
    public constructor(
        public readonly style: DesignFontRunStyle,
        public readonly content: string,
        public readonly tracking: number,
        spans: readonly DesignShapedFace[],
    ) {
        this.#spans = spans;
        let count: number = 0;
        this.#offsets = spans.map((span: DesignShapedFace): number => {
            const start: number = count;
            count += span.glyphs.length;
            return start;
        });
        const clusters: Map<number, RunCluster> = new Map();
        let pen: number = 0;
        let lastTracked: RunCluster | null = null;
        for (const span of spans) {
            const scale: number = style.size / span.face.unitsPerEm;
            for (const glyph of span.glyphs) {
                const start: number = span.start + glyph.start;
                const end: number = span.start + glyph.end;
                let cluster: RunCluster | undefined = clusters.get(start);
                if (cluster === undefined) {
                    cluster = { start, end, x: pen, width: 0, bases: 0, carets: [] };
                    clusters.set(start, cluster);
                }
                const advance: number = glyph.position.xAdvance * scale;
                const tracked: boolean =
                    tracking !== 0 &&
                    !glyph.mark &&
                    (advance !== 0 || glyph.glyph.path.commands.length > 0);
                if (!glyph.mark && advance !== 0) {
                    cluster.bases++;
                    cluster.carets =
                        cluster.bases === 1
                            ? (glyph.carets?.map(
                                  (caret: number): number =>
                                      pen - cluster.x + (glyph.position.xOffset + caret) * scale,
                              ) ?? [])
                            : [];
                }
                const width: number = advance + (tracked ? tracking : 0);
                cluster.width += width;
                pen += width;
                if (tracked) {
                    lastTracked = cluster;
                }
            }
        }
        if (lastTracked !== null) {
            lastTracked.width -= tracking;
            pen -= tracking;
        }
        this.width = Math.max(0, pen);
        const boundaries: readonly DesignFontBoundary[] = DesignFontGraphemes.boundaries(content);
        const carets: Map<number, number> = new Map();
        const rtl: boolean = style.direction === 'rtl';
        for (const cluster of clusters.values()) {
            const first: number = DesignFontRun.#boundary(boundaries, cluster.start);
            const last: number = DesignFontRun.#boundary(boundaries, cluster.end);
            const beginning: number = boundaries[first]?.advance ?? 0;
            const length: number = (boundaries[last]?.advance ?? beginning) - beginning;
            for (let index: number = first; index <= last && length > 0; index++) {
                const boundary: DesignFontBoundary | undefined = boundaries[index];
                if (boundary === undefined) {
                    throw new Error('Missing source boundary in shaped run.');
                }
                const logical: number = boundary.advance - beginning;
                const physical: number = rtl ? length - logical : logical;
                const explicit: number | undefined =
                    cluster.bases === 1 && cluster.carets.length === length - 1
                        ? cluster.carets[physical - 1]
                        : undefined;
                const distance: number =
                    physical === 0
                        ? 0
                        : physical === length
                          ? cluster.width
                          : (explicit ?? (physical / length) * cluster.width);
                carets.set(boundary.offset, cluster.x + distance);
            }
        }
        let previous: number = rtl ? this.width : 0;
        for (const boundary of boundaries) {
            const value: number = carets.get(boundary.offset) ?? previous;
            carets.set(boundary.offset, value);
            previous = value;
        }
        this.#carets = carets;
    }

    /** Prepared runs contain native source bodies; only explicit bounded geometry belongs on the wire. */
    public toJSON(): never {
        throw new Error(
            'Prepared text runs stay local. Serialize bounded glyph or paint geometry.',
        );
    }

    /** Grapheme boundaries never split a surrogate pair, mark sequence or joined emoji. */
    public caret(offset: number): number {
        const value: number | undefined = Number.isInteger(offset)
            ? this.#carets.get(offset)
            : undefined;
        if (value === undefined) {
            throw new Error('Text paint boundary must be an in-range Unicode grapheme boundary.');
        }
        return value;
    }

    /** Raw rich ranges can be inspected without guessing a caret inside a Unicode grapheme. */
    public boundary(offset: number): boolean {
        return Number.isInteger(offset) && this.#carets.has(offset);
    }

    /** Exporters can separate crossing paint clusters without reinterpreting or duplicating the source. */
    public *clusters(): IterableIterator<DesignFontSourceCluster> {
        const seen: Set<number> = new Set();
        for (const span of this.#spans) {
            for (const glyph of span.glyphs) {
                const start: number = span.start + glyph.start;
                if (!seen.has(start)) {
                    seen.add(start);
                    yield { start, end: span.start + glyph.end };
                }
            }
        }
    }

    /** Caret intervals use matching font data or equal advance fractions; glyph ink may overhang them. */
    public slice(start: number, end: number): DesignFontSlice {
        if (start > end) {
            throw new Error('Text paint range is reversed.');
        }
        const left: number = this.caret(start);
        const right: number = this.caret(end);
        return { x: Math.min(left, right), width: Math.abs(right - left) };
    }

    /** Every paint pass consumes these same glyph IDs, positions and fallback identities without reshaping. */
    public *glyphs(
        x: number,
        baseline: number,
        window: DesignGlyphBounds | null = null,
    ): IterableIterator<DesignFontGlyph> {
        yield* DesignFontPlacement.glyphs(
            this.#spans,
            this.style,
            x,
            baseline,
            this.tracking,
            window,
        );
    }

    /** Complete source clusters keep their overhang; shared ligature clusters use exact prepared carets. */
    public *paint(
        start: number,
        end: number,
        x: number,
        baseline: number,
        window: DesignGlyphBounds | null = null,
    ): IterableIterator<DesignFontPaintGlyph> {
        const selected: DesignFontSlice = this.slice(start, end);
        if (start === end) {
            return;
        }
        for (const glyph of this.glyphs(x, baseline, window)) {
            let low: number = 0;
            let high: number = this.#spans.length;
            while (low + 1 < high) {
                const middle: number = Math.floor((low + high) / 2);
                if ((this.#offsets[middle] ?? Infinity) <= glyph.index) {
                    low = middle;
                } else {
                    high = middle;
                }
            }
            const span: DesignShapedFace | undefined = this.#spans[low];
            const source: DesignShapedFace['glyphs'][number] | undefined =
                span?.glyphs[glyph.index - (this.#offsets[low] ?? 0)];
            if (span === undefined || source === undefined) {
                throw new Error('Missing prepared glyph source range.');
            }
            const first: number = span.start + source.start;
            const last: number = span.start + source.end;
            if (last <= start || first >= end) {
                continue;
            }
            if (start <= first && end >= last) {
                yield glyph;
                continue;
            }
            if (selected.width === 0) {
                continue;
            }
            const selectedLeft: number = Math.min(this.caret(start), this.caret(end));
            const selectedRight: number = Math.max(this.caret(start), this.caret(end));
            const clusterLeft: number = Math.min(this.caret(first), this.caret(last));
            const clusterRight: number = Math.max(this.caret(first), this.caret(last));
            const left: number | null = selectedLeft > clusterLeft ? x + selectedLeft : null;
            const right: number | null = selectedRight < clusterRight ? x + selectedRight : null;
            yield left === null && right === null ? glyph : { ...glyph, clip: { left, right } };
        }
    }

    static #boundary(boundaries: readonly DesignFontBoundary[], offset: number): number {
        let low: number = 0;
        let high: number = boundaries.length;
        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);
            if ((boundaries[middle]?.offset ?? Infinity) < offset) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return low;
    }
}
