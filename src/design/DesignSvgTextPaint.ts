// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignFontRun, DesignFontSourceCluster } from './DesignFontRun.js';
import type { DesignTextSegment, DesignTextSpanStyle } from './DesignTextLayout.js';
import type { DesignBox } from './DesignTypes.js';
import type { DesignSvgPaints } from './DesignSvgPaints.js';

/** A logical editable text slice can use an exact paint server without positioning or replacing its characters. */
export interface DesignSvgTextSlice {
    readonly text: string;
    readonly style: DesignTextSpanStyle;
    readonly fill: string | null;
}

/** Browser tspan color division need not honor GDEF carets; a shared glyph cluster gets exact object-space paint. */
export class DesignSvgTextPaint {
    /** Existing fill definitions retain the original gradient/image coordinate system and opacity. */
    public constructor(
        public readonly paints: DesignSvgPaints,
        public readonly box: DesignBox,
        public readonly base: string,
    ) {}

    /** Only clusters crossing an authored paint boundary use patterns; ordinary glyph overhang keeps its own color. */
    public slices(
        spans: readonly DesignTextSegment[],
        run: DesignFontRun,
    ): readonly DesignSvgTextSlice[] {
        const result: DesignSvgTextSlice[] = [];
        const clusters: readonly DesignFontSourceCluster[] = Array.from(run.clusters()).sort(
            (a: DesignFontSourceCluster, b: DesignFontSourceCluster): number => a.start - b.start,
        );
        let position: number = 0;
        let index: number = 0;
        for (const cluster of clusters) {
            while (index < spans.length && (spans[index]?.prepared?.end ?? 0) <= cluster.start) {
                index++;
            }
            const first: DesignTextSegment | undefined = spans[index];
            if (first?.prepared === undefined || first.prepared.end >= cluster.end) {
                continue;
            }
            this.#append(result, spans, position, cluster.start);
            const selected: DesignTextSegment[] = [];
            for (let next: number = index; next < spans.length; next++) {
                const span: DesignTextSegment | undefined = spans[next];
                if (span?.prepared === undefined || span.prepared.start >= cluster.end) {
                    break;
                }
                selected.push(span);
            }
            result.push({
                text: run.content.slice(cluster.start, cluster.end),
                style: first.style,
                fill: this.#pattern(selected, run, cluster),
            });
            position = cluster.end;
        }
        this.#append(result, spans, position, run.content.length);
        return result;
    }

    #append(
        result: DesignSvgTextSlice[],
        spans: readonly DesignTextSegment[],
        start: number,
        end: number,
    ): void {
        for (const span of spans) {
            const prepared: DesignTextSegment['prepared'] = span.prepared;
            if (prepared === undefined || prepared.end <= start || prepared.start >= end) {
                continue;
            }
            result.push({
                text: prepared.run.content.slice(
                    Math.max(start, prepared.start),
                    Math.min(end, prepared.end),
                ),
                style: span.style,
                fill: null,
            });
        }
    }

    #pattern(
        spans: readonly DesignTextSegment[],
        run: DesignFontRun,
        cluster: DesignFontSourceCluster,
    ): string {
        const id: string = this.paints.identity('text-cluster-paint');
        const first: number = run.caret(cluster.start);
        const last: number = run.caret(cluster.end);
        const origin: number = spans[0]?.prepared?.x ?? 0;
        const rectangles: string[] = [];
        for (const span of spans) {
            const prepared: DesignTextSegment['prepared'] = span.prepared;
            if (prepared === undefined) {
                throw new Error('Missing prepared SVG paint.');
            }
            const a: number = run.caret(Math.max(cluster.start, prepared.start));
            const b: number = run.caret(Math.min(cluster.end, prepared.end));
            if (a === b) {
                continue;
            }
            const left: number =
                Math.min(a, b) <= Math.min(first, last) ? 0 : origin + Math.min(a, b);
            const right: number =
                Math.max(a, b) >= Math.max(first, last) ? this.box.width : origin + Math.max(a, b);
            rectangles.push(
                `<rect x="${left}" width="${Math.max(0, right - left)}" height="${this.box.height}" fill="${span.style.rich ? span.style.color : this.base}"/>`,
            );
        }
        this.paints.definitions.push(
            `<pattern id="${id}" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" width="${this.box.width}" height="${this.box.height}">${rectangles.join('')}</pattern>`,
        );
        return `url(#${id})`;
    }
}
