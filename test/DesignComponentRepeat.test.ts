// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import { DesignComponents } from '../src/design/DesignComponents.js';
import { DesignComponentExpansion } from '../src/design/DesignComponentExpansion.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import {
    DesignKind,
    type DesignDocument,
    type DesignNode,
    type DesignBox,
} from '../src/design/DesignTypes.js';
import type { DesignComponentRepeat } from '../src/design/DesignComponentTypes.js';
import type { DesignSelectionPlan } from '../src/design/DesignSelectionTypes.js';
import type { DesignLayoutResult } from '../src/design/DesignLayoutTypes.js';

function fixture(): DesignDocument {
    const text: DesignNode = DesignDefaults.node('caption', DesignKind.Text);
    if (text.text === null) {
        throw new Error('Missing text defaults');
    }
    return DesignCodec.document({
        ...DesignDefaults.document('repeat-design'),
        pages: [
            { id: 'page-1', name: 'Canvas', background: '#FFFFFF', roots: [] },
            { id: 'library', name: 'Artwork', background: '#FFFFFF', roots: ['motif'] },
        ],
        nodes: [
            {
                ...DesignDefaults.node('motif', DesignKind.Component, 'Motif'),
                width: 24,
                height: 16,
                children: ['dot', 'caption'],
            },
            {
                ...DesignDefaults.node('dot', DesignKind.Ellipse),
                parentId: 'motif',
                width: 8,
                height: 8,
            },
            {
                ...text,
                parentId: 'motif',
                width: 24,
                height: 16,
                text: { ...text.text, content: 'Editable' },
            },
        ],
    });
}
const command: DesignComponentRepeat = {
    action: 'repeat',
    componentId: 'motif',
    x: 100,
    y: 80,
    rows: 2,
    columns: 3,
    gapX: 4,
    gapY: 8,
    center: true,
};
function plan(
    document: DesignDocument,
    input: DesignComponentRepeat = command,
): DesignSelectionPlan {
    return DesignComponents.plan(
        document,
        'page-1',
        input,
        (source: string): string => 'new-' + source,
    );
}
function box(layout: DesignLayoutResult, id: string): DesignBox {
    const result: DesignBox | undefined = layout.boxes.find(
        (entry: DesignBox): boolean => entry.id === id,
    );
    if (result === undefined) {
        throw new Error('Missing repeat box');
    }
    return result;
}

