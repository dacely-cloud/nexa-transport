// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignCodec } from '../src/design/DesignCodec.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import { DesignSelectionIndex } from '../src/design/DesignSelectionIndex.js';
import { DesignRecolorEdits } from '../src/design/DesignRecolorEdits.js';
import type { DesignDocument, DesignNode } from '../src/design/DesignTypes.js';
import type {
    DesignEditResult,
    DesignRecolorOperation,
} from '../src/design/DesignOperationTypes.js';

const operation: DesignRecolorOperation = {
    op: 'recolor',
    pageId: 'page-1',
    selection: ['section', 'instance', 'label'],
    before: '#11223380',
    after: '#AABBCC40',
};
function fixture(): DesignDocument {
    const base: DesignDocument = DesignDefaults.document('recolor');
    const label: DesignNode = DesignDefaults.node('label', 'text');
    if (label.text === null) {
        throw new Error('Missing text defaults');
    }
    const component: DesignNode = {
        ...DesignDefaults.node('button', 'component'),
        style: {
            ...DesignDefaults.style('component'),
            fills: [{ ...DesignDefaults.paint('#FFFFFF'), tokenId: 'brand', opacity: 0.4 }],
        },
    };
    return DesignCodec.document({
        ...base,
        tokens: [{ id: 'brand', name: 'Brand', category: 'color', value: '#11223380' }],
        pages: [
            {
                ...base.pages[0],
                id: 'page-1',
                name: 'Page',
                background: '#FFFFFF',
                roots: ['section', 'button', 'instance'],
            },
        ],
        nodes: [
            {
                ...DesignDefaults.node('section', 'frame'),
                children: ['label', 'locked'],
                style: { ...DesignDefaults.style('frame'), fills: [] },
            },
            {
                ...label,
                parentId: 'section',
                text: {
                    ...label.text,
                    content: 'Private native text.\n'.repeat(3500),
                    runs: [
                        {
                            start: 0,
                            end: 7,
                            family: 'Inter',
                            size: 21,
                            weight: 700,
                            italic: true,
                            underline: false,
                            color: '#11223380',
                        },
                        {
                            start: 8,
                            end: 10,
                            family: 'Inter',
                            size: 14,
                            weight: 400,
                            italic: false,
                            underline: false,
                            color: '#448855',
                        },
                    ],
                },
                style: {
                    ...label.style,
                    fills: [
                        { ...DesignDefaults.paint('#FFFFFF'), tokenId: 'brand', opacity: 0.3 },
                        { ...DesignDefaults.paint('#556677'), kind: 'image', assetId: 'photo' },
                    ],
                    stroke: {
                        width: 3,
                        dash: [2, 4],
                        paint: {
                            ...DesignDefaults.paint(),
                            kind: 'linear',
                            angle: 45,
                            stops: [
                                { offset: 0, color: '#11223380' },
                                { offset: 1, color: '#778899' },
                            ],
                        },
                    },
                    shadows: [{ x: 2, y: 4, blur: 8, spread: 1, inner: false, color: '#11223380' }],
                },
            },
            {
                ...DesignDefaults.node('locked', 'frame'),
                parentId: 'section',
                locked: true,
                children: ['hidden-child'],
            },
            {
                ...DesignDefaults.node('hidden-child', 'rectangle'),
                parentId: 'locked',
                style: {
                    ...DesignDefaults.style('rectangle'),
                    fills: [DesignDefaults.paint('#11223380')],
                },
            },
            component,
            {
                ...DesignDefaults.node('instance', 'instance'),
                componentId: component.id,
                overrides: [
                    {
                        nodeId: component.id,
                        name: 'Keep override',
                        visible: null,
                        text: null,
                        style: null,
                    },
                ],
            },
        ],
    });
}
function node(source: DesignDocument, id: string): DesignNode {
    const value: DesignNode | undefined = source.nodes.find(
        (entry: DesignNode): boolean => entry.id === id,
    );
    if (value === undefined) {
        throw new Error('Missing node ' + id);
    }
    return value;
}
it('recolors subtrees once, preserving full text, unmatched runs, images, effects, opacity and definitions', (): void => {
    const source: DesignDocument = fixture();
    const before: string = JSON.stringify(source);
    const edited: DesignEditResult = DesignEdits.apply(source, [operation]);
    const text: DesignNode = node(edited.document, 'label');
    expect(JSON.stringify(source)).toBe(before);
    expect(text.text?.content).toBe(node(source, 'label').text?.content);
    expect(text.text?.runs[0]).toEqual({
        ...node(source, 'label').text?.runs[0],
        color: '#AABBCC40',
    });
    expect(text.text?.runs[1]).toEqual(node(source, 'label').text?.runs[1]);
    expect(text.style.fills[0]).toEqual({
        ...node(source, 'label').style.fills[0],
        color: '#AABBCC40',
        tokenId: null,
    });
    expect(text.style.fills[1]).toEqual(node(source, 'label').style.fills[1]);
    expect(text.style.stroke).toEqual({
        ...node(source, 'label').style.stroke,
        paint: {
            ...node(source, 'label').style.stroke?.paint,
            stops: [
                { offset: 0, color: '#AABBCC40' },
                { offset: 1, color: '#778899' },
            ],
        },
    });
    expect(text.style.shadows).toEqual(node(source, 'label').style.shadows);
    expect(node(edited.document, 'button')).toEqual(node(source, 'button'));
    expect(node(edited.document, 'hidden-child')).toEqual(node(source, 'hidden-child'));
    expect(node(edited.document, 'instance').overrides[0]).toMatchObject({
        name: 'Keep override',
        style: { fills: [{ color: '#AABBCC40', tokenId: null, opacity: 0.4 }] },
    });
    expect(edited.document.tokens).toEqual(source.tokens);
    expect(edited.changes.nodes).toHaveLength(2);
    expect(DesignEdits.restore(edited.document, edited.changes).document.nodes).toEqual(
        source.nodes,
    );
});
it('groups each color by authored layer and skips locked descendants', (): void => {
    const source: DesignDocument = fixture();
    const index: DesignSelectionIndex = new DesignSelectionIndex(
        source,
        'page-1',
        operation.selection,
    );
    expect(
        DesignRecolorEdits.groups(index).find((entry): boolean => entry.color === '#11223380'),
    ).toEqual({ color: '#11223380', layers: 2 });
    expect(
        DesignRecolorEdits.groups(index).some((entry): boolean => entry.color === '#556677'),
    ).toBe(false);
});
it('no matching color and exact no-ops preserve every authored node and token', (): void => {
    const source: DesignDocument = fixture();
    for (const next of [
        { ...operation, before: '#FFFFFF' },
        { ...operation, after: operation.before },
    ]) {
        const result: DesignEditResult = DesignEdits.apply(source, [next]);
        expect(result.changes.nodes).toHaveLength(0);
        expect(result.document.nodes).toEqual(source.nodes);
        expect(result.document.tokens).toEqual(source.tokens);
    }
});
it('validates exact fields, colors, bounded distinct selections, pages, virtual IDs and selected locks', (): void => {
    for (const invalid of [
        { ...operation, extra: true },
        { ...operation, before: 'red' },
        { ...operation, after: '#FFF' },
        { ...operation, selection: [] },
        { ...operation, selection: ['label', 'label'] },
        {
            ...operation,
            selection: Array.from(
                { length: 129 },
                (_: unknown, index: number): string => 'layer-' + String(index),
            ),
        },
    ]) {
        expect((): void => {
            DesignOperationCodec.operations([invalid]);
        }).toThrow();
    }
    const source: DesignDocument = fixture();
    for (const selection of [['locked'], ['hidden-child'], ['instance:virtual']]) {
        expect((): void => {
            DesignEdits.apply(source, [{ ...operation, selection }]);
        }).toThrow();
    }
    expect((): void => {
        DesignEdits.apply(source, [{ ...operation, pageId: 'other' }]);
    }).toThrow();
    expect(
        DesignOperationCodec.operations([
            { ...operation, before: '#aabbcc', after: '#ccaabb80' },
        ])[0],
    ).toMatchObject({ before: '#AABBCC', after: '#CCAABB80' });
});

