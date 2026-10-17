// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignSvgImport } from '../src/design/DesignSvgImport.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignLayoutEngine } from '../src/design/DesignLayout.js';
import { DesignSvgGeometry } from '../src/design/DesignSvgGeometry.js';
import { DesignPatternSources } from '../src/design/DesignPatternSources.js';
import { DesignSvg } from '../src/design/DesignSvg.js';
import type { DesignDocument, DesignNode, DesignPaint } from '../src/design/DesignTypes.js';
import type {
    DesignSvgImageLoader,
    DesignSvgImageSource,
} from '../src/design/DesignSvgImageTypes.js';
import type { DesignAsset } from '../src/design/DesignAssetTypes.js';

const vectors: string =
    '<circle id="dot" cx="6" cy="6" r="4" fill="red"/><path id="triangle" d="M16 10 L28 10 L22 20Z" fill="green"/>';
const pattern: string =
    '<pattern id="motif" patternUnits="userSpaceOnUse" x="3" y="5" width="32" height="24">' +
    vectors +
    '</pattern>';
const rectangle: string =
    '<rect id="Shape" x="20" y="30" width="100" height="60" fill="url(#motif)"/>';

async function importSvg(
    definitions: string,
    body: string = rectangle,
    loader: DesignSvgImageLoader | null = null,
): Promise<DesignDocument> {
    return (
        await DesignSvgImport.apply(
            DesignDefaults.document('patterns'),
            {
                id: 'patterns',
                expectedRevision: '1',
                commandId: 'import',
                pageId: 'page-1',
                parentId: null,
                index: null,
                x: 0,
                y: 0,
                name: 'Pattern artwork',
                source:
                    '<svg width="400" height="240" font-family="Inter"><defs>' +
                    definitions +
                    '</defs>' +
                    body +
                    '</svg>',
            },
            (key: string): string => key.replaceAll(':', '-'),
            loader,
        )
    ).document;
}

function fill(document: DesignDocument, name: string = 'Shape'): DesignPaint {
    const paint: DesignPaint | undefined = document.nodes.find(
        (node: DesignNode): boolean => node.name === name,
    )?.style.fills[0];
    if (paint === undefined) {
        throw new Error('Missing imported vector paint');
    }
    return paint;
}

