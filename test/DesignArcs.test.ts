// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignArcs, type DesignArcSettings } from '../src/design/DesignArcs.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignNodeCodec } from '../src/design/DesignNodeCodec.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignPaths } from '../src/design/DesignPaths.js';
import { DesignBooleanGeometry } from '../src/design/DesignBooleanGeometry.js';
import { DesignComponentDetach } from '../src/design/DesignComponentDetach.js';
import { DesignSelectionContext } from '../src/design/DesignSelectionContext.js';
import type { DesignDocument, DesignNode, DesignPathCommand } from '../src/design/DesignTypes.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';

const settings: DesignArcSettings = { start: -90, sweep: 270, innerRadius: 0.6, closed: true };
function fixture(): DesignDocument {
    return DesignCodec.document({
        ...DesignDefaults.document('arcs'),
        nodes: [
            { ...DesignDefaults.node('ring', 'ellipse'), width: 200, height: 100, arc: settings },
        ],
        pages: [{ id: 'page-1', name: 'Arcs', roots: ['ring'], background: '#FFFFFF' }],
    });
}
function ring(document: DesignDocument): DesignNode {
    const result: DesignNode | undefined = document.nodes.find(
        (node: DesignNode): boolean => node.id === 'ring',
    );
    if (result === undefined) {
        throw new Error('Missing ring');
    }
    return result;
}

test('partial rings reverse the inner curve and keep both editable radial cuts', (): void => {
    const path: readonly DesignPathCommand[] = DesignArcs.path(settings, 200, 100);
    expect(path[0]?.verb).toBe('M');
    expect(path[0]?.values[0]).toBeCloseTo(100, 10);
    expect(path[0]?.values[1]).toBeCloseTo(0, 10);
    expect(path.filter((command: DesignPathCommand): boolean => command.verb === 'C')).toHaveLength(
        24,
    );
    expect(path.filter((command: DesignPathCommand): boolean => command.verb === 'L')).toHaveLength(
        1,
    );
    expect(path.at(-1)?.verb).toBe('Z');
    const inner: DesignPathCommand | undefined = path.find(
        (command: DesignPathCommand): boolean => command.verb === 'L',
    );
    expect(inner?.values[0]).toBeCloseTo(40, 10);
    expect(inner?.values[1]).toBeCloseTo(50, 10);
});

test.each([360, -360])(
    'a full %s-degree donut has independently closed opposite contours',
    (sweep: number): void => {
        const path: readonly DesignPathCommand[] = DesignArcs.path(
            { ...settings, sweep },
            200,
            100,
        );
        expect(
            path.filter((command: DesignPathCommand): boolean => command.verb === 'M'),
        ).toHaveLength(2);
        expect(
            path.filter((command: DesignPathCommand): boolean => command.verb === 'Z'),
        ).toHaveLength(2);
        expect(path.some((command: DesignPathCommand): boolean => command.verb === 'L')).toBe(
            false,
        );
        const cubics: readonly DesignPathCommand[] = path.filter(
            (command: DesignPathCommand): boolean => command.verb === 'C',
        );
        expect(cubics[0]?.values[4] ?? 0).toBeCloseTo(
            sweep > 0 ? 138.2683432365 : 61.7316567635,
            6,
        );
    },
);

test('zero sweep is an unpainted move rather than a fallback full ellipse, and open arcs retain no center edge', (): void => {
    expect(DesignArcs.path({ ...settings, sweep: 0 }, 200, 100)).toHaveLength(1);
    const open: readonly DesignPathCommand[] = DesignArcs.path(
        { start: 0, sweep: 90, innerRadius: 0, closed: false },
        200,
        100,
    );
    expect(open.map((command: DesignPathCommand): string => command.verb)).toEqual([
        'M',
        'C',
        'C',
        'C',
        'C',
    ]);
    const pie: readonly DesignPathCommand[] = DesignArcs.path(
        { start: 0, sweep: 90, innerRadius: 0, closed: true },
        200,
        100,
    );
    expect(pie.at(-2)).toEqual({ verb: 'L', values: [100, 50] });
    expect(pie.at(-1)?.verb).toBe('Z');
});

test('large non-cardinal arcs round-trip within native coordinate bounds and retain subpixel radial accuracy', (): void => {
    for (const sweep of [360, -360, 359.5, -0.001, 0.001]) {
        const node: DesignNode = DesignNodeCodec.node({
            ...DesignDefaults.node('large', 'ellipse'),
            width: 100000,
            height: 100000,
            arc: { ...settings, start: 17.432, sweep },
        });
        expect(DesignNodeCodec.node(node)).toEqual(node);
        expect(node.path.length).toBeLessThanOrEqual(40);
        let x: number = node.path[0]?.values[0] ?? 0;
        let y: number = node.path[0]?.values[1] ?? 0;
        for (const command of node.path) {
            if (command.verb === 'M' || command.verb === 'L') {
                x = command.values[0] ?? 0;
                y = command.values[1] ?? 0;
            } else if (command.verb === 'C') {
                const radius: number = Math.hypot(x - 50000, y - 50000);
                for (const t of [0.2, 0.5, 0.8]) {
                    const u: number = 1 - t;
                    const px: number =
                        u ** 3 * x +
                        3 * u ** 2 * t * (command.values[0] ?? 0) +
                        3 * u * t ** 2 * (command.values[2] ?? 0) +
                        t ** 3 * (command.values[4] ?? 0);
                    const py: number =
                        u ** 3 * y +
                        3 * u ** 2 * t * (command.values[1] ?? 0) +
                        3 * u * t ** 2 * (command.values[3] ?? 0) +
                        t ** 3 * (command.values[5] ?? 0);
                    expect(Math.abs(Math.hypot(px - 50000, py - 50000) - radius)).toBeLessThan(
                        0.004,
                    );
                }
                x = command.values[4] ?? 0;
                y = command.values[5] ?? 0;
            }
        }
    }
});

