// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { Method } from '../src/protocol/Protocol.js';
import type { DesignSaveRequest } from '../src/design/DesignRequests.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignStyleCodec } from '../src/design/DesignStyleCodec.js';
import { DesignSvgPaints } from '../src/design/DesignSvgPaints.js';
import {
    DesignImageFit,
    DesignPaintKind,
    type DesignNode,
    type DesignPaint,
    type DesignBox,
} from '../src/design/DesignTypes.js';
import { DesignAssetMime, type DesignAsset } from '../src/design/DesignAssetTypes.js';

it('preserves legacy paint records and latent image framing across paint mode changes', (): void => {
    const original: DesignPaint = {
        ...DesignDefaults.paint(),
        kind: DesignPaintKind.Image,
        assetId: 'photo',
    };
    expect(DesignStyleCodec.paint(original)).toEqual(original);
    expect(Object.hasOwn(DesignStyleCodec.paint(original), 'framing')).toBe(false);
    const framed: DesignPaint = {
        ...original,
        framing: { fit: DesignImageFit.Cover, cropX: 1, cropY: -1, scale: 2 },
    };
    expect(DesignStyleCodec.paint(framed)).toEqual(framed);
    expect(DesignStyleCodec.paint({ ...framed, kind: DesignPaintKind.Solid }).framing).toEqual(
        framed.framing,
    );
});

it('rejects incomplete, unsafe and out-of-range image framing without executing accessors', (): void => {
    const paint: DesignPaint = DesignDefaults.paint();
    for (const framing of [
        null,
        {},
        { fit: 'stretch', cropX: 0, cropY: 0, scale: 1 },
        { fit: 'cover', cropX: 2, cropY: 0, scale: 1 },
        { fit: 'cover', cropX: 0, cropY: Number.NaN, scale: 1 },
        { fit: 'cover', cropX: 0, cropY: 0, scale: 0 },
        { ...DesignDefaults.framing(), css: 'url(external)' },
    ]) {
        expect((): DesignPaint => DesignStyleCodec.paint({ ...paint, framing })).toThrow();
    }
    let calls: number = 0;
    const framing: Record<string, unknown> = { ...DesignDefaults.framing() };
    Object.defineProperty(framing, 'scale', {
        get: (): number => {
            calls++;
            return 1;
        },
    });
    expect((): DesignPaint => DesignStyleCodec.paint({ ...paint, framing })).toThrow();
    expect(calls).toBe(0);
});

it('exports cover crop and contain paints using one embedded asset and exact authored placement', (): void => {
    const asset: DesignAsset = {
        id: 'photo',
        name: 'Photo',
        mime: DesignAssetMime.Png,
        width: 64,
        height: 128,
        byteLength: '3',
        sha256: 'a'.repeat(64),
    };
    const paints: DesignSvgPaints = new DesignSvgPaints(
        new Map([['photo', { asset, base64: 'AAAA' }]]),
    );
    const box: DesignBox = {
        id: 'shape',
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        rotation: 0,
        depth: 0,
        clipId: null,
    };
    const base: DesignPaint = {
        ...DesignDefaults.paint(),
        kind: DesignPaintKind.Image,
        assetId: asset.id,
    };
    paints.paint(
        { ...base, framing: { fit: DesignImageFit.Cover, cropX: 1, cropY: -1, scale: 2 } },
        box,
    );
    paints.paint(
        { ...base, framing: { fit: DesignImageFit.Contain, cropX: 1, cropY: -1, scale: 2 } },
        box,
    );
    const svg: string = paints.definitions.join('');
    expect(svg).toContain('translate(-200 0) scale(6.25 6.25)');
    expect(svg).toContain('translate(75 0) scale(0.78125 0.78125)');
    expect(svg.match(/data:image\/png;base64,/gu)).toHaveLength(1);
});

it('accepts image framing on the actual save wire path and retains legacy payloads', (): void => {
    const node: DesignNode = DesignDefaults.node('card');
    const paint: DesignPaint = {
        ...DesignDefaults.paint(),
        kind: DesignPaintKind.Image,
        assetId: 'photo',
        framing: DesignDefaults.framing(),
    };
    const request: DesignSaveRequest = {
        id: 'design',
        expectedRevision: '1',
        commandId: 'image-crop',
        operations: [
            { op: 'update', id: node.id, changes: { style: { ...node.style, fills: [paint] } } },
        ],
    };
    expect(methodValidators[Method.DesignSave].params(request)).toBe(true);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                {
                    op: 'update',
                    id: node.id,
                    changes: {
                        style: {
                            ...node.style,
                            fills: [{ ...paint, framing: { ...paint.framing, cropX: 'invalid' } }],
                        },
                    },
                },
            ],
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.DesignSave].params({
            ...request,
            operations: [
                {
                    op: 'update',
                    id: node.id,
                    changes: { style: { ...node.style, fills: [DesignDefaults.paint()] } },
                },
            ],
        }),
    ).toBe(true);
});