it('one compact recolor changes more than 512 descendants without expanding into a browser operation per layer', (): void => {
    const base: DesignDocument = DesignDefaults.document('many-colors');
    const leaves: readonly DesignNode[] = Array.from(
        { length: 600 },
        (_: unknown, index: number): DesignNode => ({
            ...DesignDefaults.node('leaf-' + String(index), 'rectangle'),
            parentId: 'section',
            style: {
                ...DesignDefaults.style('rectangle'),
                fills: [DesignDefaults.paint('#11223380')],
            },
        }),
    );
    const source: DesignDocument = DesignCodec.document({
        ...base,
        nodes: [
            {
                ...DesignDefaults.node('section', 'frame'),
                children: leaves.map((entry: DesignNode): string => entry.id),
                style: { ...DesignDefaults.style('frame'), fills: [] },
            },
            ...leaves,
        ],
        pages: [{ id: 'page-1', name: 'Page', background: '#FFFFFF', roots: ['section'] }],
    });
    const result: DesignEditResult = DesignEdits.apply(source, [
        { ...operation, selection: ['section'] },
    ]);
    expect(result.changes.nodes).toHaveLength(600);
    expect(
        result.document.nodes
            .filter((entry: DesignNode): boolean => entry.id !== 'section')
            .every((entry: DesignNode): boolean => entry.style.fills[0]?.color === operation.after),
    ).toBe(true);
    expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
        source.nodes,
    );
});