test('arc edits, reset and undo preserve source style and convert deliberate path edits into freeform vectors', (): void => {
    const before: DesignDocument = fixture();
    const result: DesignEditResult = DesignEdits.apply(before, [
        { op: 'arc', id: 'ring', pageId: 'page-1', changes: { ...settings, sweep: -180 } },
    ]);
    expect(ring(result.document).arc?.sweep).toBe(-180);
    expect(ring(result.document).style).toEqual(ring(before).style);
    expect(DesignEdits.restore(result.document, result.changes).document).toEqual(before);
    const reset: DesignDocument = DesignEdits.apply(before, [
        { op: 'arc', id: 'ring', pageId: 'page-1', changes: null },
    ]).document;
    expect(ring(reset)).not.toHaveProperty('arc');
    expect(ring(reset).kind).toBe('ellipse');
    expect(ring(reset).path).toEqual([]);
    const detached: DesignNode = DesignPaths.resize(ring(before), {
        path: [
            { verb: 'M', values: [0, 0] },
            { verb: 'L', values: [100, 50] },
        ],
    });
    expect(detached.kind).toBe('path');
    expect(detached).not.toHaveProperty('arc');
    expect(detached.path).toHaveLength(2);
});

test('native dimensions, translation and artwork scale preserve the saved arc settings', (): void => {
    const result: DesignDocument = DesignEdits.apply(fixture(), [
        { op: 'resize', pageId: 'page-1', selection: ['ring'], width: 300, height: 120 },
        { op: 'translate', pageId: 'page-1', selection: ['ring'], dx: 50, dy: 40 },
        { op: 'scale', pageId: 'page-1', selection: ['ring'], factor: 2 },
    ]).document;
    expect(ring(result).arc).toEqual(settings);
    expect(ring(result).width).toBeCloseTo(600, 9);
    expect(ring(result).height).toBeCloseTo(240, 9);
    expect(DesignBooleanGeometry.path(ring(result), 600, 240)).toEqual(ring(result).path);
});

test('detaching a linked component preserves editable arc settings without changing the definition', (): void => {
    const source: DesignNode = ring(fixture());
    const component: DesignNode = {
        ...DesignDefaults.node('definition', 'component'),
        width: 200,
        height: 100,
        children: [source.id],
    };
    const instance: DesignNode = {
        ...DesignDefaults.node('instance', 'instance'),
        componentId: component.id,
        x: 300,
        width: 200,
        height: 100,
    };
    const before: DesignDocument = DesignCodec.document({
        ...fixture(),
        nodes: [component, { ...source, parentId: component.id }, instance],
        pages: [
            {
                id: 'page-1',
                name: 'Arcs',
                roots: [component.id, instance.id],
                background: '#FFFFFF',
            },
        ],
    });
    const plan: ReturnType<typeof DesignComponentDetach.plan> = DesignComponentDetach.plan(
        new DesignSelectionContext(before, 'page-1', [instance.id]),
        (): string => 'detached-ring',
    );
    const result: DesignEditResult = DesignEdits.apply(before, plan.operations);
    const detached: DesignNode | undefined = result.document.nodes.find(
        (node: DesignNode): boolean => node.parentId === instance.id,
    );
    expect(detached?.arc).toEqual(source.arc);
    expect(detached?.kind).toBe('ellipse');
    expect(detached?.path).toEqual(source.path);
    expect(ring(result.document)).toEqual(ring(before));
    expect(DesignEdits.restore(result.document, result.changes).document).toEqual(before);
    const locked: DesignDocument = DesignEdits.apply(before, [
        { op: 'update', id: component.id, changes: { locked: true } },
    ]).document;
    expect((): void => {
        DesignEdits.apply(locked, [
            { op: 'arc', id: source.id, pageId: 'page-1', changes: settings },
        ]);
    }).toThrow(/Unlock/);
});

test('arc boundaries reject malformed settings and closed commands reject wrong pages or locked containers', (): void => {
    for (const raw of [
        { ...settings, start: 361 },
        { ...settings, sweep: Infinity },
        { ...settings, innerRadius: 1 },
        { ...settings, closed: false },
        { ...settings, unknown: true },
    ]) {
        expect((): DesignArcSettings => DesignArcs.parse(raw)).toThrow();
    }
    expect((): DesignNode =>
        DesignNodeCodec.node({ ...DesignDefaults.node('bad', 'rectangle'), arc: settings }),
    ).toThrow(/ellipse/);
    expect((): DesignEditResult =>
        DesignEdits.apply(fixture(), [
            { op: 'arc', id: 'ring', pageId: 'other', changes: settings },
        ]),
    ).toThrow();
    const locked: DesignDocument = DesignEdits.apply(fixture(), [
        { op: 'update', id: 'ring', changes: { locked: true } },
    ]).document;
    expect((): DesignEditResult =>
        DesignEdits.apply(locked, [{ op: 'arc', id: 'ring', pageId: 'page-1', changes: settings }]),
    ).toThrow(/Unlock/);
});
