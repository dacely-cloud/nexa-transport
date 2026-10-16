// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import {
    DesignSvgImportLayers,
    type DesignSvgLayerImport,
} from '../src/design/DesignSvgImportLayers.js';
import type { DesignNode } from '../src/design/DesignTypes.js';

async function labels(body: string): Promise<readonly DesignNode[]> {
    const result: DesignSvgLayerImport = await DesignSvgImportLayers.parse(
        '<svg width="400" height="240" font-family="Inter"><defs><linearGradient id="paint" x2="1" y2=".5"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient></defs>' +
            body +
            '</svg>',
        'Outlined type',
        (key: string): string => key.replaceAll(':', '-'),
    );
    return result.nodes.filter((node: DesignNode): boolean => node.kind === 'text');
}

test('stroke-only SVG lettering retains editable source and the complete native stroke', async (): Promise<void> => {
    const node: DesignNode | undefined = (
        await labels(
            '<text x="20" y="90" font-size="48" fill="none" stroke="red" stroke-width="2" stroke-opacity=".5" stroke-dasharray="3 5" stroke-linecap="square" stroke-linejoin="bevel" stroke-miterlimit="2">Outline</text>',
        )
    )[0];
    expect(node?.text?.content).toBe('Outline');
    expect(node?.path).toEqual([]);
    expect(node?.style.fills).toEqual([]);
    expect(node?.style.stroke).toMatchObject({
        width: 2,
        dash: [3, 5],
        cap: 'square',
        join: 'bevel',
        miterLimit: 2,
        paint: { kind: 'solid', color: '#FF0000', opacity: 0.5 },
    });
});

test('rich typography inherits its computed stroke dimensions rather than reevaluating em units', async (): Promise<void> => {
    const node: DesignNode | undefined = (
        await labels(
            '<g font-size="20" stroke="currentColor" color="navy" stroke-width=".1em" stroke-dasharray=".2em .3em"><text font-size="40">A <tspan font-size="60" font-weight="700">bold</tspan></text></g>',
        )
    )[0];
    expect(node?.style.stroke).toMatchObject({
        width: 2,
        dash: [4, 6],
        paint: { color: '#000080' },
    });
    expect(node?.text).toMatchObject({
        content: 'A bold',
        size: 40,
        runs: [{ start: 2, end: 6, size: 60, weight: 700 }],
    });
});

test('uniform and non-scaling outlined text retain their own dimensions through transforms', async (): Promise<void> => {
    const nodes: readonly DesignNode[] = await labels(
        '<text transform="scale(2)" stroke="red" stroke-width="2" stroke-dasharray="3 5">Scaled</text><text y="80" transform="scale(2)" stroke="red" stroke-width="2" stroke-dasharray="3 5" vector-effect="non-scaling-stroke">Fixed</text>',
    );
    expect(nodes[0]?.style.stroke).toMatchObject({ width: 4, dash: [6, 10] });
    expect(nodes[1]?.style.stroke).toMatchObject({ width: 2, dash: [3, 5] });
});

test('equivalent stroke declarations and uniformly stroked children share one editable text layer', async (): Promise<void> => {
    const nodes: readonly DesignNode[] = await labels(
        '<text font-size="20" stroke="red" stroke-width="2">A<tspan stroke="#FF0000" stroke-width=".1em" color="purple">B</tspan></text><text y="80"><tspan stroke="red">A</tspan><tspan stroke="#FF0000">B</tspan></text>',
    );
    expect(nodes[0]?.text?.content).toBe('AB');
    expect(nodes[0]?.style.stroke).toMatchObject({ width: 2, paint: { color: '#FF0000' } });
    expect(nodes[1]?.style.stroke).toMatchObject({ width: 1, paint: { color: '#FF0000' } });
});

test('stroke percentages use the normalized viewport diagonal and explicit zero strokes disappear', async (): Promise<void> => {
    const nodes: readonly DesignNode[] = await labels(
        '<text stroke="red" stroke-width="1%" stroke-dasharray="1%, 2%">Percent</text><text y="80" stroke="red" stroke-width="0">None</text>',
    );
    const unit: number = Math.hypot(400, 240) / Math.SQRT2 / 100;
    expect(nodes[0]?.style.stroke?.width).toBeCloseTo(unit, 10);
    expect(nodes[0]?.style.stroke?.dash[1]).toBeCloseTo(unit * 2, 10);
    expect(nodes[1]?.style.stroke).toBeNull();
});

test('positioned text chunks share stroke-gradient object bounds without flattening characters', async (): Promise<void> => {
    const nodes: readonly DesignNode[] = await labels(
        '<text fill="none" font-size="32" stroke="url(#paint)" stroke-width="2"><tspan x="20" y="70">AAAA</tspan><tspan x="200" y="150">AAAA</tspan></text>',
    );
    expect(nodes).toHaveLength(2);
    expect(nodes[0]?.style.stroke?.paint).toMatchObject({
        kind: 'linear',
        stops: [{ color: '#FF0000' }, { color: '#0000FF' }],
    });
    const first: DesignNode | undefined = nodes[0];
    const second: DesignNode | undefined = nodes[1];
    const a: NonNullable<DesignNode['style']['stroke']>['paint']['gradient'] =
        first?.style.stroke?.paint.gradient;
    const b: typeof a = second?.style.stroke?.paint.gradient;
    if (first === undefined || second === undefined || a == null || b == null) {
        throw new Error('Missing outlined chunks');
    }
    expect(first.x + a.startX * first.width).toBeCloseTo(second.x + b.startX * second.width, 8);
    expect(first.y + a.startY * first.height).toBeCloseTo(second.y + b.startY * second.height, 8);
    expect(first.x + a.endX * first.width).toBeCloseTo(second.x + b.endX * second.width, 8);
    expect(first.y + a.endY * first.height).toBeCloseTo(second.y + b.endY * second.height, 8);
    expect(nodes.map((node: DesignNode): string | undefined => node.text?.content)).toEqual([
        'AAAA',
        'AAAA',
    ]);
});

test('independent rich strokes and invalid dash dimensions reject instead of discarding appearance', async (): Promise<void> => {
    for (const body of [
        '<text stroke="red">A<tspan stroke="blue">B</tspan></text>',
        '<text stroke="red" stroke-width="-1">A</text>',
        '<text stroke="red" stroke-dasharray="0 2">A</text>',
        '<text stroke="url(https://external.invalid)" stroke-width="0">A</text>',
        '<text stroke="red" stroke-dasharray="1,,2">A</text>',
        '<text stroke="red" stroke-dasharray=".1em,, .2em">A</text>',
    ]) {
        await expect(labels(body)).rejects.toThrow();
    }
});
