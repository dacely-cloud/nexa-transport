// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { DesignAssetCodec as Codec } from '../src/design/DesignAssetCodec.js';
import {
    DesignAssetLimits,
    type DesignAsset,
    type DesignAssetStartRequest,
    type DesignAssetSlice,
} from '../src/design/DesignAssetTypes.js';
import { DesignAssetReferences } from '../src/design/DesignAssetReferences.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import {
    DesignKind,
    DesignPaintKind,
    DesignImageFit,
    type DesignNode,
} from '../src/design/DesignTypes.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

const asset: DesignAsset = {
    id: 'photo',
    name: 'photo.png',
    mime: 'image/png',
    byteLength: '1',
    sha256: 'a'.repeat(64),
    width: 1,
    height: 1,
};
it('validates image admission and ready metadata through generated method contracts', (): void => {
    const request: DesignAssetStartRequest = {
        id: 'photo',
        name: 'photo.png',
        byteLength: '1',
        sha256: asset.sha256,
    };
    expect(methodValidators[Method.DesignAssetStart].params(request)).toBe(true);
    expect(
        methodValidators[Method.DesignAssetStart].params({
            id: 'photo',
            name: 'photo.png',
            byteLength: '1',
        }),
    ).toBe(false);
    expect(methodValidators[Method.DesignAssetFinish].result(asset)).toBe(true);
    expect(methodValidators[Method.DesignAssetCancel].result(null)).toBe(true);
    expect(methodValidators[Method.DesignAssetCancel].result({ ok: true })).toBe(false);
    expect(Codec.start(request)).toEqual(request);
    expect((): void => {
        Codec.start({ ...request, byteLength: (DesignAssetLimits.fileBytes + 1n).toString() });
    }).toThrow();
    expect((): void => {
        Codec.asset({ ...asset, width: 8192, height: 8192 });
    }).toThrow('megapixel');
});
it('rejects noncanonical bytes, oversized chunks, boundary gaps and false download continuations before allocation', (): void => {
    const slice: DesignAssetSlice = { asset, offset: '0', data: 'AA==', nextOffset: null };
    expect(Codec.slice(slice)).toEqual(slice);
    expect((): void => {
        Codec.slice({ ...slice, data: 'AB==' });
    }).toThrow('canonical');
    expect((): void => {
        Codec.slice({ ...slice, data: 'AAA=' });
    }).toThrow('boundaries');
    expect((): void => {
        Codec.slice({ ...slice, nextOffset: '1' });
    }).toThrow('boundaries');
    expect((): void => {
        Codec.base64('A'.repeat(DesignAssetLimits.chunkBytes * 2));
    }).toThrow();
    expect((): void => {
        Codec.position({ id: 'photo', offset: '1', byteLength: '2' });
    }).toThrow('acknowledgement');
    expect((): void => {
        Codec.page({ items: [asset], nextAfter: 'wrong' });
    }).toThrow('continuation');
    expect(Codec.page({ items: [asset], nextAfter: 'photo' })).toEqual({
        items: [asset],
        nextAfter: 'photo',
    });
});
it('finds unique durable references in image nodes, paint and component overrides on both sides of undo', (): void => {
    const base: DesignNode = DesignDefaults.node('image', DesignKind.Image);
    const image: DesignNode = {
        ...base,
        image: {
            assetId: 'image-asset',
            fit: DesignImageFit.Cover,
            cropX: 0.5,
            cropY: 0.5,
            scale: 1,
        },
        style: {
            ...base.style,
            fills: [
                { ...DesignDefaults.paint(), kind: DesignPaintKind.Image, assetId: 'paint-asset' },
            ],
        },
        overrides: [
            {
                nodeId: 'source',
                name: null,
                text: null,
                visible: null,
                style: {
                    ...base.style,
                    fills: [
                        {
                            ...DesignDefaults.paint(),
                            kind: DesignPaintKind.Image,
                            assetId: 'override-asset',
                        },
                    ],
                },
            },
        ],
    };
    expect(DesignAssetReferences.nodes([image, image])).toEqual([
        'image-asset',
        'override-asset',
        'paint-asset',
    ]);
    expect(
        DesignAssetReferences.changes({
            nodes: [{ id: image.id, before: image, after: null }],
            pages: [],
            metadata: null,
        }),
    ).toEqual(['image-asset', 'override-asset', 'paint-asset']);
});
