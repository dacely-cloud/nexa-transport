// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignImageTileCodec } from '../src/design/DesignImageTileCodec.js';
import { DesignImageTileGeometry } from '../src/design/DesignImageTileGeometry.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignPaintImageEdits } from '../src/design/DesignPaintImageEdits.js';
import { DesignOperationCodec } from '../src/design/DesignOperationCodec.js';
import type { DesignPaint } from '../src/design/DesignTypes.js';
import type { DesignImageTile } from '../src/design/DesignImageTileTypes.js';
import { DesignCodec } from '../src/design/DesignCodec.js';

const tile: DesignImageTile = {
    content: { a: 0.5, b: 0.1, c: -0.2, d: 0.5, tx: 0.25, ty: 0.2 },
    clip: { x: 0.2, y: 0.1, width: 0.6, height: 0.8 },
};

test('decoded image layers and paints freeze cell content without freezing external input', (): void => {
    const source: ReturnType<typeof DesignDefaults.document> = DesignDefaults.document('tiles');
    const image: ReturnType<typeof DesignDefaults.node> = {
        ...DesignDefaults.node('image', 'image'),
        image: { assetId: 'pixels', ...DesignDefaults.framing(), tile },
    };
    const shape: ReturnType<typeof DesignDefaults.node> = {
        ...DesignDefaults.node('shape', 'rectangle'),
        style: {
            ...DesignDefaults.style('rectangle'),
            fills: [
                {
                    ...DesignDefaults.paint(),
                    kind: 'image',
                    assetId: 'pixels',
                    framing: { ...DesignDefaults.framing(), tile },
                },
            ],
        },
    };
    const decoded: ReturnType<typeof DesignCodec.document> = DesignCodec.document({
        ...source,
        pages: source.pages.map((page): typeof page => ({ ...page, roots: ['image', 'shape'] })),
        nodes: [image, shape],
    });
    expect(Object.isFrozen(tile)).toBe(false);
    for (const framing of [decoded.nodes[0]?.image, decoded.nodes[1]?.style.fills[0]?.framing]) {
        if (framing?.tile == null) {
            throw new Error('Missing canonical cell content');
        }
        expect(Object.isFrozen(framing)).toBe(true);
        expect(Object.isFrozen(framing.tile)).toBe(true);
        expect(Object.isFrozen(framing.tile.content)).toBe(true);
        expect(Object.isFrozen(framing.tile.clip)).toBe(true);
        expect(Reflect.set(framing.tile.content, 'tx', 100)).toBe(false);
    }
});

test('compact repeat-cell edits retain opacity, source identity, placement and latent tile data', (): void => {
    const source: DesignPaint = {
        ...DesignDefaults.paint(),
        kind: 'image',
        assetId: 'pixels',
        opacity: 0.4,
        framing: { ...DesignDefaults.framing(), fit: 'tile', rotation: 30 },
    };
    const changed: DesignPaint = DesignPaintImageEdits.paint(source, { tile });
    expect(changed).toEqual({ ...source, framing: { ...source.framing, tile } });
    const ordinary: DesignPaint = DesignPaintImageEdits.paint(changed, { fit: 'contain' });
    expect(ordinary.framing?.tile).toEqual(tile);
    expect(DesignPaintImageEdits.paint(changed, { tile: null })).toEqual({
        ...source,
        framing: { ...source.framing, tile: null },
    });
    expect(
        DesignOperationCodec.operations([
            {
                op: 'paint-image',
                id: 'card',
                pageId: 'page-1',
                target: 'fill',
                index: 0,
                changes: { tile },
            },
        ])[0],
    ).toMatchObject({ changes: { tile } });
});

test('repeat-cell and image sampling crops intersect in original image coordinates', (): void => {
    expect(
        DesignImageTileGeometry.clip(
            {
                assetId: 'pixels',
                ...DesignDefaults.framing(),
                fit: 'tile',
                tile,
                sampling: { aspect: 1, alignX: 'center', alignY: 'center' },
            },
            200,
            100,
        ),
    ).toEqual({ x: 0.25, y: 0.1, width: 0.5, height: 0.8 });
    expect(
        DesignImageTileGeometry.clip(
            { assetId: 'pixels', ...DesignDefaults.framing(), fit: 'contain', tile },
            200,
            100,
        ),
    ).toBeNull();
});

test('tile boundaries reject singular transforms, invalid crops and executable properties', (): void => {
    for (const value of [
        { content: { ...tile.content, a: 0, b: 0 } },
        { ...tile, unexpected: 'field' },
        { ...tile, clip: { x: 0.8, y: 0, width: 0.4, height: 1 } },
        { ...tile, clip: { x: 0, y: 0, width: 0, height: 1 } },
        { ...tile, clip: { x: Number.NaN, y: 0, width: 1, height: 1 } },
    ]) {
        expect((): DesignImageTile => DesignImageTileCodec.parse(value)).toThrow();
    }
    let calls: number = 0;
    const accessor: Record<string, unknown> = { content: tile.content };
    Object.defineProperty(accessor, 'clip', {
        enumerable: true,
        get: (): null => {
            calls++;
            return null;
        },
    });
    expect((): DesignImageTile => DesignImageTileCodec.parse(accessor)).toThrow();
    expect(calls).toBe(0);
});
