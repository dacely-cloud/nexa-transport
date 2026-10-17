// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import type { DesignAsset } from '../src/design/DesignAssetTypes.js';
import {
    DesignSvgImportLayers,
    type DesignSvgLayerImport,
} from '../src/design/DesignSvgImportLayers.js';
import type {
    DesignSvgImageSource,
    DesignSvgImageLoader,
} from '../src/design/DesignSvgImageTypes.js';
import type { DesignNode, DesignPaint } from '../src/design/DesignTypes.js';
import { DesignSvgPaints } from '../src/design/DesignSvgPaints.js';

const encoded: string =
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADklEQVR4nGP4z8DwHwQBEPgD/U6VwW8AAAAASUVORK5CYII=';
const uri: string = 'data:image/png;base64,' + encoded;
const load: DesignSvgImageLoader = (source: DesignSvgImageSource): Promise<DesignAsset> =>
    Promise.resolve({
        id: 'raster',
        name: source.name,
        mime: source.mime,
        byteLength: String(source.bytes.length),
        sha256: 'a'.repeat(64),
        width: 2,
        height: 1,
    });

async function parse(
    definitions: string,
    body: string,
    loader: DesignSvgImageLoader | null = load,
): Promise<DesignSvgLayerImport> {
    return DesignSvgImportLayers.parse(
        `<svg width="400" height="240" font-family="Inter"><defs>${definitions}</defs>${body}</svg>`,
        'Image patterns',
        (key: string): string => key.replaceAll(':', '-'),
        loader,
    );
}

function paint(result: DesignSvgLayerImport, name: string = 'Shape'): DesignPaint {
    const node: DesignNode | undefined = result.nodes.find(
        (node: DesignNode): boolean => node.name === name,
    );
    const value: DesignPaint | undefined = node?.style.fills[0];
    if (value === undefined) {
        throw new Error('Missing imported image paint ' + name);
    }
    return value;
}

const userTile: string = `<pattern id="tile" patternUnits="userSpaceOnUse" x="3" y="5" width="40" height="20"><image href="${uri}" width="40" height="20"/></pattern>`;
const rectangle: string =
    '<rect id="Shape" x="20" y="30" width="100" height="60" fill="url(#tile)"/>';

test('a user-space raster tile retains its original asset and independent repeat origin', async (): Promise<void> => {
    const result: DesignSvgLayerImport = await parse(userTile, rectangle);
    expect(paint(result)).toMatchObject({
        kind: 'image',
        assetId: 'raster',
        opacity: 1,
        framing: {
            fit: 'tile',
            transform: { a: 0.4, b: 0, c: 0, d: 1 / 3, tx: -0.17, ty: -25 / 60 },
        },
    });
    expect(result.nodes.find((node: DesignNode): boolean => node.name === 'Shape')?.kind).toBe(
        'path',
    );
    expect(JSON.stringify(result.nodes)).not.toContain(encoded);
});

test('object-relative content and tile dimensions remain editable without flattening the shape', async (): Promise<void> => {
    const result: DesignSvgLayerImport = await parse(
        `<pattern id="tile" x="10%" y="25%" width="20%" height="50%" patternContentUnits="objectBoundingBox"><image href="${uri}" width=".2" height=".5" preserveAspectRatio="none"/></pattern>`,
        rectangle,
    );
    expect(paint(result).framing?.transform).toEqual({
        a: 0.2,
        b: 0,
        c: 0,
        d: 0.5,
        tx: 0.1,
        ty: 0.25,
    });
});

test('default user-space content works inside object-relative tiles at a nonzero object origin', async (): Promise<void> => {
    const result: DesignSvgLayerImport = await parse(
        `<pattern id="tile" width=".2" height=".5"><image href="${uri}" width="20" height="30" preserveAspectRatio="none"/></pattern>`,
        rectangle,
    );
    expect(paint(result).framing?.transform).toEqual({ a: 0.2, b: 0, c: 0, d: 0.5, tx: 0, ty: 0 });
});

