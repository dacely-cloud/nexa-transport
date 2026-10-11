// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignKind, type DesignText, type DesignNode } from '../src/design/DesignTypes.js';
import {
    DesignTextLayout,
    type DesignTextLine,
    type DesignTextSpanStyle,
} from '../src/design/DesignTextLayout.js';
import { DesignShapedTextMetrics } from '../src/design/DesignShapedTextMetrics.js';

/** Keeps the test text separate from layout placement. */
function text(content: string): DesignText {
    const node: DesignNode = DesignDefaults.node('text', DesignKind.Text);
    if (node.text === null) {
        throw new Error('Missing text defaults.');
    }
    return { ...node.text, content, size: 10, runs: [] };
}
/** A known kerned pair is narrower than its separately measured characters. */
function kerned(_style: DesignTextSpanStyle, content: string): number {
    return content.length * 7 - (content.match(/AV/gu)?.length ?? 0) * 5;
}

test('word wrapping uses the shaped AV pair and rich spans rather than isolated character sums', (): void => {
    const value: DesignText = text('AV AV');
    const lines: readonly DesignTextLine[] = DesignTextLayout.lines(
        value,
        '#000000',
        9,
        100,
        kerned,
    );
    expect(
        lines.map((line: DesignTextLine): string =>
            line.segments.map((span): string => span.text).join(''),
        ),
    ).toEqual(['AV', 'AV']);
    expect(lines.every((line: DesignTextLine): boolean => line.width === 9)).toBe(true);
    expect(new DesignShapedTextMetrics(kerned).measure(text('AV'), 9)).toEqual({
        width: 9,
        height: 14,
    });
});

test('oversized words keep combining accents, joined emoji and flags intact across wraps', (): void => {
    const clusters: readonly string[] = ['e\u0301', '👩‍💻', '🇫🇷'];
    const segmenter: Intl.Segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const measure: (style: DesignTextSpanStyle, content: string) => number = (
        _style: DesignTextSpanStyle,
        content: string,
    ): number => Array.from(segmenter.segment(content)).length * 10;
    for (const cluster of clusters) {
        const lines: readonly DesignTextLine[] = DesignTextLayout.lines(
            text(cluster.repeat(5)),
            '#000000',
            15,
            200,
            measure,
        );
        expect(lines).toHaveLength(5);
        expect(
            lines.map((line: DesignTextLine): string =>
                line.segments.map((span): string => span.text).join(''),
            ),
        ).toEqual(Array<string>(5).fill(cluster));
    }
});

test('rich line heights, tracking and CRLF blank lines match the rendered line model', (): void => {
    const value: DesignText = {
        ...text('AV\r\n\r\nB'),
        letterSpacing: 2,
        runs: [
            {
                start: 0,
                end: 2,
                family: 'Inter',
                size: 30,
                weight: 700,
                italic: true,
                underline: false,
                color: '#FF0000',
            },
        ],
    };
    const size: DesignShapedTextMetrics = new DesignShapedTextMetrics(kerned);
    expect(size.measure(value, 200)).toEqual({ width: 11, height: 70 });
    const lines: readonly DesignTextLine[] = DesignTextLayout.lines(
        value,
        '#000000',
        200,
        100,
        kerned,
    );
    expect(lines.map((line: DesignTextLine): number => line.height)).toEqual([42, 14, 14]);
    expect(lines[0]?.segments[0]?.style.italic).toBe(true);
    expect(lines[0]?.segments[0]?.style.color).toBe('#FF0000');
});

test('large unwrapped text shapes complete spans a bounded number of times and clips visible wrapping', (): void => {
    let calls: number = 0;
    const metrics: DesignShapedTextMetrics = new DesignShapedTextMetrics(
        (_style: DesignTextSpanStyle, content: string): number => {
            calls++;
            return content.length * 5;
        },
    );
    expect(metrics.measure(text('large '.repeat(16000)), 1000000)).toEqual({
        width: 480000,
        height: 14,
    });
    expect(calls).toBe(1);
    const clipped: readonly DesignTextLine[] = DesignTextLayout.lines(
        text('large '.repeat(16000)),
        '#000000',
        25,
        20,
        kerned,
    );
    expect(clipped).toHaveLength(2);
});