test('referenced multi-element vector patterns share linked editable components on their own library page', async (): Promise<void> => {
    const document: DesignDocument = await importSvg(
        pattern,
        rectangle + rectangle.replace('id="Shape" x="20"', 'id="Other" x="200"'),
    );
    expect(document.pages).toHaveLength(2);
    expect(document.pages[1]?.name).toBe('SVG patterns');
    expect(document.pages[1]?.roots).toHaveLength(1);
    const paint: DesignPaint = fill(document);
    expect(paint).toMatchObject({
        kind: 'pattern',
        assetId: null,
        framing: {
            fit: 'tile',
            transform: { a: 0.32, b: 0, c: 0, d: 0.4, tx: -0.17, ty: -25 / 60 },
        },
    });
    expect(fill(document, 'Other').patternId).toBe(paint.patternId);
    expect(
        document.nodes.find((node: DesignNode): boolean => node.id === paint.patternId),
    ).toMatchObject({ kind: 'component', width: 32, height: 24, layout: { clip: true } });
    expect(
        document.nodes.some(
            (node: DesignNode): boolean => node.name === 'dot' && node.path.length > 0,
        ),
    ).toBe(true);
    const exported: string = DesignSvg.render(
        DesignPatternSources.prepare(
            document,
            DesignSvgGeometry.select(new DesignLayoutEngine(document, 'page-1').solve()),
        ),
    ).svg;
    expect(exported).toContain('<pattern');
    expect(exported).toContain('<path');
    expect(exported).not.toContain('data:image/');
    expect(exported.match(/<g id="pattern-source-/gu)).toHaveLength(1);
});

test('paint-server effects do not wrap the native source artwork', async (): Promise<void> => {
    const plain: DesignDocument = await importSvg(pattern);
    const decorated: DesignDocument = await importSvg(
        '<clipPath id="crop"><rect width="8" height="8"/></clipPath>' +
            '<mask id="fade"><rect width="32" height="24" fill="white"/></mask>' +
            '<filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>' +
            pattern.replace(
                'id="motif"',
                'id="motif" opacity=".2" filter="url(#soft)" mask="url(#fade)" clip-path="url(#crop)"',
            ),
    );
    expect(decorated).toEqual(plain);
});

test('object-relative sources resolve different cell dimensions without leaking referring-object styles into the definition', async (): Promise<void> => {
    const document: DesignDocument = await importSvg(
        '<pattern id="motif" width=".25" height=".5" patternContentUnits="objectBoundingBox"><rect id="Source" width=".1" height=".2"/></pattern>',
        rectangle.replace('fill="url', 'color="red" fill="url') +
            rectangle.replace('id="Shape"', 'id="Other"').replace('width="100"', 'width="200"'),
    );
    expect(document.pages[1]?.roots).toHaveLength(2);
    expect(fill(document).framing?.transform).toEqual({
        a: 0.25,
        b: 0,
        c: 0,
        d: 0.5,
        tx: 0,
        ty: 0,
    });
    expect(
        document.nodes
            .filter((node: DesignNode): boolean => node.kind === 'component')
            .map((node: DesignNode): number => node.width),
    ).toEqual([25, 50]);
    expect(
        document.nodes
            .filter((node: DesignNode): boolean => node.name === 'Source')
            .map((node: DesignNode): string | undefined => node.style.fills[0]?.color),
    ).toEqual(['#000000', '#000000']);
});

test('nested pattern content resolves linked dependencies and rejects recursive source bodies atomically', async (): Promise<void> => {
    const outer: string =
        '<pattern id="outer" patternUnits="userSpaceOnUse" width="64" height="48"><rect width="64" height="48" fill="url(#motif)"/></pattern>';
    const document: DesignDocument = await importSvg(
        pattern + outer,
        rectangle.replace('url(#motif)', 'url(#outer)'),
    );
    expect(document.pages[1]?.roots).toHaveLength(2);
    const exported: string = DesignSvg.render(
        DesignPatternSources.prepare(
            document,
            DesignSvgGeometry.select(new DesignLayoutEngine(document, 'page-1').solve()),
        ),
    ).svg;
    expect(exported).toContain('pattern-source-0-pattern-source-0');
    await expect(importSvg(pattern.replace('fill="red"', 'fill="url(#motif)"'))).rejects.toThrow(
        'cyclic',
    );
    await expect(
        importSvg(pattern.replace('fill="red"', 'fill="url(#outer)"') + outer),
    ).rejects.toThrow('cyclic');
});

test('text pattern fills preserve paint opacity and source text through rich ranges and positioned chunks', async (): Promise<void> => {
    const document: DesignDocument = await importSvg(
        pattern,
        '<text x="20" y="80" font-size="32" fill="url(#motif)" fill-opacity=".4">A<tspan fill-opacity=".8">B</tspan><tspan x="180" y="130">C</tspan></text>',
    );
    const text: readonly DesignNode[] = document.nodes.filter(
        (node: DesignNode): boolean => node.kind === 'text',
    );
    expect(text.map((node: DesignNode): string => node.text?.content ?? '').join('')).toBe('ABC');
    expect(text[0]?.style.fills[0]).toMatchObject({ kind: 'pattern', opacity: 0.4 });
    expect(
        text[0]?.text?.runs.some(
            (run): boolean =>
                run.fills?.some(
                    (paint: DesignPaint): boolean =>
                        paint.kind === 'pattern' && paint.opacity === 0.8,
                ) === true,
        ),
    ).toBe(true);
    expect(document.pages[1]?.roots).toHaveLength(1);
});

test('mixed image and vector sources use the same original image admission once and retain their editable siblings', async (): Promise<void> => {
    let admissions: number = 0;
    const encoded: string =
        'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADklEQVR4nGP4z8DwHwQBEPgD/U6VwW8AAAAASUVORK5CYII=';
    const uri: string = 'data:image/png;base64,' + encoded;
    const loader: DesignSvgImageLoader = (source: DesignSvgImageSource): Promise<DesignAsset> => {
        admissions++;
        return Promise.resolve({
            id: 'image',
            name: source.name,
            mime: source.mime,
            byteLength: String(source.bytes.length),
            sha256: 'a'.repeat(64),
            width: 2,
            height: 1,
        });
    };
    const document: DesignDocument = await importSvg(
        pattern.replace(
            '</pattern>',
            '<image href="' + uri + '" width="10" height="5"/></pattern>',
        ),
        rectangle + '<image href="' + uri + '" width="20" height="10"/>',
        loader,
    );
    expect(admissions).toBe(1);
    expect(
        document.nodes.filter((node: DesignNode): boolean => node.kind === 'image'),
    ).toHaveLength(2);
    expect(fill(document).kind).toBe('pattern');
    expect(JSON.stringify(document)).not.toContain(encoded);
});

test('positioned object-relative text retains only its final shared source after whole-element bounds are rebased', async (): Promise<void> => {
    const document: DesignDocument = await importSvg(
        '<pattern id="motif" width=".25" height=".5" viewBox="0 0 32 24">' + vectors + '</pattern>',
        '<text x="20" y="70" font-size="32" fill="url(#motif)">A<tspan x="180" y="130">CD</tspan></text>',
    );
    expect(document.pages[1]?.roots).toHaveLength(1);
    const paints: readonly DesignPaint[] = document.nodes
        .filter((node: DesignNode): boolean => node.kind === 'text')
        .flatMap((node: DesignNode): readonly DesignPaint[] => node.style.fills);
    expect(paints).toHaveLength(2);
    expect(paints[0]?.patternId).toBe(paints[1]?.patternId);
});

test('object-relative viewBox fitting uses the physical tile aspect ratio before mapping vector content', async (): Promise<void> => {
    const document: DesignDocument = await importSvg(
        '<pattern id="motif" width=".32" height=".4" viewBox="0 0 32 24">' + vectors + '</pattern>',
    );
    const dot: DesignNode | undefined = document.nodes.find(
        (node: DesignNode): boolean => node.name === 'dot',
    );
    expect(dot).toMatchObject({ width: 8, height: 8 });
    expect(
        document.nodes.find((node: DesignNode): boolean => node.kind === 'component'),
    ).toMatchObject({ width: 32, height: 24 });
});