test('patternTransform maps the resolved object-relative lattice in the referencing user coordinate system', async (): Promise<void> => {
    const result: DesignSvgLayerImport = await parse(
        `<pattern id="tile" width=".2" height=".5" patternContentUnits="objectBoundingBox" patternTransform="rotate(90)"><image href="${uri}" width=".2" height=".5" preserveAspectRatio="none"/></pattern>`,
        rectangle,
    );
    const matrix: NonNullable<NonNullable<DesignPaint['framing']>['transform']> | undefined =
        paint(result).framing?.transform ?? undefined;
    expect(matrix?.a).toBeCloseTo(0, 8);
    expect(matrix?.b).toBeCloseTo(1 / 3, 8);
    expect(matrix?.c).toBeCloseTo(-0.3, 8);
    expect(matrix?.d).toBeCloseTo(0, 8);
    expect(matrix?.tx).toBeCloseTo(-0.5, 8);
    expect(matrix?.ty).toBeCloseTo(-1 / 6, 8);
});

test('viewBox and inherited local image/use transforms preserve their repeat lattice', async (): Promise<void> => {
    const result: DesignSvgLayerImport = await parse(
        `<image id="pixels" href="${uri}" width="2" height="1"/><pattern id="base" patternUnits="userSpaceOnUse" width="40" height="20" viewBox="10 20 2 1"><use href="#pixels" x="10" y="20"/></pattern><pattern id="tile" href="#base" x="3" y="5"><title>Texture</title></pattern>`,
        rectangle,
    );
    expect(paint(result).framing?.transform).toEqual(
        paint(await parse(userTile, rectangle)).framing?.transform,
    );
});

test('pattern and object transforms retain skewed and reflected editable image axes', async (): Promise<void> => {
    const result: DesignSvgLayerImport = await parse(
        userTile.replace('x="3"', 'patternTransform="translate(7 11) scale(-1 1)" x="3"'),
        '<g transform="matrix(2 0 .5 3 8 4)">' + rectangle + '</g>',
    );
    const matrix: NonNullable<NonNullable<DesignPaint['framing']>['transform']> | undefined =
        paint(result).framing?.transform ?? undefined;
    expect(matrix?.a).toBeCloseTo(-80 / 230, 8);
    expect(matrix?.b).toBe(0);
    expect(matrix?.c).toBeCloseTo(10 / 230, 8);
    expect(matrix?.d).toBeCloseTo(60 / 180, 8);
    expect(matrix?.tx).toBeCloseTo((24 - 63) / 230, 8);
    expect(matrix?.ty).toBeCloseTo((52 - 94) / 180, 8);
});

test('image opacity, pattern opacity and rich fill opacity stay independent of text content and shaping', async (): Promise<void> => {
    const result: DesignSvgLayerImport = await parse(
        userTile
            .replace('id="tile"', 'id="tile" opacity=".5"')
            .replace('<image ', '<image opacity=".8" '),
        '<text id="Words" x="20" y="70" font-size="32" fill="url(#tile)" fill-opacity=".5">A<tspan fill-opacity="1">ffi</tspan>Z</text>',
    );
    const label: DesignNode | undefined = result.nodes.find(
        (node: DesignNode): boolean => node.name === 'Words',
    );
    expect(label?.kind).toBe('text');
    expect(label?.path).toEqual([]);
    expect(label?.text?.content).toBe('AffiZ');
    expect(label?.style.fills[0]).toMatchObject({ kind: 'image', opacity: 0.2, assetId: 'raster' });
    expect(label?.text?.runs).toMatchObject([
        { start: 1, end: 4, fills: [{ kind: 'image', opacity: 0.4 }] },
    ]);
});