describe('linked artwork repeats', (): void => {
    it('keeps long Unicode source names intact while bounding the new group label', (): void => {
        const before: DesignDocument = fixture();
        const document: DesignDocument = DesignEdits.apply(before, [
            {
                op: 'update',
                id: 'motif',
                changes: { name: 'A'.repeat(152) + '🐕' + 'B'.repeat(6) },
            },
        ]).document;
        const repeated: DesignDocument = DesignEdits.apply(
            document,
            plan(document).operations,
        ).document;
        const name: string | undefined = repeated.nodes.find(
            (node: DesignNode): boolean => node.id === 'new-repeat',
        )?.name;
        expect(name).toBe('A'.repeat(152) + ' repeat');
        expect(repeated.nodes.find((node: DesignNode): boolean => node.id === 'motif')?.name).toBe(
            'A'.repeat(152) + '🐕' + 'B'.repeat(6),
        );
    });
    it('places an empty auto-layout grid and six source links across pages with exact centered geometry', (): void => {
        const before: DesignDocument = fixture();
        const result: DesignSelectionPlan = plan(before);
        const document: DesignDocument = DesignEdits.apply(before, result.operations).document;
        expect(result.selection).toEqual(['new-repeat']);
        expect(document.nodes).toHaveLength(before.nodes.length + 7);
        expect(document.nodes.slice(0, before.nodes.length)).toEqual(before.nodes);
        expect(JSON.stringify(command).length).toBeLessThan(256);
        const layout: DesignLayoutResult = new DesignLayoutEngine(document, 'page-1').solve();
        expect(box(layout, 'new-repeat')).toMatchObject({ x: 60, y: 60, width: 80, height: 40 });
        expect(box(layout, 'new-repeat-cell-0')).toMatchObject({
            x: 60,
            y: 60,
            width: 24,
            height: 16,
        });
        expect(box(layout, 'new-repeat-cell-5')).toMatchObject({
            x: 116,
            y: 84,
            width: 24,
            height: 16,
        });
        const cells: readonly DesignNode[] = document.nodes.filter(
            (node: DesignNode): boolean => node.kind === DesignKind.Instance,
        );
        expect(cells).toHaveLength(6);
        for (const cell of cells) {
            expect(cell).toMatchObject({
                componentId: 'motif',
                parentId: 'new-repeat',
                children: [],
                text: null,
                overrides: [],
            });
        }
        expect(
            layout.nodes
                .filter((node): boolean => node.sourceId === 'caption')
                .map((node): string | undefined => node.text?.content),
        ).toEqual(Array<string>(6).fill('Editable'));
    });

    it('retains definition edits, per-cell overrides and ordinary grid gap editing without detachment', (): void => {
        const before: DesignDocument = fixture();
        let document: DesignDocument = DesignEdits.apply(before, plan(before).operations).document;
        document = DesignEdits.apply(document, [
            { op: 'text', id: 'caption', content: 'Updated' },
        ]).document;
        const override: DesignSelectionPlan = DesignComponents.plan(
            document,
            'page-1',
            {
                action: 'override',
                instanceId: 'new-repeat-cell-1',
                targetId: 'caption',
                changes: { text: 'Only this cell' },
            },
            (source: string): string => 'override-' + source,
        );
        document = DesignEdits.apply(document, override.operations).document;
        document = DesignEdits.apply(document, [
            { op: 'layout', id: 'new-repeat', pageId: 'page-1', changes: { gap: 10, rowGap: 12 } },
        ]).document;
        const layout: DesignLayoutResult = new DesignLayoutEngine(document, 'page-1').solve();
        expect(
            layout.nodes
                .filter((node): boolean => node.sourceId === 'caption')
                .map((node): string | undefined => node.text?.content),
        ).toEqual(['Updated', 'Only this cell', 'Updated', 'Updated', 'Updated', 'Updated']);
        expect(box(layout, 'new-repeat-cell-1').x - box(layout, 'new-repeat-cell-0').x).toBe(34);
        expect(
            document.nodes.filter((node: DesignNode): boolean => node.kind === DesignKind.Instance),
        ).toHaveLength(6);
    });

    it('uses the existing transaction boundary and rejects invalid or overflowing commands before allocation', (): void => {
        expect(plan(fixture(), { ...command, rows: 7, columns: 73 }).operations).toHaveLength(512);
        for (const input of [
            { ...command, rows: 0 },
            { ...command, columns: 2.5 },
            { ...command, rows: 2, columns: 256 },
            { ...command, gapX: -1 },
            { ...command, gapY: Infinity },
            { ...command, center: 'yes' },
            { ...command, unexpected: 1 },
        ]) {
            expect((): ReturnType<typeof DesignComponents.command> =>
                DesignComponents.command(input),
            ).toThrow();
        }
        expect((): DesignSelectionPlan =>
            plan(fixture(), { ...command, gapX: 10000, columns: 256, rows: 1 }),
        ).toThrow('bounds');
        let touched: boolean = false;
        const unsafe: Readonly<Record<string, unknown>> = {
            ...command,
            get rows(): number {
                touched = true;
                return 1;
            },
        };
        expect((): ReturnType<typeof DesignComponents.command> =>
            DesignComponents.command(unsafe),
        ).toThrow('data properties');
        expect(touched).toBe(false);
    });

    it('counts nested occurrences before saving a repeat that would exceed the expanded scene budget', (): void => {
        const base: DesignDocument = fixture();
        const leaf: DesignNode = DesignDefaults.node('leaf', DesignKind.Component);
        const branches: readonly DesignNode[] = Array.from(
            { length: 100 },
            (_value: unknown, index: number): DesignNode => ({
                ...DesignDefaults.node('branch-' + String(index), DesignKind.Instance),
                parentId: 'heavy',
                componentId: leaf.id,
            }),
        );
        const children: readonly DesignNode[] = Array.from(
            { length: 100 },
            (_value: unknown, index: number): DesignNode => ({
                ...DesignDefaults.node('leaf-' + String(index), DesignKind.Ellipse),
                parentId: leaf.id,
            }),
        );
        const document: DesignDocument = DesignCodec.document({
            ...base,
            pages: [base.pages[0], { ...base.pages[1], roots: ['heavy', 'leaf'] }],
            nodes: [
                {
                    ...DesignDefaults.node('heavy', DesignKind.Component),
                    children: branches.map((node: DesignNode): string => node.id),
                },
                ...branches,
                { ...leaf, children: children.map((node: DesignNode): string => node.id) },
                ...children,
            ],
        });
        const page: DesignDocument['pages'][number] | undefined = document.pages[0];
        if (page === undefined) {
            throw new Error('Missing test page');
        }
        expect((): void =>
            DesignComponentExpansion.repeat(document, page, 'heavy', 1),
        ).not.toThrow();
        expect((): void => DesignComponentExpansion.repeat(document, page, 'heavy', 2)).toThrow(
            'budget',
        );
    });
});
