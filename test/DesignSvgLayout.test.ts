// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignSvg } from '../src/design/DesignSvg.js';
import { DesignSvgGeometry } from '../src/design/DesignSvgGeometry.js';
import {
    DesignFlow,
    DesignSizing,
    DesignPaintKind,
    DesignKind,
    DesignPathVerb as Verb,
    type DesignDocument,
    type DesignNode,
} from '../src/design/DesignTypes.js';
import type { DesignLayoutResult } from '../src/design/DesignLayoutTypes.js';
import type { DesignSvgSelection } from '../src/design/DesignSvgTypes.js';

function layout(): DesignLayoutResult {
    const base: DesignDocument = DesignDefaults.document('layout');
    const frame: DesignNode = {
        ...DesignDefaults.node('frame', DesignKind.Frame),
        width: 400,
        height: 240,
        children: ['path'],
        layout: {
            ...DesignDefaults.node('frame', DesignKind.Frame).layout,
            flow: DesignFlow.Row,
            clip: false,
            padding: { top: 20, right: 20, bottom: 20, left: 20 },
        },
    };
    const source: DesignNode = DesignDefaults.node('path', DesignKind.Path);
    const path: DesignNode = {
        ...source,
        parentId: frame.id,
        width: 80,
        height: 60,
        placement: { ...source.placement, width: DesignSizing.Fill, height: DesignSizing.Fill },
        path: [
            { verb: Verb.Move, values: [0, 0] },
            { verb: Verb.Line, values: [80, 0] },
            { verb: Verb.Quadratic, values: [80, 30, 80, 60] },
            { verb: Verb.Cubic, values: [60, 60, 20, 60, 0, 60] },
            { verb: Verb.Close, values: [] },
        ],
        style: {
            ...source.style,
            fills: [
                {
                    ...DesignDefaults.paint(),
                    kind: DesignPaintKind.Linear,
                    angle: 0,
                    stops: [
                        { offset: 0, color: '#FF0000' },
                        { offset: 1, color: '#0000FF' },
                    ],
                },
            ],
            stroke: { paint: DesignDefaults.paint('#000000'), width: 8, dash: [12, 8] },
        },
    };
    const document: DesignDocument = {
        ...base,
        nodes: [frame, path],
        pages: base.pages.map((page): typeof page => ({ ...page, roots: [frame.id] })),
    };
    return new DesignLayoutEngine(document, 'page-1').solve();
}

it('resolves vector control points before painting, retaining authored stroke widths and dash lengths', (): void => {
    const scene: DesignLayoutResult = layout();
    expect(scene.boxes.find((box): boolean => box.id === 'path')).toMatchObject({
        x: 20,
        y: 20,
        width: 360,
        height: 200,
    });
    const selected: DesignSvgSelection = DesignSvgGeometry.select(scene, ['path']);
    expect(selected).toMatchObject({ x: 16, y: 16, width: 368, height: 208 });
    const svg: string = DesignSvg.render(selected).svg;
    expect(svg).toContain('d="M0 0 L360 0 Q360 100 360 200 C270 200 90 200 0 200 Z"');
    expect(svg).not.toContain('transform="scale(');
    expect(svg).toContain('x1="0" y1="100" x2="360" y2="100"');
    expect(svg).toContain('stroke-width="8"');
    expect(svg).toContain('stroke-dasharray="12 8"');
    expect(scene.nodes.find((node): boolean => node.id === 'path')?.path[1]?.values).toEqual([
        80, 0,
    ]);
});

it('SVG geometry remains identical to the native renderer', async (): Promise<void> => {
    const [native, sdk]: string[] = await Promise.all([
        readFile(new URL('../../nexa/src/design/DesignSvgGeometry.ts', import.meta.url), 'utf8'),
        readFile(new URL('../src/design/DesignSvgGeometry.ts', import.meta.url), 'utf8'),
    ]);
    expect(sdk).toBe(native);
});