test('patterns appearing only in rich ranges and strokes are prepared before native paint resolution', async (): Promise<void> => {
    const result: DesignSvgLayerImport = await parse(
        userTile,
        '<text id="Words" x="20" y="70" font-size="32" fill="black">A<tspan fill="url(#tile)">ffi</tspan>Z</text><rect id="Shape" x="20" y="90" width="100" height="60" fill="none" stroke="url(#tile)" stroke-width="4"/>',
    );
    expect(paint(result, 'Words').kind).toBe('image');
    expect(
        result.nodes.find((node: DesignNode): boolean => node.name === 'Shape')?.style.stroke
            ?.paint,
    ).toMatchObject({ kind: 'image', assetId: 'raster' });
});

test('image layers, aliases, shapes and positioned text chunks share one admitted raster', async (): Promise<void> => {
    let admissions: number = 0;
    const loader: DesignSvgImageLoader = async (
        source: DesignSvgImageSource,
    ): Promise<DesignAsset> => {
        admissions++;
        return load(source);
    };
    const result: DesignSvgLayerImport = await parse(
        userTile + '<pattern id="alias" href="#tile"/>',
        `<image href="${uri}" width="20" height="10"/>${rectangle}<text x="20" y="80" font-size="20" fill="url(#alias)">A<tspan x="60" y="120">B</tspan></text>`,
        loader,
    );
    expect(admissions).toBe(1);
    const labels: readonly DesignNode[] = result.nodes.filter(
        (node: DesignNode): boolean => node.kind === 'text',
    );
    expect(labels).toHaveLength(2);
    for (const label of labels) {
        expect(label.style.fills[0]).toMatchObject({
            kind: 'image',
            assetId: 'raster',
            framing: { fit: 'tile' },
        });
    }
});

test('a raster offset or oversized inside a cell retains independent cell and content matrices', async (): Promise<void> => {
    const gap: DesignPaint = paint(
        await parse(userTile.replace('<image ', '<image x="4" '), rectangle),
    );
    expect(gap.framing?.transform).toEqual({
        a: 0.4,
        b: 0,
        c: 0,
        d: 1 / 3,
        tx: -0.17,
        ty: -25 / 60,
    });
    expect(gap.framing?.tile).toEqual({ content: { a: 1, b: 0, c: 0, d: 1, tx: 0.1, ty: 0 } });
    const oversized: DesignPaint = paint(
        await parse(userTile.replace('<image ', '<image transform="scale(2)" '), rectangle),
    );
    expect(oversized.framing?.tile).toEqual({ content: { a: 2, b: 0, c: 0, d: 2, tx: 0, ty: 0 } });
});

test('image slice viewport crops before filtering and leaves its original raster editable', async (): Promise<void> => {
    const cropped: DesignPaint = paint(
        await parse(
            userTile.replace(
                'width="40" height="20"/>',
                'x="5" y="6" width="20" height="40" preserveAspectRatio="xMidYMid slice"/>',
            ),
            rectangle,
        ),
    );
    expect(cropped.assetId).toBe('raster');
    expect(cropped.framing?.tile).toMatchObject({
        content: { a: 2, b: 0, c: 0, d: 2, tx: -0.625 },
        clip: { x: 0.375, y: 0, width: 0.25, height: 1 },
    });
    expect(cropped.framing?.tile?.content.ty).toBeCloseTo(0.3, 10);
});

test('unused patterns remain inert and zero-sized tiles do not admit images', async (): Promise<void> => {
    const result: DesignSvgLayerImport = await parse(
        '<pattern id="unused" href="https://example.invalid/p.svg"/>' +
            userTile.replace('width="40" height="20"', 'width="0" height="20"'),
        rectangle,
        null,
    );
    expect(
        result.nodes.find((node: DesignNode): boolean => node.name === 'Shape')?.style.fills,
    ).toEqual([]);
});

