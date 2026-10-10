// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import {
    DesignPaintKind,
    DesignAlign,
    type DesignPaint,
    type DesignStyle,
    type DesignGradientStop,
    type DesignShadow,
    type DesignText,
    type DesignTextRun,
} from './DesignTypes.js';

/** Paint and typography validation keeps executable CSS and markup out of the design model. */
export class DesignStyleCodec {
    /** Canonical paint. */
    public static paint(raw: unknown): DesignPaint {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'kind',
            'color',
            'opacity',
            'angle',
            'stops',
            'assetId',
            'tokenId',
        ]);
        const kind: DesignPaintKind = V.choice(value['kind'], Object.values(DesignPaintKind));
        const stops: readonly DesignGradientStop[] = V.list(
            value['stops'],
            64,
            (entry: unknown): DesignGradientStop => {
                const stop: Readonly<Record<string, unknown>> = V.record(entry, [
                    'offset',
                    'color',
                ]);
                return { offset: V.number(stop['offset'], 0, 1), color: V.color(stop['color']) };
            },
        );
        if (
            (kind === DesignPaintKind.Linear || kind === DesignPaintKind.Radial) &&
            (stops.length < 2 ||
                stops.some(
                    (stop: DesignGradientStop, index: number): boolean =>
                        index > 0 && stop.offset < (stops[index - 1]?.offset ?? 0),
                ))
        ) {
            throw new Error('Gradients require ordered color stops');
        }
        const assetId: string | null = V.optionalId(value['assetId']);
        if (kind === DesignPaintKind.Image && assetId === null) {
            throw new Error('Image paint requires a workspace asset');
        }
        return {
            kind,
            color: V.color(value['color']),
            opacity: V.number(value['opacity'], 0, 1),
            angle: V.number(value['angle'], -360, 360),
            stops,
            assetId,
            tokenId: V.optionalId(value['tokenId']),
        };
    }
    /** Canonical bounded style. */
    public static style(raw: unknown): DesignStyle {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'fills',
            'stroke',
            'corners',
            'shadows',
            'blur',
        ]);
        const corners: Readonly<Record<string, unknown>> = V.record(value['corners'], [
            'topLeft',
            'topRight',
            'bottomRight',
            'bottomLeft',
        ]);
        const stroke: Readonly<Record<string, unknown>> | null =
            value['stroke'] === null ? null : V.record(value['stroke'], ['paint', 'width', 'dash']);
        return {
            fills: V.list(value['fills'], 8, (entry: unknown): DesignPaint => this.paint(entry)),
            stroke:
                stroke === null
                    ? null
                    : {
                          paint: this.paint(stroke['paint']),
                          width: V.number(stroke['width'], 0, 1000),
                          dash: V.list(stroke['dash'], 16, (entry: unknown): number =>
                              V.number(entry, 0.01, 1000),
                          ),
                      },
            corners: {
                topLeft: V.number(corners['topLeft'], 0),
                topRight: V.number(corners['topRight'], 0),
                bottomRight: V.number(corners['bottomRight'], 0),
                bottomLeft: V.number(corners['bottomLeft'], 0),
            },
            shadows: V.list(value['shadows'], 8, (entry: unknown): DesignShadow => {
                const shadow: Readonly<Record<string, unknown>> = V.record(entry, [
                    'x',
                    'y',
                    'blur',
                    'spread',
                    'color',
                    'inner',
                ]);
                return {
                    x: V.number(shadow['x'], -1000, 1000),
                    y: V.number(shadow['y'], -1000, 1000),
                    blur: V.number(shadow['blur'], 0, 1000),
                    spread: V.number(shadow['spread'], -1000, 1000),
                    color: V.color(shadow['color']),
                    inner: V.boolean(shadow['inner']),
                };
            }),
            blur: V.number(value['blur'], 0, 1000),
        };
    }
    /** Font names are values rather than an arbitrary CSS font expression. */
    public static family(raw: unknown): string {
        const family: string = V.text(raw, 96);
        if (!/^[\p{L}\p{N} ._-]+$/u.test(family)) {
            throw new Error('Invalid design font family');
        }
        return family;
    }
    /** Rich text offsets must refer to non-overlapping, well-formed Unicode ranges. */
    public static text(raw: unknown): DesignText {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'content',
            'family',
            'size',
            'weight',
            'italic',
            'lineHeight',
            'letterSpacing',
            'align',
            'runs',
        ]);
        const content: string = V.text(value['content'], 100000, true);
        const runs: readonly DesignTextRun[] = V.list(
            value['runs'],
            1024,
            (entry: unknown): DesignTextRun => {
                const run: Readonly<Record<string, unknown>> = V.record(entry, [
                    'start',
                    'end',
                    'family',
                    'size',
                    'weight',
                    'italic',
                    'color',
                    'underline',
                ]);
                return {
                    start: V.number(run['start'], 0, content.length, true),
                    end: V.number(run['end'], 0, content.length, true),
                    family: this.family(run['family']),
                    size: V.number(run['size'], 1, 1000),
                    weight: V.number(run['weight'], 100, 900, true),
                    italic: V.boolean(run['italic']),
                    color: V.color(run['color']),
                    underline: V.boolean(run['underline']),
                };
            },
        );
        if (
            runs.some(
                (run: DesignTextRun, index: number): boolean =>
                    run.end <= run.start ||
                    run.start < (runs[index - 1]?.end ?? 0) ||
                    !content.slice(run.start, run.end).isWellFormed(),
            )
        ) {
            throw new Error('Invalid rich text ranges');
        }
        return {
            content,
            family: this.family(value['family']),
            size: V.number(value['size'], 1, 1000),
            weight: V.number(value['weight'], 100, 900, true),
            italic: V.boolean(value['italic']),
            lineHeight: V.number(value['lineHeight'], 0.5, 5),
            letterSpacing: V.number(value['letterSpacing'], -100, 500),
            align: V.choice(value['align'], Object.values(DesignAlign)),
            runs,
        };
    }
}