test('native tiled-paint export reimports as the same image framing without a second pattern resetting its phase', async (): Promise<void> => {
    const original: DesignPaint = paint(await parse(userTile, rectangle));
    const asset: DesignAsset = await load({
        name: 'Pixels',
        mime: 'image/png',
        bytes: Uint8Array.from(atob(encoded), (value: string): number => value.charCodeAt(0)),
    });
    const exported: DesignSvgPaints = new DesignSvgPaints(
        new Map([[asset.id, { asset, base64: encoded }]]),
    );
    const fill: string = exported.paint(original, {
        id: 'box',
        x: 0,
        y: 0,
        width: 100,
        height: 60,
        rotation: 0,
        depth: 0,
        clipId: null,
    });
    expect(exported.definitions.join('')).not.toContain('<rect');
    const imported: DesignPaint = paint(
        await parse(
            exported.definitions.join(''),
            `<rect id="Shape" width="100" height="60" fill="${fill}"/>`,
        ),
    );
    expect(imported).toEqual(original);
});

test.each(['gap', 'slice'])(
    'editable %s cells retain source identity, placement and crop after SVG export/reimport',
    async (kind: string): Promise<void> => {
        const definitions: string =
            kind === 'gap'
                ? userTile.replace('<image ', '<image x="4" ')
                : userTile.replace(
                      'width="40" height="20"/>',
                      'x="5" y="6" width="20" height="40" preserveAspectRatio="xMidYMid slice"/>',
                  );
        const original: DesignPaint = paint(await parse(definitions, rectangle));
        const asset: DesignAsset = await load({
            name: 'Pixels',
            mime: 'image/png',
            bytes: Uint8Array.from(atob(encoded), (value: string): number => value.charCodeAt(0)),
        });
        const exported: DesignSvgPaints = new DesignSvgPaints(
            new Map([[asset.id, { asset, base64: encoded }]]),
        );
        const fill: string = exported.paint(original, {
            id: 'box',
            x: 0,
            y: 0,
            width: 100,
            height: 60,
            rotation: 0,
            depth: 0,
            clipId: null,
        });
        expect(exported.definitions.join('')).not.toContain('<clipPath');
        const restored: DesignPaint = paint(
            await parse(
                exported.definitions.join(''),
                `<rect id="Shape" width="100" height="60" fill="${fill}"/>`,
            ),
        );
        expect(restored.assetId).toBe(original.assetId);
        const previous: NonNullable<DesignPaint['framing']> | undefined = original.framing;
        const next: NonNullable<DesignPaint['framing']> | undefined = restored.framing;
        if (
            previous?.transform == null ||
            next?.transform == null ||
            previous.tile == null ||
            next.tile == null
        ) {
            throw new Error('Missing restored cell geometry');
        }
        for (const key of ['a', 'b', 'c', 'd', 'tx', 'ty'] as const) {
            expect(next.transform[key]).toBeCloseTo(previous.transform[key], 10);
            expect(next.tile.content[key]).toBeCloseTo(previous.tile.content[key], 10);
        }
        expect(next.tile.clip ?? null).toEqual(previous.tile.clip ?? null);
    },
);

test.each([
    [
        'pattern cycle',
        '<pattern id="tile" href="#other"/><pattern id="other" href="#tile"/>',
        /cyclic/,
    ],
    [
        'external template',
        '<pattern id="tile" href="https://example.invalid/p.svg"/>',
        /this document/,
    ],
    [
        'external raster',
        userTile.replace(uri, 'https://example.invalid/photo.png'),
        /embedded|data/i,
    ],
    ['missing image loader', userTile, /Save this layout/],
    [
        'use cycle',
        '<g id="again"><use href="#again"/></g><pattern id="tile" patternUnits="userSpaceOnUse" width="40" height="20"><use href="#again"/></pattern>',
        /cyclic/,
    ],
    [
        'singular pattern transform',
        userTile.replace('id="tile"', 'id="tile" patternTransform="scale(0 1)"'),
        /independent nonzero/,
    ],
])(
    'rejects %s without flattening or loading external resources',
    async (name: string, definitions: string, message: RegExp): Promise<void> => {
        await expect(
            parse(definitions, rectangle, name === 'missing image loader' ? null : load),
        ).rejects.toThrow(message);
    },
);
